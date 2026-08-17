import { requireUser } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { MailGenerator } from "./mail-generator";

export default async function MailePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader
        title="Asystent wiadomości"
        subtitle="Maile i SMS-y do klientów. Wybierz temat, wpisz fakty - AI napisze w tonie Spectry. Sprawdź, skopiuj, wyślij."
      />
      <MailGenerator defaultSignature={user.full_name ?? ""} />
    </>
  );
}
