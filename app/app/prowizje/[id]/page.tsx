import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDeal } from "@/lib/data-platform";
import { mergeCard } from "@/lib/transaction-card";
import { DEAL_STATUSES } from "@/lib/types";
import { PageHeader, Card } from "../../components/ui";
import { formatPln } from "@/lib/format";
import { TransactionCardEditor } from "./transaction-card-editor";

type Props = { params: Promise<{ id: string }> };

export default async function DealDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const deal = await getDeal(id);
  if (!deal) notFound();
  if (deal.agent_id !== user.id) redirect("/app/prowizje");

  const card = mergeCard(deal.transaction_card);
  const status = DEAL_STATUSES.find((s) => s.value === deal.status);

  return (
    <>
      <Link href="/app/prowizje" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Prowizje
      </Link>

      <PageHeader
        title={deal.title}
        subtitle="Karta transakcji - pilnuj etapów i dokumentów. Zmiany zapisują się same."
        action={
          status && <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
        }
      />

      {/* Skrót finansowy */}
      <Card className="mb-6 !border-emerald-500/20 !bg-emerald-500/[0.04]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fin label="Wartość transakcji" value={deal.transaction_value_pln != null ? formatPln(deal.transaction_value_pln) : "-"} />
          <Fin label="Prowizja biura (brutto)" value={formatPln(deal.commission_pln)} />
          <Fin label="Twój udział" value={deal.agent_split_pct ? `${deal.agent_split_pct}%` : "-"} />
          <Fin label="Twój zarobek" value={formatPln(deal.agent_earnings_pln)} accent />
        </div>
      </Card>

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
