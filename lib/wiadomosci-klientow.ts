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

export type DostepWidoczny = {
  id: string;
  client_id: string;
  revoked_at: string | null;
  expires_at: string | null;
  token: string;
  rodzaj: string;
  last_seen_at: string | null;
  created_at: string;
  client: { name: string | null; agent_id: string | null; phone: string | null } | null;
};

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

export async function dostepyWidoczne(u: Kto) {
  if (!u.agency_id) return [];
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("client_portal_access")
    .select("id, client_id, revoked_at, expires_at, token, rodzaj, last_seen_at, created_at, client:clients(name, agent_id, phone)")
    .eq("agency_id", u.agency_id)
    .limit(1000);
  return ((data ?? []) as unknown as DostepWidoczny[]).filter(
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

export type PortalKlienta = {
  accessId: string;
  clientId: string;
  klient: string;
  telefon: string | null;
  rodzaj: string;
  token: string;
  ostatnioWPortalu: string | null;
  utworzony: string;
  nieruchomosci: number;
  nieprzeczytane: number;
  ostatniaWiadomosc: string | null;
};

/** Aktywne portale klientów do jednego ekranu „Portal klienta”: kto ma dostęp, kto zagląda, gdzie czekają wiadomości. */
export async function portaleKlientow(u: Kto): Promise<PortalKlienta[]> {
  const dostepy = (await dostepyWidoczne(u)).filter((d) => !d.revoked_at && (!d.expires_at || d.expires_at >= new Date().toISOString().slice(0, 10)));
  if (!dostepy.length) return [];
  const admin = createSupabaseAdmin();
  const ids = dostepy.map((d) => d.id);
  const [{ data: wiad }, { data: przyp }] = await Promise.all([
    admin.from("client_portal_messages").select("access_id, autor, read_at, created_at").in("access_id", ids).order("created_at", { ascending: false }).limit(2000),
    admin.from("client_portal_properties").select("access_id").in("access_id", ids),
  ]);
  const nowe = new Map<string, number>();
  const ostatnia = new Map<string, string>();
  for (const w of (wiad ?? []) as { access_id: string; autor: string; read_at: string | null; created_at: string }[]) {
    if (!ostatnia.has(w.access_id)) ostatnia.set(w.access_id, w.created_at);
    if (w.autor === "klient" && !w.read_at) nowe.set(w.access_id, (nowe.get(w.access_id) ?? 0) + 1);
  }
  const ileNier = new Map<string, number>();
  for (const p of (przyp ?? []) as { access_id: string }[]) ileNier.set(p.access_id, (ileNier.get(p.access_id) ?? 0) + 1);
  return dostepy
    .map((d) => ({
      accessId: d.id,
      clientId: d.client_id,
      klient: d.client?.name ?? "Klient",
      telefon: d.client?.phone ?? null,
      rodzaj: d.rodzaj,
      token: d.token,
      ostatnioWPortalu: d.last_seen_at,
      utworzony: d.created_at,
      nieruchomosci: ileNier.get(d.id) ?? 0,
      nieprzeczytane: nowe.get(d.id) ?? 0,
      ostatniaWiadomosc: ostatnia.get(d.id) ?? null,
    }))
    .sort((a, b) => b.nieprzeczytane - a.nieprzeczytane || (b.ostatnioWPortalu ?? b.utworzony).localeCompare(a.ostatnioWPortalu ?? a.utworzony));
}

export type DzialaniePortalu = {
  id: string;
  kind: string;
  purpose: string | null;
  temat: string;
  status: string;
  kiedy: string | null;
  widoczne: boolean;
  opisDlaKlienta: string | null;
};

export type SprawaPortalu = {
  dostep: DostepWidoczny;
  nieruchomosci: {
    id: string;
    title: string;
    price_pln: number | null;
    zdjecie: string | null;
    process_stage: string | null;
    dzialania: DzialaniePortalu[];
    oczekujacaCena: number | null;
  }[];
  doDodania: { id: string; title: string }[];
  reakcje: { tytul: string; reakcja: string; created_at: string }[];
  /** Działania kupującego (bez nieruchomości). */
  dzialaniaKlienta: DzialaniePortalu[];
};

/**
 * Wszystko, czym agent zarządza w portalu jednego klienta: jego nieruchomości
 * z tym, co klient widzi na osi czasu, oczekujące propozycje ceny i reakcje
 * kupującego na wysłane oferty.
 */
export async function sprawaPortalu(u: Kto, accessId: string): Promise<SprawaPortalu | null> {
  const dostep = (await dostepyWidoczne(u)).find((x) => x.id === accessId);
  if (!dostep) return null;
  const admin = createSupabaseAdmin();
  const { data: przyp } = await admin.from("client_portal_properties").select("property_id").eq("access_id", accessId);
  const ids = (przyp ?? []).map((p) => p.property_id as string);

  const [{ data: props }, { data: zd }, { data: prop }, { data: wlasne }, { data: fb }] = await Promise.all([
    ids.length ? admin.from("properties").select("id, title, price_pln, photos, process_stage").in("id", ids).eq("agency_id", u.agency_id!) : Promise.resolve({ data: [] }),
    ids.length
      ? admin.from("activities").select("id, property_id, client_note, client_visible, subject, due_at, kind, purpose, status").in("property_id", ids).eq("agency_id", u.agency_id!).order("due_at", { ascending: false }).limit(300)
      : Promise.resolve({ data: [] }),
    admin.from("client_price_proposals").select("property_id, cena_proponowana, status").eq("access_id", accessId).eq("status", "oczekuje"),
    admin.from("properties").select("id, title").eq("agency_id", u.agency_id!).eq("owner_client_id", dostep.client_id).limit(50),
    admin.from("client_offer_feedback").select("property_id, reakcja, created_at").eq("access_id", accessId).order("created_at", { ascending: false }).limit(30),
  ]);

  type Wiersz = { id: string; property_id: string | null; client_note: string | null; client_visible: boolean | null; subject: string | null; due_at: string | null; kind: string; purpose: string | null; status: string };
  const naDzialanie = (a: Wiersz): DzialaniePortalu => ({
    id: a.id,
    kind: a.kind,
    purpose: a.purpose,
    temat: a.subject || a.client_note || "Działanie",
    status: a.status,
    kiedy: a.due_at,
    widoczne: Boolean(a.client_visible),
    opisDlaKlienta: a.client_note,
  });
  const { data: klientowe } =
    dostep.rodzaj === "kupujacy"
      ? await admin.from("activities").select("id, property_id, client_note, client_visible, subject, due_at, kind, purpose, status").eq("agency_id", u.agency_id!).eq("client_id", dostep.client_id).order("due_at", { ascending: false }).limit(40)
      : { data: [] };

  const fbIds = [...new Set(((fb ?? []) as { property_id: string }[]).map((f) => f.property_id))];
  const { data: fbProps } = fbIds.length ? await admin.from("properties").select("id, title").in("id", fbIds) : { data: [] };
  const tytuly = new Map(((fbProps ?? []) as { id: string; title: string }[]).map((p) => [p.id, p.title]));

  const pierwsze = (photos: unknown) => (Array.isArray(photos) ? ((photos.find((p) => p && typeof (p as { url?: string }).url === "string") as { url: string } | undefined)?.url ?? null) : null);
  return {
    dostep,
    nieruchomosci: ((props ?? []) as { id: string; title: string; price_pln: number | null; photos: unknown; process_stage: string | null }[]).map((p) => ({
      id: p.id,
      title: p.title,
      price_pln: p.price_pln,
      zdjecie: pierwsze(p.photos),
      process_stage: p.process_stage,
      dzialania: ((zd ?? []) as Wiersz[]).filter((a) => a.property_id === p.id).slice(0, 40).map(naDzialanie),
      oczekujacaCena: ((prop ?? []) as { property_id: string; cena_proponowana: number }[]).find((x) => x.property_id === p.id)?.cena_proponowana ?? null,
    })),
    doDodania: ((wlasne ?? []) as { id: string; title: string }[]).filter((p) => !ids.includes(p.id)),
    dzialaniaKlienta: ((klientowe ?? []) as Wiersz[]).map(naDzialanie),
    reakcje: ((fb ?? []) as { property_id: string; reakcja: string; created_at: string }[]).map((f) => ({ tytul: tytuly.get(f.property_id) ?? "Oferta", reakcja: f.reakcja, created_at: f.created_at })),
  };
}
