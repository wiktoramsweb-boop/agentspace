import { requireUser } from "@/lib/auth";
import { maModul } from "@/lib/role";
import { PageHeader } from "../components/ui";
import { SettingsNav } from "./settings-nav";

export default async function UstawieniaLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isOwner = user.role === "owner";
  const maAbonament = maModul(
    { id: user.id, role: user.role, permissions: user.permissions },
    "abonament",
  );

  return (
    <>
      <PageHeader
        title="Ustawienia"
        subtitle={isOwner ? "Twój profil oraz ustawienia całego biura." : "Twój profil i preferencje."}
      />
      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <SettingsNav isOwner={isOwner} maAbonament={maAbonament} />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
