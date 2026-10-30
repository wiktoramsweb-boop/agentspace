import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { pulpitSprawy, sprawaKredytowa } from "@/lib/data-kredyty";
import { nastepnyKrok } from "@/lib/banki";
import { etapKredytu, RODZAJE_KREDYTU } from "@/lib/kredyt-etapy";
import { formatPhone, formatPln } from "@/lib/format";
import { Wstecz } from "@/app/app/components/wstecz";
import { Avatar } from "../../components/avatar";
import { Etapy, DaneSprawy, Dokumenty, FinanseKlienta, NastepnyKrok, Notatka, WnioskiBankowe } from "./sprawa";

export const dynamic = "force-dynamic";

const kiedy = (iso: string) =>
  new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(new Date(iso));

const CHIP = "inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200";

function Ikona({ d }: { d: string }) {
  return (
    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function Osoba({ tytul, o, brak }: { tytul: string; o: { name: string; avatar: string | null } | null; brak: string }) {
  return (
    <span className="flex items-center gap-2">
      {o && <Avatar name={o.name} path={o.avatar} size={36} />}
      <span>
        <span className="block text-xs text-slate-400">{tytul}</span>
        <span className="font-medium text-slate-800">{o?.name ?? brak}</span>
      </span>
    </span>
  );
}

export default async function SprawaKredytowaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModul("kredyty");
  const { id } = await params;
  const dane = await sprawaKredytowa(user, id);
  if (!dane) notFound();
  const { sprawa: s, historia } = dane;
  const widziKlienta = user.role !== "credit_advisor";
  const pulpit = await pulpitSprawy(id);
  const etap = etapKredytu(s.stage);
  const podpowiedz = nastepnyKrok(s.stage, s.documents.filter((d) => !d.jest).length, pulpit.wnioski);

  return (
    <>
      <Wstecz href="/app/kredyty">Kredyty</Wstecz>

      <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={s.client.name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-slate-900">{s.client.name}</h1>
              <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${etap.kolor}`}>{etap.nazwa}</span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              Kredyt {RODZAJE_KREDYTU.find((r) => r.id === s.rodzaj)?.nazwa.toLowerCase() ?? s.rodzaj}
              {s.amount_pln ? ` · ${formatPln(s.amount_pln)}` : ""}
              {` · sprawa od ${kiedy(s.created_at)}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {s.client.phone && (
                <a href={`tel:${s.client.phone}`} className={CHIP}>
                  <Ikona d="M3 5.500A2.5 2.5 0 0 1 5.5 3h1.300a1 1 0 0 1 .950.680l1.1 3.300a1 1 0 0 1-.500 1.200l-1.5.750a11 11 0 0 0 5.7 5.700l.750-1.500a1 1 0 0 1 1.2-.500l3.3 1.100a1 1 0 0 1 .680.950v1.300A2.5 2.5 0 0 1 18 21C9.7 21 3 14.3 3 6v-.500Z" />
                  {formatPhone(s.client.phone)}
                </a>
              )}
              {s.client.email && (
                <a href={`mailto:${s.client.email}`} className={CHIP}>
                  <Ikona d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0 9 6 9-6" />
                  {s.client.email}
                </a>
              )}
              {s.property && (
                <Link href={`/app/nieruchomosci/${s.property.id}`} className={CHIP}>
                  <Ikona d="M3 21h18M5 21V7l7-4 7 4v14M10 21v-4h4v4" />
                  {s.property.title}
                </Link>
              )}
              {widziKlienta && (
                <Link href={`/app/klienci/${s.client.id}`} className={CHIP}>
                  Karta klienta
                </Link>
              )}
            </div>
          </div>
          <div className="flex gap-5 text-sm">
            <Osoba tytul="Polecił" o={s.polecajacy} brak="Klient własny" />
            <Osoba tytul="Doradca" o={s.doradca} brak="Nieprzypisany" />
          </div>
        </div>
      </section>

      <Etapy id={s.id} etap={s.stage} />

      <div className="mt-5">
        <NastepnyKrok key={pulpit.krok ?? "krok"} id={s.id} podpowiedz={podpowiedz} krok={pulpit.krok} data={pulpit.krokData} />
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Banki i wnioski</h2>
            <p className="mb-3 text-sm text-slate-500">Kliknij bank, do którego składasz wniosek. Status i warunki ustawisz niżej, a etap sprawy pójdzie za nimi.</p>
            <WnioskiBankowe id={s.id} wnioski={pulpit.wnioski} gotowe={pulpit.gotowe} />
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Sytuacja finansowa klienta</h2>
            <FinanseKlienta id={s.id} kwota={s.amount_pln} finanse={pulpit.finanse} />
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 font-semibold text-slate-900">Dokumenty</h2>
            <p className="mb-3 text-sm text-slate-500">Odhaczaj, co klient już dostarczył. Agent widzi postęp na swojej tablicy.</p>
            <Dokumenty id={s.id} lista={s.documents} />
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Dane kredytu i rozliczenie</h2>
            <DaneSprawy id={s.id} s={{ rodzaj: s.rodzaj, kwota: s.amount_pln, bank: s.bank, prowizja: s.bank_commission_pln, zaPolecenie: s.referral_fee_pln, notatka: s.note }} />
          </section>
        </div>

        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 lg:sticky lg:top-4">
          <h2 className="mb-3 font-semibold text-slate-900">Historia i notatki</h2>
          <Notatka id={s.id} />
          <ul className="mt-4 space-y-2">
            {historia.map((h) => (
              <li key={h.id} className={`rounded-xl px-3 py-2 text-sm ${h.kind === "etap" ? "bg-slate-50 text-slate-600" : "border border-slate-200 text-slate-800"}`}>
                <span className="whitespace-pre-wrap">{h.text}</span>
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  {h.autor ? `${h.autor} · ` : ""}
                  {kiedy(h.created_at)}
                </span>
              </li>
            ))}
            {historia.length === 0 && <li className="text-sm text-slate-400">Brak wpisów.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
