import Link from "next/link";
import { AuthShell } from "../components/auth/auth-shell";
import { RequestResetForm } from "./request-reset-form";

export default async function ResetHaslaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell
      title="Nie pamiętasz hasła?"
      subtitle="Podaj email, na który założone jest konto — wyślemy link do ustawienia nowego hasła."
      footer={
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
          ← Wróć do logowania
        </Link>
      }
    >
      <RequestResetForm linkError={error === "link"} />
    </AuthShell>
  );
}
