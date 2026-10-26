import { createSupabaseAdmin } from "./supabase/admin";
import { powiadom } from "./powiadomienia";

/**
 * Wiadomości z portalu klienta widziane od strony biura.
 *
 * Rozmowa należy do dostępu klienta (jeden link = jedna rozmowa). Agent widzi
 * rozmowy swoich klientów, a CEO, dyrektor i menedżer wszystkie w biurze:
 * klient pisze „do biura”, więc ktoś musi odpowiedzieć także pod nieobecność opiekuna.
 */

type Kto = { id: string; agency_id: string | null; role: string };

const widziWszystkie = (u: Kto) => u.role === "owner" || u.role === "director" || u.role === "manager";

export type Watek = {
  accessId: string;
  clientId: string;
  klient: string;
  opiekunId: string | null;
  aktywny: boolean;
  ostatnia: { tresc: string; autor: "klient" | "agent"; created_at: string } | null;
  nieprzeczytane: number;
};

export type WiadomoscWatku = { id: string; autor: "klient" | "agent"; tresc: string; created_at: string; read_at: string | null };

async function dostepyWidoczne(u: Kto) {
  if (!u.agency_id) return [];
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("client_portal_access")
    .select("id, client_id, revoked_at, expires_at, client:clients(name, agent_id)")
    .eq("agency_id", u.agency_id)
    .limit(1000);
  return ((data ?? []) as unknown as { id: string; client_id: string; revoked_at: string | null; expires_at: string | null; client: { name: string | null; agent_id: string | null } | null }[]).filter(
    (d) => widziWszystkie(u) || d.client?.agent_id === u.id,
  );
}

/** Lista rozmów: najpierw te z nieprzeczytanymi, potem po dacie ostatniej wiadomości. */
export async function watkiKlientow(u: Kto): Promise<{ ready: boolean; watki: Watek[] }> {
  const dostepy = await dostepyWidoczne(u);
  if (!dostepy.length) return { ready: true, watki: [] };
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("client_portal_messages")
    .select("access_id, autor, tresc, created_at, read_at")
    .in("access_id", dostepy.map((d) => d.id))
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) return { ready: false, watki: [] };

  const ostatnie = new Map<string, Watek["ostatnia"]>();
  const nowe = new Map<string, number>();
  for (const w of (data ?? []) as { access_id: string; autor: "klient" | "agent"; tresc: string; created_at: string; read_at: string | null }[]) {
    if (!ostatnie.has(w.access_id)) ostatnie.set(w.access_id, { tresc: w.tresc, autor: w.autor, created_at: w.created_at });
    if (w.autor === "klient" && !w.read_at) nowe.set(w.access_id, (nowe.get(w.access_id) ?? 0) + 1);
  }
  const watki: Watek[] = dostepy
    .filter((d) => ostatnie.has(d.id))
    .map((d) => ({
      accessId: d.id,
      clientId: d.client_id,
      klient: d.client?.name ?? "Klient",
      opiekunId: d.client?.agent_id ?? null,
      aktywny: !d.revoked_at,
      ostatnia: ostatnie.get(d.id) ?? null,
      nieprzeczytane: nowe.get(d.id) ?? 0,
    }))
    .sort((a, b) => (b.nieprzeczytane > 0 ? 1 : 0) - (a.nieprzeczytane > 0 ? 1 : 0) || (b.ostatnia?.created_at ?? "").localeCompare(a.ostatnia?.created_at ?? ""));
  return { ready: true, watki };
}

/** Suma nieprzeczytanych wiadomości od klientów, do plakietki w menu. */
export async function licznikWiadomosciKlientow(u: Kto): Promise<number> {
  const dostepy = await dostepyWidoczne(u);
  if (!dostepy.length) return 0;
  const { count } = await createSupabaseAdmin()
    .from("client_portal_messages")
    .select("id", { count: "exact", head: false })
    .in("access_id", dostepy.map((d) => d.id))
    .eq("autor", "klient")
    .is("read_at", null)
    .limit(1);
  return count ?? 0;
}

/** Jedna rozmowa. Otwarcie oznacza wiadomości klienta jako przeczytane. */
export async function watekKlienta(u: Kto, accessId: string): Promise<{ klient: string; clientId: string; aktywny: boolean; lista: WiadomoscWatku[] } | null> {
  const d = (await dostepyWidoczne(u)).find((x) => x.id === accessId);
  if (!d) return null;
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("client_portal_messages")
    .select("id, autor, tresc, created_at, read_at")
    .eq("access_id", accessId)
    .order("created_at", { ascending: true })
    .limit(500);
  const lista = (data ?? []) as WiadomoscWatku[];
  if (lista.some((w) => w.autor === "klient" && !w.read_at)) {
    await admin
      .from("client_portal_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("access_id", accessId)
      .eq("autor", "klient")
      .is("read_at", null);
  }
  return { klient: d.client?.name ?? "Klient", clientId: d.client_id, aktywny: !d.revoked_at, lista };
}

export async function mozeOdpisac(u: Kto, accessId: string): Promise<boolean> {
  return (await dostepyWidoczne(u)).some((x) => x.id === accessId && !x.revoked_at);
}

/**
 * Coś zrobił klient w portalu: dzwonek i push do opiekuna. Gdy klient nie ma
 * opiekuna, do CEO i menedżerów, żeby sprawa nie wisiała bez odpowiedzi.
 */
export async function powiadomOpiekuna(
  accessId: string,
  p: { tytul: (klient: string) => string; tresc: string; adres: (clientId: string) => string; znacznik?: string; pilne?: boolean },
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { data: d } = await admin
    .from("client_portal_access")
    .select("agency_id, client_id, client:clients(name, agent_id)")
    .eq("id", accessId)
    .maybeSingle();
  if (!d) return;
  const klient = (d.client as unknown as { name: string | null; agent_id: string | null } | null) ?? null;
  let odbiorcy: string[] = klient?.agent_id ? [klient.agent_id] : [];
  if (!odbiorcy.length) {
    const { data: szefowie } = await admin.from("profiles").select("id").eq("agency_id", d.agency_id).in("role", ["owner", "director", "manager"]);
    odbiorcy = (szefowie ?? []).map((x) => x.id as string);
  }
  await powiadom(d.agency_id as string, odbiorcy, {
    rodzaj: "portal",
    tytul: p.tytul(klient?.name ?? "klient"),
    tresc: p.tresc.length > 140 ? `${p.tresc.slice(0, 137)}…` : p.tresc,
    adres: p.adres(d.client_id as string),
    znacznik: p.znacznik,
    pilne: p.pilne,
  });
}

export function powiadomOWiadomosciKlienta(accessId: string, tresc: string): Promise<void> {
  return powiadomOpiekuna(accessId, {
    tytul: (k) => `Wiadomość od klienta: ${k}`,
    tresc,
    adres: () => `/app/wiadomosci?w=${accessId}`,
    znacznik: `portal-${accessId}`,
  });
}
