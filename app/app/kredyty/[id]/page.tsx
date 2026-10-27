import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { sprawaKredytowa } from "@/lib/data-kredyty";
import { formatPhone } from "@/lib/format";
import { Wstecz } from "@/app/app/components/wstecz";
import { Avatar } from "../../components/avatar";
import { Etapy, DaneSprawy, Dokumenty, Notatka } from "./sprawa";

export const dynamic = "force-dynamic";

const kiedy = (iso: string) =>
  new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(new Date(iso));

export default async function SprawaKredytowaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModul("kredyty");
  const { id } = await params;
  const dane = await sprawaKredytowa(user, id);
  if (!dane) notFound();
  const { sprawa: s, historia } = dane;
  const widziKlienta = user.role !== "credit_advisor";

  return (
    <>
      <Wstecz href="/app/kredyty">Kredyty</Wstecz>

      <div className="mb-5 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">{s.client.name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-2 text-sm">
            {s.client.phone && (
              <a href={`tel:${s.client.phone}`} className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200">
                📞 {formatPhone(s.client.phone)}
              </a>
            )}
            {s.client.email && (
              <a href={`mailto:${s.client.email}`} className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200">
                ✉️ {s.client.email}
              </a>
            )}
            {s.property && (
              <Link href={`/app/nieruchomosci/${s.property.id}`} className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200">
                🏠 {s.property.title}
              </Link>
            )}
            {widziKlienta && (
              <Link href={`/app/klienci/${s.client.id}`} className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200">
                Karta klienta
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {s.polecajacy && (
            <span className="flex items-center gap-2">
              <Avatar name={s.polecajacy.name} path={s.polecajacy.avatar} size={32} />
              <span>
                <span className="block text-xs text-slate-400">Polecił</span>
                <span className="font-medium text-slate-800">{s.polecajacy.name}</span>
              </span>
            </span>
          )}
          {s.doradca && (
            <span className="flex items-center gap-2">
              <Avatar name={s.doradca.name} path={s.doradca.avatar} size={32} />
              <span>
                <span className="block text-xs text-slate-400">Doradca</span>
                <span className="font-medium text-slate-800">{s.doradca.name}</span>
              </span>
            </span>
          )}
        </div>
      </div>

      <Etapy id={s.id} etap={s.stage} />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Kredyt</h2>
            <DaneSprawy id={s.id} s={{ rodzaj: s.rodzaj, kwota: s.amount_pln, bank: s.bank, prowizja: s.bank_commission_pln, zaPolecenie: s.referral_fee_pln, notatka: s.note }} />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 font-semibold text-slate-900">Dokumenty</h2>
            <p className="mb-3 text-sm text-slate-500">Odhaczaj, co klient już dostarczył. Agent widzi postęp na swojej tablicy.</p>
            <Dokumenty id={s.id} lista={s.documents} />
          </section>
        </div>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
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
