import Link from "next/link";
import { requireUser, requireModul } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { WycenaForm } from "./wycena-form";

export const metadata = { title: "Wycena | AgentSpace" };

export default async function WycenaPage() {
  const user = await requireModul("nieruchomosci");

  return (
    <>
      <PageHeader
        title="Analiza cenowa"
        subtitle="Szacunek wartości na podstawie danych rynkowych z okolicy i transakcji Twojego biura."
        action={
          user.role === "owner" ? (
            <Link
              href="/app/wycena/dane"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Dane rynkowe
            </Link>
          ) : undefined
        }
      />
      <WycenaForm />
    </>
  );
}
