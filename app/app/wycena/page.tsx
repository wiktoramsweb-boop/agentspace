import { requireUser } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { WycenaForm } from "./wycena-form";

export const metadata = { title: "Wycena | AgentSpace" };

export default async function WycenaPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="Analiza cenowa"
        subtitle="Szacunek wartości na podstawie transakcji Twojego biura i danych rynkowych z okolicy."
      />
      <WycenaForm />
    </>
  );
}
