import { Wstecz } from "@/app/app/components/wstecz";
import { mozeEdytowacTransakcje } from "@/lib/uprawnienia";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDeal } from "@/lib/data-platform";
import { mergeCard } from "@/lib/transaction-card";
import { DEAL_STATUSES } from "@/lib/types";
import { PageHeader, Card } from "../../components/ui";
import { formatPln } from "@/lib/format";
import { TransactionCardEditor } from "./transaction-card-editor";
import { daneProwizji } from "@/lib/data-prowizje";
import { EdytujTransakcjeButton } from "../deal-controls";
import { podzialyTransakcji } from "@/lib/data-zasady-prowizji";
import { getAgencyMembers } from "@/lib/data";
import { PodzialProwizji } from "./podzial-prowizji";

type Props = { params: Promise<{ id: string }> };

export default async function DealDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const deal = await getDeal(id);
  if (!deal) notFound();
  // Kartę prowadzi opiekun transakcji; CEO może do niej zajrzeć i pomóc.
  if (deal.agency_id !== user.agency_id || !mozeEdytowacTransakcje(user, deal)) redirect("/app/prowizje");

  const card = mergeCard(deal.transaction_card);
  // Listy do wyboru bierzemy od opiekuna transakcji, także gdy poprawia ją CEO.
  const dane = await daneProwizji(deal.agent_id, deal.agency_id);
  const widok = dane.transakcje.find((t) => t.id === deal.id);
  const status = DEAL_STATUSES.find((s) => s.value === deal.status);
  const [podzialy, czlonkowie] = await Promise.all([podzialyTransakcji(deal.agency_id, deal.id), getAgencyMembers(deal.agency_id)]);

  return (
    <>
      <Wstecz href="/app/prowizje" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Prowizje
      </Wstecz>

      <PageHeader
        title={deal.title}
        subtitle={
          <>
            Karta transakcji - pilnuj etapów i dokumentów. Zmiany zapisują się same.
            {deal.property_id && (
              <>
                {" "}
                Tę samą kartę masz przy ofercie:{" "}
                <Link
                  href={`/app/nieruchomosci/${deal.property_id}?z=transakcja&t=${deal.id}`}
                  className="text-emerald-700 underline decoration-emerald-400 underline-offset-2"
                >
                  otwórz nieruchomość
                </Link>
                .
              </>
            )}
          </>
        }
        action={
          status && <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
        }
      />

      {/* Skrót finansowy */}
      <Card className="mb-6 !border-emerald-500/20 !bg-emerald-500/[0.04]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Kwoty</p>
          <EdytujTransakcjeButton
            edycja={{
              deal,
              oferta: widok?.oferta ? { id: widok.oferta.id, tytul: widok.oferta.adres, adres: widok.oferta.adres, cena: null } : null,
              klient: widok?.klient ?? null,
            }}
            oferty={dane.ofertyWybor}
            klienci={dane.klienciWybor}
            defaultSplit={deal.agent_split_pct || 50}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fin label="Wartość transakcji" value={deal.transaction_value_pln != null ? formatPln(deal.transaction_value_pln) : "-"} />
          <Fin label="Prowizja biura (brutto)" value={formatPln(deal.commission_pln)} />
          <Fin label="Twój udział" value={deal.agent_split_pct ? `${deal.agent_split_pct}%` : "-"} />
          <Fin label="Twój zarobek" value={formatPln(deal.agent_earnings_pln)} accent />
        </div>
      </Card>

      {podzialy.ready && (
        <Card className="mb-6">
          <p className="mb-1 text-sm font-semibold text-slate-900">Podział prowizji</p>
          <p className="mb-3 text-sm text-slate-500">Współagent, agent drugiej strony albo osoba, która poleciła klienta. Liczone od prowizji netto biura.</p>
          <PodzialProwizji
            dealId={deal.id}
            lista={podzialy.lista}
            udzialAgenta={deal.agent_split_pct ?? 0}
            osoby={czlonkowie
              .filter((m) => m.id !== deal.agent_id && m.role !== "accountant")
              .map((m) => ({ id: m.id, name: m.full_name ?? m.email ?? "Osoba" }))}
          />
        </Card>
      )}

      <TransactionCardEditor dealId={deal.id} initial={card} />
    </>
  );
}

function Fin({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 font-semibold ${accent ? "text-emerald-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
