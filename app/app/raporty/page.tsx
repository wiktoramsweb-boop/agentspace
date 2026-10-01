import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRaportWlasciciela, OKRESY, SZANSA_ETAPU, type Okres } from "@/lib/data-raporty";
import { PageHeader, Card } from "../components/ui";
import { formatPln } from "@/lib/format";
import { PROCESS_STAGES } from "@/lib/types";
import { Lejek } from "./lejek";
import { Tempo } from "./tempo";
import { PrzychodMiesiacami, UdzialZrodel } from "./wykresy";
import { EksportRaportu } from "./eksport";

type Props = { searchParams: Promise<{ okres?: string }> };

/**
 * Raporty dla właściciela biura.
 *
 * Celowo nie jest to ściana wykresów. Ekran odpowiada po kolei na cztery
 * pytania, które właściciel zadaje naprawdę: ile zarobimy, gdzie sypie się
 * lejek, skąd przychodzą pieniądze i kto pracuje. Każda sekcja ma pod spodem
 * zdanie mówiące, co z liczbą zrobić, bo sam wskaźnik niczego nie zmienia.
 */
export default async function RaportyPage({ searchParams }: Props) {
  const user = await requireUser();
  if (user.role === "agent") redirect("/app");
  if (!user.agency_id) redirect("/app");

  const { okres: param } = await searchParams;
  const okres = (OKRESY.find((o) => o.value === param)?.value ?? "kwartal") as Okres;
  const r = await getRaportWlasciciela(user.agency_id, okres);

  const etykietaOkresu = OKRESY.find((o) => o.value === okres)?.label ?? "";

  return (
    <>
      <PageHeader
        title="Raporty"
        subtitle="Cztery pytania właściciela: ile zarobimy, gdzie sypie się lejek, skąd przychodzą pieniądze i kto pracuje."
        action={
          <nav className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" aria-label="Okres raportu">
            {OKRESY.map((o) => (
              <Link
                key={o.value}
                href={`/app/raporty?okres=${o.value}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  o.value === okres
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {o.label}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <p className="text-sm text-slate-500">
          Raport na spotkanie zespołu albo dla wspólnika. Plik zapisuje się na dysk, druk otwiera
          gotowy PDF, więc na papier idzie raport, a nie okno aplikacji.
        </p>
        <EksportRaportu
          raport={r}
          nazwaBiura={user.agency?.name ?? "Biuro nieruchomości"}
          stopka={`${user.agency?.name ?? ""} · raport wygenerowany w AgentSpace`}
        />
      </div>

      {/* ── 1. Ile zarobimy ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Pieniądze · {etykietaOkresu.toLowerCase()}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kafelek
            label="Prowizja zamknięta"
            value={formatPln(r.pieniadze.zamknietePln)}
            sub={`${r.pieniadze.zamknieteSzt} transakcji`}
            accent
          />
          <Kafelek
            label="W toku (pełna wartość)"
            value={formatPln(r.pieniadze.wTokuPln)}
            sub={`${r.pieniadze.wTokuSzt} transakcji`}
          />
          <Kafelek
            label="Prognoza z pipeline'u"
            value={formatPln(r.pieniadze.prognozaPln)}
            sub="ważona etapem obsługi"
          />
          <Kafelek
            label="Skuteczność"
            value={r.pieniadze.skutecznosc != null ? `${r.pieniadze.skutecznosc}%` : "-"}
            sub={`${r.pieniadze.przepadloSzt} przepadło`}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-xs uppercase tracking-wider text-slate-500">Średnia prowizja</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {formatPln(r.pieniadze.sredniaProwizja)}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wider text-slate-500">Średni czas do zamknięcia</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {r.pieniadze.sredniDniDoZamkniecia != null
                ? `${r.pieniadze.sredniDniDoZamkniecia} dni`
                : "-"}
            </p>
          </Card>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Prognoza nie jest sumą wszystkiego, co w toku. Każdą transakcję mnożymy przez szansę
          przypisaną etapowi obsługi oferty:{" "}
          {PROCESS_STAGES.map((s) => `${s.short} ${Math.round(SZANSA_ETAPU[s.value] * 100)}%`).join(" · ")}.
          Te liczby są z doświadczenia, nie z modelu. Gdy zobaczycie własne wyniki, warto je poprawić.
        </p>
      </section>

      <section className="mb-8">
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Prowizja miesiąc po miesiącu
          </h2>
          <p className="mb-5 text-xs text-slate-400">
            Zawsze ostatnie 12 miesięcy, niezależnie od wybranego okresu. Trend widać dopiero
            na dłuższym kawałku niż jeden kwartał.
          </p>
          <PrzychodMiesiacami dane={r.przychodMiesiacami} />
        </Card>
      </section>

      {/* ── 2. Gdzie sypie się lejek ────────────────────────────────────── */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Lejek ofert
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Oferty przyjęte w tym okresie i to, jak daleko doszły.
          </p>
          <Lejek szczeble={r.lejekOfert} jednostka="ofert" />
        </Card>

        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Klienci według etapu
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Kontakty pozyskane w tym okresie, w podziale na status.
          </p>
          <Lejek szczeble={r.lejekKlientow} jednostka="kontaktów" />
        </Card>
      </section>

      {/* ── 3. Skąd przychodzą pieniądze ────────────────────────────────── */}
      <section className="mb-8">
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Źródła kontaktów
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Nie liczba kontaktów decyduje, tylko ile z nich zrobiło się pieniędzy.
          </p>
          <UdzialZrodel zrodla={r.zrodla} />
          {r.zrodla.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Brak danych. Źródło ustawia się na karcie kontaktu w polu „Skąd mamy klienta”.
            </p>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-2 font-medium">Źródło</th>
                    <th className="pb-2 text-right font-medium">Kontakty</th>
                    <th className="pb-2 text-right font-medium">Transakcje</th>
                    <th className="pb-2 text-right font-medium">Konwersja</th>
                    <th className="pb-2 text-right font-medium">Prowizja</th>
                  </tr>
                </thead>
                <tbody>
                  {r.zrodla.map((z) => (
                    <tr key={z.zrodlo} className="border-b border-slate-200 last:border-0">
                      <td className="py-2.5 font-medium text-slate-800">{z.label}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-600">{z.kontakty}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-600">{z.transakcje}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-600">
                        {z.konwersja != null ? `${z.konwersja}%` : "-"}
                      </td>
                      <td className="py-2.5 text-right font-semibold tabular-nums text-slate-900">
                        {formatPln(z.prowizja)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* ── 4. Kto pracuje ──────────────────────────────────────────────── */}
      <section className="mb-8">
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Zespół
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Aktywność obok wyniku. Kolumna „telefonów na transakcję” pokazuje, ile kosztuje jedna
            transakcja u danej osoby, więc widać i tych, którzy dzwonią bez skutku, i tych,
            którzy mają wynik bez aktywności.
          </p>
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-2 font-medium">Agent</th>
                  <th className="pb-2 text-right font-medium">Telefony</th>
                  <th className="pb-2 text-right font-medium">Spotkania</th>
                  <th className="pb-2 text-right font-medium">Nowe kontakty</th>
                  <th className="pb-2 text-right font-medium">Nowe oferty</th>
                  <th className="pb-2 text-right font-medium">Transakcje</th>
                  <th className="pb-2 text-right font-medium">Tel./transakcję</th>
                  <th className="pb-2 text-right font-medium">Prowizja</th>
                </tr>
              </thead>
              <tbody>
                {r.zespol.map((a) => (
                  <tr key={a.id} className="border-b border-slate-200 last:border-0">
                    <td className="py-2.5 font-medium text-slate-800">
                      <Link href={`/app/zespol/${a.id}`} className="hover:text-emerald-700">
                        {a.name}
                      </Link>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">{a.telefony}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">{a.spotkania}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">{a.nowychKontaktow}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">{a.nowychOfert}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">{a.transakcje}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">
                      {a.telefonowNaTransakcje ?? "-"}
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-slate-900">
                      {formatPln(a.prowizja)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Tempo pracy biura
          </h2>
          <p className="mb-4 text-xs text-slate-400">
            Wykonane działania tydzień po tygodniu, ostatnie 12 tygodni. Spadek widać tu wcześniej
            niż w prowizjach, bo prowizja przychodzi z opóźnieniem.
          </p>
          <Tempo dane={r.tempo} />
        </Card>
      </section>
    </>
  );
}

function Kafelek({
  label, value, sub, accent,
}: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <Card className={accent ? "!border-emerald-500/25 !bg-emerald-500/[0.05]" : undefined}>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${accent ? "text-emerald-700" : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}
