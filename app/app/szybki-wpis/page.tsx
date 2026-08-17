import { requireUser } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { QuickEntry } from "./quick-entry";

export default async function SzybkiWpisPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="Szybki wpis głosem"
        subtitle="Po spotkaniu powiedz relację - AI doda klienta, notatkę i nieruchomość do CRM."
      />
      <QuickEntry />
    </>
  );
}
