"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { brakTabeli } from "@/lib/migracja";
import { powiadom } from "@/lib/powiadomienia";
import { signUploads, signedDownloadUrl } from "@/lib/storage-server";
import { DOC_BUCKET } from "@/lib/storage";

/**
 * Czat zespołu (v49).
 *
 * Każde biuro ma kanał „Ogólny" z całym zespołem, zakładany przy pierwszym
 * wejściu. Do tego grupy (np. „Zespół Bronowice") i rozmowy jeden na jeden.
 * Wiadomość może nieść odnośnik do klienta albo oferty: zamiast przepisywać
 * „ta trójka na Ruczaju za 830", agent wkleja kartę, w którą da się kliknąć.
 */

export type Odnosnik = { typ: "klient" | "oferta"; id: string; tytul: string; opis?: string | null; zdjecie?: string | null };
export type Zalacznik = { path: string; name: string; mime: string; size: number; url?: string | null };

export type Kanal = {
  id: string;
  kind: "ogolny" | "grupa" | "prywatny";
  name: string;
  /** Rozmowa prywatna: z kim. */
  z: string | null;
  last_message_at: string | null;
  nieprzeczytane: number;
  ostatnia: string | null;
  czlonkowie: string[];
};

export type Wiadomosc = {
  id: string;
  author_id: string | null;
  body: string;
  refs: Odnosnik[];
  attachments: Zalacznik[];
  reply_to: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

type Wynik<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function uzytkownik() {
  const user = await requireUser();
  if (!user.agency_id) throw new Error("Konto nie jest przypisane do biura.");
  return user as typeof user & { agency_id: string };
}

/** Kanał ogólny biura z całym zespołem. Dopisuje brakujące osoby (nowi w zespole). */
async function zapewnijOgolny(agencyId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  let { data: kanal } = await admin
    .from("chat_channels")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("kind", "ogolny")
    .maybeSingle();
  if (!kanal) {
    const { data } = await admin
      .from("chat_channels")
      .insert({ agency_id: agencyId, kind: "ogolny", name: "Ogólny", topic: "Cały zespół biura" })
      .select("id")
      .single();
    kanal = data;
  }
  if (!kanal) return;
  const [{ data: ludzie }, { data: czlonkowie }] = await Promise.all([
    admin.from("profiles").select("id").eq("agency_id", agencyId),
    admin.from("chat_members").select("user_id").eq("channel_id", kanal.id),
  ]);
  const sa = new Set((czlonkowie ?? []).map((c) => c.user_id as string));
  const brak = (ludzie ?? []).filter((l) => !sa.has(l.id as string));
  if (brak.length) {
    await admin
      .from("chat_members")
      .upsert(
        brak.map((l) => ({ channel_id: kanal!.id, user_id: l.id, agency_id: agencyId })),
        { onConflict: "channel_id,user_id", ignoreDuplicates: true },
      );
  }
}

export async function listaKanalow(): Promise<Wynik<{ kanaly: Kanal[] }> & { brakMigracji?: boolean }> {
  const user = await uzytkownik();
  const admin = createSupabaseAdmin();
  // Zwykłe zapytanie, nie HEAD: odpowiedź HEAD nie ma treści, więc błąd
  // „nie ma takiej tabeli" przychodzi bez kodu i nie da się go rozpoznać.
  const test = await admin.from("chat_channels").select("id").limit(1);
  if (brakTabeli(test.error)) return { ok: false, error: "brak migracji", brakMigracji: true };

  await zapewnijOgolny(user.agency_id);

  const { data: moje } = await admin.from("chat_members").select("channel_id, last_read_at").eq("user_id", user.id);
  const ids = (moje ?? []).map((m) => m.channel_id as string);
  if (!ids.length) return { ok: true, kanaly: [] };
  const przeczytane = new Map((moje ?? []).map((m) => [m.channel_id as string, m.last_read_at as string | null]));

  const [{ data: kanaly }, { data: wszyscy }] = await Promise.all([
    admin
      .from("chat_channels")
      .select("id, kind, name, last_message_at")
      .in("id", ids)
      .is("archived_at", null),
    admin.from("chat_members").select("channel_id, user_id").in("channel_id", ids),
  ]);

  const czlonkowie = new Map<string, string[]>();
  for (const c of wszyscy ?? []) {
    czlonkowie.set(c.channel_id as string, [...(czlonkowie.get(c.channel_id as string) ?? []), c.user_id as string]);
  }

  const wynik: Kanal[] = await Promise.all(
    (kanaly ?? []).map(async (k) => {
      const odKiedy = przeczytane.get(k.id as string) ?? "1970-01-01T00:00:00Z";
      const [{ count }, { data: ost }] = await Promise.all([
        admin
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", k.id)
          .gt("created_at", odKiedy)
          .neq("author_id", user.id)
          .is("deleted_at", null),
        admin
          .from("chat_messages")
          .select("body, refs, attachments")
          .eq("channel_id", k.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      const czl = czlonkowie.get(k.id as string) ?? [];
      const o = ost?.[0];
      const podglad = o
        ? (o.body as string)?.trim() ||
          ((o.refs as Odnosnik[])?.length ? `Udostępniono: ${(o.refs as Odnosnik[])[0].tytul}` : (o.attachments as Zalacznik[])?.length ? "Załącznik" : "")
        : null;
      return {
        id: k.id as string,
        kind: k.kind as Kanal["kind"],
        name: (k.name as string | null) ?? "",
        z: k.kind === "prywatny" ? czl.find((u) => u !== user.id) ?? null : null,
        last_message_at: k.last_message_at as string | null,
        nieprzeczytane: count ?? 0,
        ostatnia: podglad,
        czlonkowie: czl,
      };
    }),
  );
  wynik.sort((a, b) => {
    if (a.kind === "ogolny") return -1;
    if (b.kind === "ogolny") return 1;
    return (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "");
  });
  return { ok: true, kanaly: wynik };
}

async function czyCzlonek(channelId: string, userId: string): Promise<boolean> {
  const { data } = await createSupabaseAdmin()
    .from("chat_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

async function podpiszZalaczniki(lista: Wiadomosc[]): Promise<Wiadomosc[]> {
  return Promise.all(
    lista.map(async (w) =>
      w.attachments?.length
        ? {
            ...w,
            attachments: await Promise.all(
              w.attachments.map(async (a) => ({ ...a, url: await signedDownloadUrl(DOC_BUCKET, a.path, undefined, 3600) })),
            ),
          }
        : w,
    ),
  );
}

export async function wiadomosci(channelId: string, przed?: string | null): Promise<Wynik<{ lista: Wiadomosc[]; wiecej: boolean }>> {
  const user = await uzytkownik();
  if (!(await czyCzlonek(channelId, user.id))) return { ok: false, error: "Nie należysz do tej rozmowy." };
  let q = createSupabaseAdmin()
    .from("chat_messages")
    .select("id, author_id, body, refs, attachments, reply_to, created_at, edited_at, deleted_at")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(51);
  if (przed) q = q.lt("created_at", przed);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  const lista = (data ?? []) as Wiadomosc[];
  const wiecej = lista.length > 50;
  return { ok: true, lista: await podpiszZalaczniki(lista.slice(0, 50).reverse()), wiecej };
}

export async function przeczytane(channelId: string): Promise<void> {
  const user = await uzytkownik();
  await createSupabaseAdmin()
    .from("chat_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);
}

export async function wyslij(input: {
  channelId: string;
  body: string;
  refs?: Odnosnik[];
  attachments?: Zalacznik[];
  replyTo?: string | null;
}): Promise<Wynik<{ wiadomosc: Wiadomosc }>> {
  const user = await uzytkownik();
  if (!(await czyCzlonek(input.channelId, user.id))) return { ok: false, error: "Nie należysz do tej rozmowy." };
  const body = String(input.body ?? "").trim().slice(0, 4000);
  const refs = (input.refs ?? []).slice(0, 5);
  const attachments = (input.attachments ?? [])
    .filter((a) => typeof a.path === "string" && a.path.startsWith(`${user.agency_id}/czat/`))
    .slice(0, 10)
    .map((a) => ({ path: a.path, name: String(a.name).slice(0, 200), mime: String(a.mime).slice(0, 100), size: Number(a.size) || 0 }));
  if (!body && !refs.length && !attachments.length) return { ok: false, error: "Pusta wiadomość." };

  const admin = createSupabaseAdmin();
  // Odnośniki sprawdzamy w bazie: tytuł i zdjęcie bierzemy stamtąd, a nie
  // z przeglądarki, i tylko z własnego biura.
  const sprawdzone: Odnosnik[] = [];
  for (const r of refs) {
    if (r.typ === "klient") {
      const { data } = await admin.from("clients").select("id, name, type, budget_pln").eq("id", r.id).eq("agency_id", user.agency_id).maybeSingle();
      if (data) sprawdzone.push({ typ: "klient", id: data.id, tytul: data.name, opis: data.budget_pln ? `Budżet ${Number(data.budget_pln).toLocaleString("pl-PL")} zł` : null });
    } else if (r.typ === "oferta") {
      const { data } = await admin.from("properties").select("id, title, price_pln, area_m2, photos, deal_kind").eq("id", r.id).eq("agency_id", user.agency_id).maybeSingle();
      if (data) {
        const zdj = ((data.photos ?? []) as { url?: string }[])[0]?.url ?? null;
        const opis = [
          data.price_pln ? `${Number(data.price_pln).toLocaleString("pl-PL")} zł${data.deal_kind === "wynajem" ? "/mc" : ""}` : null,
          data.area_m2 ? `${data.area_m2} m²` : null,
        ].filter(Boolean).join(" · ");
        sprawdzone.push({ typ: "oferta", id: data.id, tytul: data.title, opis, zdjecie: zdj });
      }
    }
  }

  const teraz = new Date().toISOString();
  const { data, error } = await admin
    .from("chat_messages")
    .insert({
      channel_id: input.channelId,
      agency_id: user.agency_id,
      author_id: user.id,
      body,
      refs: sprawdzone,
      attachments,
      reply_to: input.replyTo || null,
    })
    .select("id, author_id, body, refs, attachments, reply_to, created_at, edited_at, deleted_at")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Nie udało się wysłać." };

  await Promise.all([
    admin.from("chat_channels").update({ last_message_at: teraz }).eq("id", input.channelId),
    admin.from("chat_members").update({ last_read_at: teraz }).eq("channel_id", input.channelId).eq("user_id", user.id),
  ]);

  // Push: w rozmowie prywatnej zawsze, w grupie tylko do wspomnianych (@Imię).
  const [{ data: kanal }, { data: czlonkowie }] = await Promise.all([
    admin.from("chat_channels").select("kind, name").eq("id", input.channelId).maybeSingle(),
    admin.from("chat_members").select("user_id, muted").eq("channel_id", input.channelId),
  ]);
  const inni = (czlonkowie ?? []).filter((c) => c.user_id !== user.id && !c.muted).map((c) => c.user_id as string);
  let odbiorcy: string[] = [];
  if (kanal?.kind === "prywatny") odbiorcy = inni;
  else if (body.includes("@")) {
    const { data: ludzie } = await admin.from("profiles").select("id, full_name").in("id", inni);
    const tekst = body.toLocaleLowerCase("pl-PL");
    odbiorcy = (ludzie ?? [])
      .filter((l) => {
        const imie = String(l.full_name ?? "").toLocaleLowerCase("pl-PL");
        const pierwsze = imie.split(/\s+/)[0];
        return (imie && tekst.includes(`@${imie}`)) || (pierwsze && tekst.includes(`@${pierwsze}`)) || tekst.includes("@wszyscy");
      })
      .map((l) => l.id as string);
  }
  if (odbiorcy.length) {
    const kto = user.full_name ?? "Ktoś z zespołu";
    await powiadom(user.agency_id, odbiorcy, {
      rodzaj: "czat",
      tytul: kanal?.kind === "prywatny" ? kto : `${kto} w #${kanal?.name ?? "czat"}`,
      tresc: body.slice(0, 160) || (sprawdzone.length ? `Udostępnił: ${sprawdzone[0].tytul}` : "Załącznik"),
      adres: `/app/czat?k=${input.channelId}`,
      znacznik: `czat-${input.channelId}`,
      wDzwonku: false,
    });
  }

  const [podpisana] = await podpiszZalaczniki([data as Wiadomosc]);
  return { ok: true, wiadomosc: podpisana };
}

export async function edytuj(id: string, body: string): Promise<Wynik> {
  const user = await uzytkownik();
  const tekst = String(body ?? "").trim().slice(0, 4000);
  if (!tekst) return { ok: false, error: "Wiadomość nie może być pusta." };
  const { error } = await createSupabaseAdmin()
    .from("chat_messages")
    .update({ body: tekst, edited_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_id", user.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function usun(id: string): Promise<Wynik> {
  const user = await uzytkownik();
  // Wiadomość znika z rozmowy, ale wiersz zostaje z pustą treścią: odpowiedzi
  // na nią nie tracą kontekstu, widać tylko, że została usunięta.
  const { error } = await createSupabaseAdmin()
    .from("chat_messages")
    .update({ body: "", refs: [], attachments: [], deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_id", user.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function nowaGrupa(nazwa: string, osoby: string[]): Promise<Wynik<{ id: string }>> {
  const user = await uzytkownik();
  const n = String(nazwa ?? "").trim().replace(/^#/, "").slice(0, 60);
  if (!n) return { ok: false, error: "Nazwij grupę." };
  const admin = createSupabaseAdmin();
  const { data: ludzie } = await admin.from("profiles").select("id").eq("agency_id", user.agency_id).in("id", osoby.slice(0, 100));
  const czlonkowie = [...new Set([user.id, ...(ludzie ?? []).map((l) => l.id as string)])];
  const { data: k, error } = await admin
    .from("chat_channels")
    .insert({ agency_id: user.agency_id, kind: "grupa", name: n, created_by: user.id })
    .select("id")
    .single();
  if (error || !k) return { ok: false, error: error?.message ?? "Nie udało się założyć grupy." };
  await admin.from("chat_members").insert(czlonkowie.map((u) => ({ channel_id: k.id, user_id: u, agency_id: user.agency_id })));
  return { ok: true, id: k.id as string };
}

export async function rozmowaZ(osobaId: string): Promise<Wynik<{ id: string }>> {
  const user = await uzytkownik();
  if (osobaId === user.id) return { ok: false, error: "To Ty." };
  const admin = createSupabaseAdmin();
  const { data: osoba } = await admin.from("profiles").select("id").eq("id", osobaId).eq("agency_id", user.agency_id).maybeSingle();
  if (!osoba) return { ok: false, error: "Nie ma takiej osoby w biurze." };

  // Istniejąca rozmowa prywatna tych dwóch osób.
  const { data: moje } = await admin.from("chat_members").select("channel_id").eq("user_id", user.id);
  const ids = (moje ?? []).map((m) => m.channel_id as string);
  if (ids.length) {
    const { data: wspolne } = await admin
      .from("chat_members")
      .select("channel_id")
      .eq("user_id", osobaId)
      .in("channel_id", ids);
    const kandydaci = (wspolne ?? []).map((w) => w.channel_id as string);
    if (kandydaci.length) {
      const { data: dm } = await admin.from("chat_channels").select("id").in("id", kandydaci).eq("kind", "prywatny").limit(1);
      if (dm?.length) return { ok: true, id: dm[0].id as string };
    }
  }
  const { data: k, error } = await admin
    .from("chat_channels")
    .insert({ agency_id: user.agency_id, kind: "prywatny", created_by: user.id })
    .select("id")
    .single();
  if (error || !k) return { ok: false, error: error?.message ?? "Nie udało się otworzyć rozmowy." };
  await admin.from("chat_members").insert([
    { channel_id: k.id, user_id: user.id, agency_id: user.agency_id },
    { channel_id: k.id, user_id: osobaId, agency_id: user.agency_id },
  ]);
  return { ok: true, id: k.id as string };
}

export async function wycisz(channelId: string, wyciszony: boolean): Promise<void> {
  const user = await uzytkownik();
  await createSupabaseAdmin()
    .from("chat_members")
    .update({ muted: wyciszony })
    .eq("channel_id", channelId)
    .eq("user_id", user.id);
}

export async function przygotujZalaczniki(channelId: string, pliki: { name: string; size: number }[]): Promise<Wynik<{ uploads: { path: string; signedUrl: string }[] }>> {
  const user = await uzytkownik();
  if (!(await czyCzlonek(channelId, user.id))) return { ok: false, error: "Nie należysz do tej rozmowy." };
  if (!pliki.length) return { ok: false, error: "Nie wybrano plików." };
  if (pliki.length > 10) return { ok: false, error: "Naraz do 10 plików." };
  const zaDuzy = pliki.find((p) => p.size > 25 * 1024 * 1024);
  if (zaDuzy) return { ok: false, error: `Plik ${zaDuzy.name} ma więcej niż 25 MB.` };
  const res = await signUploads(
    DOC_BUCKET,
    `${user.agency_id}/czat/${channelId}`,
    pliki.map((p) => ({ ext: (p.name.split(".").pop() ?? "").toLowerCase() })),
  );
  if (res.error) return { ok: false, error: res.error };
  return { ok: true, uploads: res.uploads.map((u) => ({ path: u.path, signedUrl: u.signedUrl })) };
}

/** Wyszukiwarka do wklejania karty klienta albo oferty w wiadomości. */
export async function szukajRekordow(fraza: string): Promise<Odnosnik[]> {
  const user = await uzytkownik();
  const q = String(fraza ?? "").replace(/[%,()*]/g, " ").trim().slice(0, 60);
  const admin = createSupabaseAdmin();
  const [{ data: k }, { data: o }] = await Promise.all([
    admin
      .from("clients")
      .select("id, name, budget_pln")
      .eq("agency_id", user.agency_id)
      .ilike("name", `%${q}%`)
      .order("updated_at", { ascending: false })
      .limit(6),
    admin
      .from("properties")
      .select("id, title, price_pln, photos")
      .eq("agency_id", user.agency_id)
      .or(`title.ilike.%${q}%,address.ilike.%${q}%,offer_no.ilike.%${q}%`)
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);
  return [
    ...(o ?? []).map((p) => ({
      typ: "oferta" as const,
      id: p.id as string,
      tytul: p.title as string,
      opis: p.price_pln ? `${Number(p.price_pln).toLocaleString("pl-PL")} zł` : null,
      zdjecie: ((p.photos ?? []) as { url?: string }[])[0]?.url ?? null,
    })),
    ...(k ?? []).map((c) => ({
      typ: "klient" as const,
      id: c.id as string,
      tytul: c.name as string,
      opis: c.budget_pln ? `Budżet ${Number(c.budget_pln).toLocaleString("pl-PL")} zł` : null,
    })),
  ];
}

/** Suma nieprzeczytanych do plakietki w menu. Jedno zapytanie o wiadomości zamiast osobnego na kanał. */
export async function licznikCzatu(): Promise<number | null> {
  const user = await requireUser();
  const admin = createSupabaseAdmin();
  const { data: moje, error } = await admin.from("chat_members").select("channel_id, last_read_at, muted").eq("user_id", user.id);
  if (error) return null;
  const aktywne = (moje ?? []).filter((m) => !m.muted);
  if (!aktywne.length) return 0;
  const od = aktywne.reduce((min, m) => {
    const t = (m.last_read_at as string | null) ?? "1970-01-01T00:00:00Z";
    return t < min ? t : min;
  }, "9999");
  const { data } = await admin
    .from("chat_messages")
    .select("channel_id, created_at")
    .in("channel_id", aktywne.map((m) => m.channel_id as string))
    .gt("created_at", od)
    .neq("author_id", user.id)
    .is("deleted_at", null)
    .limit(500);
  const granica = new Map(aktywne.map((m) => [m.channel_id as string, (m.last_read_at as string | null) ?? "1970-01-01T00:00:00Z"]));
  return (data ?? []).filter((w) => (w.created_at as string) > (granica.get(w.channel_id as string) ?? "")).length;
}
