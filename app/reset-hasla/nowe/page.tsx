import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthShell } from "../../components/auth/auth-shell";
import { NewPasswordForm } from "./new-password-form";

export default async function NowePasswordPage() {
  // Sesja odzyskiwania powinna być już ustawiona przez /reset-hasla/callback.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell
        title="Link nieprawidłowy"
        subtitle="Ten link do resetu wygasł lub został już użyty."
        footer={
          <Link href="/reset-hasla" className="text-emerald-400 hover:text-emerald-300">
            Poproś o nowy link
          </Link>
        }
      >
        <p className="text-sm text-zinc-400">
          Otwórz najświeższy link z maila na tym samym urządzeniu i w tej samej przeglądarce, w której
          prosiłaś/prosiłeś o reset. Jeśli nie działa — wygeneruj nowy.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Ustaw nowe hasło" subtitle={`Konto: ${user.email}`}>
      <NewPasswordForm />
    </AuthShell>
  );
}
