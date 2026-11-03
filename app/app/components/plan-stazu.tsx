import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { postepAkademii } from "@/lib/data-akademia";
import { nazwaAkademii, stanAkademii } from "@/lib/techniki/akademia";
import { postepTeorii } from "@/lib/data-teoria";
import { maTeorie } from "@/lib/techniki/teoria";
import { PageHeader } from "./page-header";

type Krok = { tytul: string; opis: string; href: string; zrobione: boolean };

/**
 * Pulpit stażysty: plan pierwszych trzech dni zamiast klientów i prowizji,
 * których stażysta jeszcze nie ma. Każdy krok odhacza się sam z tego, co
 * zrobił w programie: lekcje i sprawdziany Akademii, treningi, wycena.
 */
export async function PlanStazu({ user }: { user: { id: string; agency_id: string | null; full_name: string | null; created_at?: string | null } }) {
  const admin = createSupabaseAdmin();
  const [akademia, teoria, sesje, oceny, wyceny] = await Promise.all([
    postepAkademii(user.agency_id, user.id),
    maTeorie(user.agency_id) ? postepTeorii(user.agency_id, user.id) : null,
    admin.from("training_sessions").select("id", { count: "exact", head: true }).eq("agent_id", user.id).eq("status", "completed"),
    admin.from("session_scores").select("overall").eq("agent_id", user.id).order("overall", { ascending: false }).limit(1),
    admin.from("valuations").select("id", { count: "exact", head: true }).eq("agent_id", user.id),
  ]);
  const a = stanAkademii(akademia.wpisy);
  const ileSesji = sesje.count ?? 0;
  const najlepsza = Number(oceny.data?.[0]?.overall ?? 0);
  const modul = (nr: number) => a.moduly.find((m) => m.nr === nr)?.ukonczony ?? false;
  const nazwa = nazwaAkademii(user.agency_id).krotka;
  const dzien = user.created_at ? Math.max(1, Math.floor((Date.now() - Date.parse(user.created_at)) / 86_400_000) + 1) : 1;

  const dni: { tytul: string; kroki: Krok[] }[] = [
    {
      tytul: "Dzień 1: podstawy rozmowy",
      kroki: [
        { tytul: `${nazwa}: moduł 1`, opis: "Lekcje i krótki sprawdzian.", href: "/app/techniki", zrobione: modul(1) },
        { tytul: "Pierwszy trening z klientem AI", opis: "Rozmowa głosem albo pisana, z oceną na końcu.", href: "/app/trening", zrobione: ileSesji >= 1 },
        { tytul: "Poznaj ofertę biura", opis: "Przejrzyj kilka ofert, zobacz opisy i ceny.", href: "/app/nieruchomosci", zrobione: false },
      ],
    },
    {
      tytul: "Dzień 2: obiekcje i pewność",
      kroki: [
        { tytul: `${nazwa}: moduły 2 i 3`, opis: "Obiekcje i prowadzenie rozmowy.", href: "/app/techniki", zrobione: modul(2) && modul(3) },
        { tytul: "Trzy treningi", opis: "Za każdym razem inna osobowość klienta.", href: "/app/trening", zrobione: ileSesji >= 3 },
        { tytul: "Ćwiczebna wycena z RCN", opis: "Wybierz ofertę biura i sprawdź ją w aktach.", href: "/app/wycena-rcn", zrobione: (wyceny.count ?? 0) >= 1 },
      ],
    },
    {
      tytul: "Dzień 3: gotowość do pracy",
      kroki: [
        { tytul: `${nazwa}: moduły 4, 5 i 6`, opis: "Spotkanie, negocjacje, zamknięcie.", href: "/app/techniki", zrobione: modul(4) && modul(5) && modul(6) },
        { tytul: "Egzamin końcowy", opis: "Podsumowanie całej ścieżki.", href: "/app/techniki", zrobione: a.egzamin.zaliczony },
        { tytul: "Rozmowa na 7 lub więcej", opis: "Pokaż, że umiesz przeprowadzić rozmowę do końca.", href: "/app/trening", zrobione: najlepsza >= 7 },
        ...(teoria
          ? [{ tytul: "Teoria: egzamin próbny", opis: "Prawo nieruchomości przed egzaminem po szkoleniu.", href: "/app/techniki?widok=teoria", zrobione: Boolean(teoria.testy["teoria-egzamin"]?.zaliczony) }]
          : []),
      ],
    },
  ];
  const wszystkie = dni.flatMap((d) => d.kroki);
  const zrobione = wszystkie.filter((k) => k.zrobione).length;
  const procent = Math.round((zrobione / wszystkie.length) * 100);
  const nastepny = wszystkie.find((k) => !k.zrobione);

  return (
    <>
      <PageHeader title={`Cześć, ${(user.full_name ?? "").split(" ")[0] || "witaj"}`} subtitle="Pierwsze dni w biurze: nauka rozmowy, oferta biura i trening z klientem AI." />
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20">
          <p className="text-sm text-slate-300">Dzień stażu {Math.min(dzien, 3)} z 3</p>
          <p className="mt-1 text-3xl font-bold">{procent}% planu za Tobą</p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(148, 163, 184, 0.3)" }}>
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(3, procent)}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-300">
            {zrobione} z {wszystkie.length} kroków. Lekcje {a.lekcjiZrobionych}/{a.lekcjiWszystkich}, treningi {ileSesji}.
          </p>
        </div>
        {nastepny ? (
          <Link href={nastepny.href} className="group flex flex-col justify-between rounded-3xl border border-emerald-200 bg-emerald-50 p-6 transition hover:border-emerald-400">
            <span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Teraz</span>
              <span className="mt-1 block text-xl font-semibold text-slate-900">{nastepny.tytul}</span>
              <span className="mt-1 block text-sm text-slate-600">{nastepny.opis}</span>
            </span>
            <span className="mt-4 text-sm font-bold text-emerald-700">Zaczynam →</span>
          </Link>
        ) : (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-xl font-semibold text-slate-900">Plan stażu zrobiony.</p>
            <p className="mt-1 text-sm text-slate-600">Daj znać opiekunowi: po zmianie roli na agenta dostaniesz klientów i pełną bazę.</p>
          </div>
        )}
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {dni.map((d, i) => (
          <section key={d.tytul} className={`rounded-3xl border bg-white p-5 ${i + 1 === Math.min(dzien, 3) ? "border-emerald-300" : "border-slate-200"}`}>
            <h2 className="mb-3 font-semibold text-slate-900">{d.tytul}</h2>
            <ul className="space-y-2">
              {d.kroki.map((k) => (
                <li key={k.tytul}>
                  <Link href={k.href} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-emerald-300">
                    <span className={`mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs font-bold ${k.zrobione ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`} aria-hidden="true">
                      {k.zrobione ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${k.zrobione ? "text-slate-500" : "text-slate-900"}`}>{k.tytul}</span>
                      <span className="block text-xs text-slate-500">{k.opis}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Jako stażysta przeglądasz oferty i trenujesz. Klientów, transakcje i edycję ofert odblokuje opiekun, gdy zmieni Twoją rolę na agenta.
      </p>
    </>
  );
}
