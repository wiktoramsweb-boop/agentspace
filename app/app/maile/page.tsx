import { requireUser } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { MailGenerator } from "./mail-generator";

export default async function MailePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader
        title="Asystent mailowy"
        subtitle="Wybierz typ wiadomości, wpisz fakty — AI napisze maila w tonie Spectry. Sprawdź, skopiuj, wyślij."
      />
      <MailGenerator defaultSignature={user.full_name ?? ""} />
    </>
  );
}
