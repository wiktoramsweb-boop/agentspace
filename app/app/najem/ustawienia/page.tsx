import { redirect } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { konfigBiura } from "@/lib/data-najem";
import { PageHeader } from "../../components/page-header";
import { Wstecz } from "../../components/wstecz";
import { WarunkiBiura } from "./formularz";

export const metadata = { title: "Warunki zarządzania najmem" };

export default async function UstawieniaNajmuPage() {
  const user = await requireModul("najem");
  if (user.role !== "owner" && user.role !== "director") redirect("/app/najem");
  const k = await konfigBiura(user.agency_id);
  return (
    <>
      <Wstecz href="/app/najem">Zarządzanie najmem</Wstecz>
      <PageHeader title="Warunki biura" subtitle="To, co oferujesz właścicielom. Nowe lokale startują z tymi wartościami, a wyłączone usługi znikają z list kroków." />
      <WarunkiBiura k={k} />
    </>
  );
}
