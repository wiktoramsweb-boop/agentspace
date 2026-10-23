import { DNI_PROBNE } from "@/lib/abonament-cennik";
import { FormularzRejestracji } from "./formularz";

export const metadata = {
  title: "Załóż konto | AgentSpace",
  description: "Konto dla biura nieruchomości: pełny dostęp przez okres próbny, bez karty płatniczej.",
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const czysty = typeof email === "string" && /^[^\s@]{1,64}@[^\s@]{1,190}$/.test(email) ? email : "";
  return <FormularzRejestracji email={czysty} dniProbne={DNI_PROBNE} />;
}
