import Link from "next/link";
import { Card } from "../../components/ui";
import { formatPln } from "@/lib/format";
import { mergeCard } from "@/lib/transaction-card";
import { DEAL_STATUSES } from "@/lib/types";
import type { DealWithCard } from "@/lib/data-platform";
import { TransactionCardEditor } from "../../prowizje/[id]/transaction-card-editor";
import { NewDealButton } from "../../prowizje/deal-controls";
import { mozeEdytowacTransakcje, widziPieniadzeTransakcji, type Kto } from "@/lib/uprawnienia";

/**
 * Karta transakcji przy ofercie.
 *
 * Wcześniej mieszkała tylko w Prowizjach i żeby do niej dojść, trzeba było
 * wyjść z oferty, odszukać transakcję na liście i dopiero w nią wejść. Agent
 * pracuje na ofercie, więc karta ma być tam, gdzie on.
 *
 * Gdy oferta ma kilka transakcji (np. sprzedaż po nieudanej rezerwacji),
 * wybraną trzymamy w adresie (`?t=`), żeby dało się wrócić do konkretnej.
 */
export function TransactionTab({
  propertyId,
  propertyTitle,
  propertyPrice,
  deals,
  wybranaId,
  defaultSplit,
  viewer,
}: {
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number | null;
  deals: DealWithCard[];
  wybranaId?: string;
  defaultSplit: number;
  /** Kto ogląda: od tego zależy, czy widzi kwoty i czy może edytować kartę. */
  viewer: Kto;
}) {
  if (!deals.length) {
    return (
      <Card>
        <div className="mx-auto max-w-lg py-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Ta oferta nie ma jeszcze transakcji</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Załóż ją, gdy dojdzie do rezerwacji albo umowy. Policzymy prowizję i Twój udział,
            a tutaj poprowadzisz etapy aż do aktu notarialnego.
          </p>
          <div className="mt-5 flex justify-center">
            <NewDealButton
              properties={[{ id: propertyId, title: propertyTitle, price_pln: propertyPrice }]}
              defaultSplit={defaultSplit}
            />
          </div>
        </div>
      </Card>
    );
  }

  const deal = deals.find((d) => d.id === wybranaId) ?? deals[0];
  const status = DEAL_STATUSES.find((s) => s.value === deal.status);
  const own = deal.agent_id === viewer.id;
  const canMoney = widziPieniadzeTransakcji(viewer, deal);
  const canEdit = mozeEdytowacTransakcje(viewer, deal);

  return (
    <div className="space-y-6">
      {deals.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Transakcje tej oferty
          </span>
          {deals.map((d) => (
            <Link
              key={d.id}
              href={`/app/nieruchomosci/${propertyId}?z=transakcja&t=${d.id}`}
              scroll={false}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                d.id === deal.id
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d.title}
            </Link>
          ))}
        </div>
      )}

      <Card className="!border-emerald-500/20 !bg-emerald-500/[0.04]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">{deal.title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {canEdit ? (
                <>
                  Zmiany na karcie zapisują się same.{" "}
                  <Link href={`/app/prowizje/${deal.id}`} className="text-emerald-700 underline decoration-emerald-400 underline-offset-2">
                    Otwórz w Prowizjach
                  </Link>
                </>
              ) : (
                "Podgląd. Kartę prowadzi opiekun transakcji."
              )}
            </p>
          </div>
          {status && (
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
          )}
        </div>
        {/* Kwoty widzi tylko opiekun transakcji i CEO, tak jak w Prowizjach. */}
        {canMoney ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fin label="Wartość transakcji" value={deal.transaction_value_pln != null ? formatPln(deal.transaction_value_pln) : "-"} />
            <Fin label="Prowizja biura (brutto)" value={formatPln(deal.commission_pln)} />
            <Fin label={own ? "Twój udział" : "Udział agenta"} value={deal.agent_split_pct ? `${deal.agent_split_pct}%` : "-"} />
            <Fin label={own ? "Twój zarobek" : "Zarobek agenta"} value={formatPln(deal.agent_earnings_pln)} accent />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Kwoty tej transakcji widzi jej opiekun i CEO.</p>
        )}
      </Card>

      <TransactionCardEditor key={deal.id} dealId={deal.id} initial={mergeCard(deal.transaction_card)} readOnly={!canEdit} />
    </div>
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
