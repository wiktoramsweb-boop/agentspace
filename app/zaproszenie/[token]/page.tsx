import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { AuthShell } from "../../components/auth/auth-shell";
import { AcceptInviteForm } from "./accept-form";

type Props = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const admin = createSupabaseAdmin();

  const { data: invitation } = await admin
    .from("invitations")
    .select("*, agency:agencies(name)")
    .eq("token", token)
    .single();

  const invalid =
    !invitation ||
    invitation.status !== "pending" ||
    new Date(invitation.expires_at) < new Date();

  if (invalid) {
    return (
      <AuthShell
        title="Zaproszenie nieważne"
        subtitle="To zaproszenie wygasło lub zostało już wykorzystane."
        footer={
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
            Przejdź do logowania
          </Link>
        }
      >
        <p className="text-sm text-zinc-400">
          Poproś właściciela biura o wysłanie nowego zaproszenia.
        </p>
      </AuthShell>
    );
  }

  const agencyName = (invitation.agency as { name: string } | null)?.name ?? "biura";

  return (
    <AuthShell
      title="Dołącz do zespołu"
      subtitle={`Zostałeś zaproszony do ${agencyName}. Ustaw hasło, żeby zacząć.`}
    >
      <AcceptInviteForm token={token} email={invitation.email} />
    </AuthShell>
  );
}
