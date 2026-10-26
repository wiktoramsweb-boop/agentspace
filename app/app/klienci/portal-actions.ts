"use server";

import { revalidatePath } from "next/cache";
import { warsawToIso } from "@/lib/datetime";
import { after } from "next/server";
import { mozeOdpisac } from "@/lib/wiadomosci-klientow";
import { wyslijPushDoKlienta } from "@/lib/push";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { nowyToken, type RodzajDostepu } from "@/lib/portal-klienta";
import { idZBiura } from "@/lib/agency-ids";

/**
 * Zarządzanie dostępem klienta do portalu.
 *
 * Dostęp jest ZAWSZE przypisany do konkretnego klienta i do wskazanych
 * nieruchomości. Nie ma dostępu „do biura" - gdyby taki powstał, jeden
 * wyciekły link pokazywałby wszystko.
 */

export type WynikDostepu = { ok: true; token: string; id: string } | { ok: false; error: string };

export async function utworzDostepKlienta(
  clientId: string,
  rodzaj: RodzajDostepu,
): Promise<WynikDostepu> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Brak biura." };

  const admin = createSupabaseAdmin();

  // Klient musi być z tego biura. Bez tego wystarczyłoby cudze id.
  const czyNasz = await idZBiura(admin, "clients", clientId, user.agency_id);
  if (!czyNasz) return { ok: false, error: "Nie ma takiego klienta." };
  const token = nowyToken();

  const { data, error } = await admin
    .from("client_portal_access")
    .insert({
      agency_id: user.agency_id,
      client_id: clientId,
      token,
      rodzaj,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: String(error?.message).includes("does not exist")
        ? "Uruchom migrację v46 w Supabase."
        : "Nie udało się utworzyć dostępu.",
    };
  }

  // Sprzedającemu przypisujemy od razu jego nieruchomości. Agent może potem
  // dołożyć kolejne, ale start bez klikania jest ważniejszy.
  if (rodzaj === "sprzedajacy") {
    const { data: moje } = await admin
      .from("properties")
      .select("id")
      .eq("agency_id", user.agency_id)
      .eq("owner_client_id", clientId);

    const wiersze = (moje ?? []).map((p) => ({ access_id: data.id, property_id: p.id as string }));
    if (wiersze.length > 0) {
      await admin.from("client_portal_properties").upsert(wiersze, { onConflict: "access_id,property_id" });
    }
  }

  revalidatePath(`/app/klienci/${clientId}`);
  revalidatePath("/app/portal");
  return { ok: true, token, id: data.id as string };
}

export async function odwolajDostepKlienta(accessId: string, clientId: string): Promise<void> {
  const user = await requireUser();
  if (!user.agency_id) return;

  const admin = createSupabaseAdmin();
  await admin
    .from("client_portal_access")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", accessId)
    .eq("agency_id", user.agency_id);

  revalidatePath(`/app/klienci/${clientId}`);
}

/** Zatwierdzenie zdarzenia do pokazania klientowi. */
export async function udostepnijZdarzenie(
  activityId: string,
  widoczne: boolean,
  opisDlaKlienta: string,
): Promise<void> {
  const user = await requireUser();
  if (!user.agency_id) return;

  const admin = createSupabaseAdmin();
  await admin
    .from("activities")
    .update({
      client_visible: widoczne,
      // Opis dla klienta przycinamy, bo to ma być jedno zdanie, a nie notatka.
      client_note: widoczne ? opisDlaKlienta.trim().slice(0, 300) || null : null,
    })
    .eq("id", activityId)
    .eq("agency_id", user.agency_id);

  if (widoczne) {
    const { data: zd } = await admin.from("activities").select("property_id").eq("id", activityId).eq("agency_id", user.agency_id).maybeSingle();
    if (zd?.property_id) {
      const propertyId = zd.property_id as string;
      const opis = opisDlaKlienta.trim().slice(0, 140);
      after(async () => {
        const { powiadomKlientowONieruchomosci } = await import("@/lib/push");
        await powiadomKlientowONieruchomosci(propertyId, { title: "Nowość w Twojej sprawie", body: opis || "Biuro dodało nowy wpis.", tag: `oferta-${propertyId}` });
      });
    }
  }

  revalidatePath("/app/dzialania");
  revalidatePath("/app/nieruchomosci", "layout");
  revalidatePath("/app/klienci", "layout");
}

/** Push do konkretnego klienta, z linkiem w jego portal. Po odpowiedzi serwera, żeby agent nie czekał. */
function pushDoKlienta(accessId: string, title: string, body: string, sciezka = "") {
  after(async () => {
    const { data } = await createSupabaseAdmin().from("client_portal_access").select("token, revoked_at").eq("id", accessId).maybeSingle();
    if (!data?.token || data.revoked_at) return;
    await wyslijPushDoKlienta(accessId, { title, body, url: `/klient/${data.token}${sciezka}`, tag: `portal-${accessId}-${sciezka || "start"}`, icon: `/klient/${data.token}/ikona?r=192` });
  });
}

/* ─────────────── Praca z portalem przy nieruchomości ─────────────── */

/** Propozycja nowej ceny ofertowej do zatwierdzenia przez właściciela. */
export async function zaproponujCene(
  accessId: string,
  propertyId: string,
  cena: number,
  uzasadnienie: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Brak biura." };
  if (!Number.isFinite(cena) || cena <= 0) return { ok: false, error: "Podaj poprawną cenę." };

  const admin = createSupabaseAdmin();
  const { data: dostep } = await admin
    .from("client_portal_access")
    .select("id")
    .eq("id", accessId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!dostep) return { ok: false, error: "Nie ma takiego dostępu." };

  const { data: nier } = await admin
    .from("properties")
    .select("price_pln")
    .eq("id", propertyId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!nier) return { ok: false, error: "Nie ma takiej nieruchomości." };

  const { error } = await admin.from("client_price_proposals").insert({
    access_id: accessId,
    property_id: propertyId,
    cena_obecna: nier.price_pln,
    cena_proponowana: cena,
    uzasadnienie: uzasadnienie.trim().slice(0, 500) || null,
    created_by: user.id,
  });

  if (error) {
    return {
      ok: false,
      error: String(error.message).includes("does not exist")
        ? "Uruchom migrację v47 w Supabase."
        : "Nie udało się zapisać propozycji.",
    };
  }

  pushDoKlienta(accessId, "Propozycja nowej ceny", `Biuro proponuje ${Math.round(cena).toLocaleString("pl-PL")} zł. Potrzebna Twoja decyzja.`);

  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  return { ok: true };
}

/** Odpowiedź agenta na wiadomość klienta z portalu. */
export async function odpowiedzKlientowi(
  accessId: string,
  tresc: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Brak biura." };

  const czysta = tresc.trim().slice(0, 2000);
  if (czysta.length < 2) return { ok: false, error: "Napisz treść wiadomości." };

  const admin = createSupabaseAdmin();
  const { data: dostep } = await admin
    .from("client_portal_access")
    .select("id, client_id, token")
    .eq("id", accessId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!dostep || !(await mozeOdpisac(user, accessId))) return { ok: false, error: "Nie ma takiego dostępu." };

  const { error } = await admin
    .from("client_portal_messages")
    .insert({ access_id: accessId, autor: "agent", tresc: czysta });
  if (error) {
    return {
      ok: false,
      error: String(error.message).includes("does not exist")
        ? "Uruchom migrację v47 w Supabase."
        : "Nie udało się wysłać wiadomości.",
    };
  }

  // Push na telefon klienta: tylko tyle, że biuro odpisało. Treść zostaje w portalu.
  const imie = (user.full_name ?? "").split(" ")[0] || "Biuro";
  after(() =>
    wyslijPushDoKlienta(dostep.id as string, {
      title: `Nowa wiadomość od: ${imie}`,
      body: czysta.length > 120 ? `${czysta.slice(0, 117)}…` : czysta,
      url: `/klient/${dostep.token}/wiadomosci`,
      tag: `wiadomosc-${dostep.id}`,
      icon: `/klient/${dostep.token}/ikona?r=192`,
    }).then(() => undefined),
  );

  revalidatePath(`/app/klienci/${dostep.client_id}`);
  revalidatePath("/app/wiadomosci");
  return { ok: true };
}

/** Dopięcie albo odpięcie nieruchomości od dostępu klienta. */
export async function przypiszNieruchomosc(
  accessId: string,
  propertyId: string,
  przypisz: boolean,
): Promise<void> {
  const user = await requireUser();
  if (!user.agency_id) return;

  const admin = createSupabaseAdmin();
  const { data: dostep } = await admin
    .from("client_portal_access")
    .select("id, client_id")
    .eq("id", accessId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();
  if (!dostep) return;
  if (!(await idZBiura(admin, "properties", propertyId, user.agency_id))) return;

  if (przypisz) {
    await admin
      .from("client_portal_properties")
      .upsert({ access_id: accessId, property_id: propertyId }, { onConflict: "access_id,property_id" });
    pushDoKlienta(accessId, "Nowa nieruchomość w Twoim portalu", "Biuro dodało nieruchomość do Twojego podglądu. Zajrzyj.");
  } else {
    await admin
      .from("client_portal_properties")
      .delete()
      .eq("access_id", accessId)
      .eq("property_id", propertyId);
  }

  revalidatePath(`/app/nieruchomosci/${propertyId}`);
  revalidatePath(`/app/klienci/${dostep.client_id}`);
}

export type RodzajDzialaniaPortalu = "prezentacja" | "telefon" | "spotkanie" | "zadanie" | "informacja";

const MAPA_RODZAJU: Record<RodzajDzialaniaPortalu, { kind: string; purpose: string | null; temat: string }> = {
  prezentacja: { kind: "spotkanie", purpose: "prezentacja", temat: "Prezentacja nieruchomości" },
  telefon: { kind: "polaczenie", purpose: "rozmowa_aktualizacyjna", temat: "Rozmowa z klientem" },
  spotkanie: { kind: "spotkanie", purpose: null, temat: "Spotkanie z klientem" },
  zadanie: { kind: "zadanie", purpose: null, temat: "Zadanie w sprawie" },
  informacja: { kind: "wydarzenie", purpose: null, temat: "Informacja dla klienta" },
};

/**
 * Działanie dodane z portalu klienta: prawdziwe działanie biura (z typem,
 * statusem i terminem), przypięte do nieruchomości i klienta. Opis dla klienta
 * i widoczność decydują, co klient zobaczy w swojej aplikacji.
 */
export async function dodajDzialaniePortalu(
  accessId: string,
  d: {
    propertyId: string | null;
    rodzaj: RodzajDzialaniaPortalu;
    status: "zaplanowane" | "wykonane";
    data: string;
    godzina: string;
    temat: string;
    opisDlaKlienta: string;
    widoczne: boolean;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.agency_id) return { ok: false, error: "Brak biura." };
  const mapa = MAPA_RODZAJU[d.rodzaj];
  if (!mapa) return { ok: false, error: "Nieznany rodzaj działania." };
  if (!(await mozeOdpisac(user, accessId))) return { ok: false, error: "Nie ma takiego portalu." };

  const admin = createSupabaseAdmin();
  const { data: dostep } = await admin.from("client_portal_access").select("client_id").eq("id", accessId).maybeSingle();
  if (!dostep) return { ok: false, error: "Nie ma takiego portalu." };
  if (d.propertyId) {
    const { data: przyp } = await admin.from("client_portal_properties").select("property_id").eq("access_id", accessId).eq("property_id", d.propertyId).maybeSingle();
    if (!przyp) return { ok: false, error: "Ta nieruchomość nie jest w portalu klienta." };
  }

  const opis = d.opisDlaKlienta.trim().slice(0, 300);
  const temat = (d.temat.trim() || opis || mapa.temat).slice(0, 200);
  const kiedy = warsawToIso(d.data, d.godzina) ?? new Date().toISOString();
  const widoczne = d.widoczne && opis.length >= 2;

  const { data: nowe, error } = await admin
    .from("activities")
    .insert({
      agency_id: user.agency_id,
      created_by: user.id,
      kind: mapa.kind,
      purpose: mapa.purpose,
      subject: temat,
      status: d.status,
      priority: "normalny",
      due_at: kiedy,
      completed_at: d.status === "wykonane" ? new Date().toISOString() : null,
      property_id: d.propertyId,
      client_id: dostep.client_id,
      assignee_ids: [user.id],
    })
    .select("id")
    .single();
  if (error || !nowe) return { ok: false, error: "Nie udało się zapisać działania." };

  if (widoczne) {
    await admin.from("activities").update({ client_visible: true, client_note: opis }).eq("id", nowe.id);
    pushDoKlienta(accessId, d.status === "zaplanowane" ? "Nowy termin w Twojej sprawie" : "Nowość w Twojej sprawie", opis);
  }

  revalidatePath(`/app/portal/${accessId}`);
  revalidatePath("/app/dzialania");
  if (d.propertyId) revalidatePath(`/app/nieruchomosci/${d.propertyId}`);
  return { ok: true };
}

/** Zmiana statusu działania z poziomu portalu (np. zaplanowana prezentacja się odbyła). */
export async function statusDzialaniaPortalu(accessId: string, activityId: string, status: "wykonane" | "zaplanowane" | "anulowane"): Promise<void> {
  const user = await requireUser();
  if (!user.agency_id || !(await mozeOdpisac(user, accessId))) return;
  await createSupabaseAdmin()
    .from("activities")
    .update({ status, completed_at: status === "wykonane" ? new Date().toISOString() : null })
    .eq("id", activityId)
    .eq("agency_id", user.agency_id);
  revalidatePath(`/app/portal/${accessId}`);
  revalidatePath("/app/dzialania");
}
