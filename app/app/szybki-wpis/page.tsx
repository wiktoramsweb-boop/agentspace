import { requireUser, requireModul } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { QuickEntry } from "./quick-entry";

export default async function SzybkiWpisPage() {
  await requireModul("klienci");
  return (
    <>
      <PageHeader
        title="Szybki wpis głosem"
        subtitle="Po rozmowie powiedz, co się wydarzyło. AI uzupełni klienta, nieruchomość, spotkanie w kalendarzu i zadania. Przed zapisem wszystko sprawdzisz."
      />
      <QuickEntry />
    </>
  );
}
