import Link from "next/link";
import { requireAktywny } from "@/lib/auth";
import { getAgencySettings } from "@/lib/agency-settings";
import { PageHeader } from "../components/ui";
import { Calculators } from "./calculators";

export default async function KalkulatoryPage() {
  const user = await requireAktywny();
  const settings = await getAgencySettings(user.agency_id, user.agency?.name);
  return (
    <>
      <div className="print-hide">
        <PageHeader
          title="Kalkulatory"
          subtitle="Policz przy kliencie ratę, koszty zakupu, rentowność najmu i koszt remontu, a potem wyślij mu ładny PDF."
          action={
            <Link
              href="/app/kalkulatory/remont"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              Kalkulator remontu →
            </Link>
          }
        />
      </div>
      <Calculators
        agent={{
          name: user.full_name ?? "Agent",
          // Dane biura z Ustawień → Dane firmy; gdy puste, rozsądne zastępstwa.
          email: settings.company.email ?? user.email ?? "",
          phone: user.phone ?? settings.company.phone ?? "",
          agency: settings.company.name ?? user.agency?.name ?? "Biuro nieruchomości",
          logoUrl: settings.logoUrl,
        }}
        kolorBiura={settings.options.offer_color}
      />
    </>
  );
}
