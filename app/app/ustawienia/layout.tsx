import { requireUser } from "@/lib/auth";
import { PageHeader } from "../components/ui";
import { SettingsNav } from "./settings-nav";

export default async function UstawieniaLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isOwner = user.role === "owner";

  return (
    <>
      <PageHeader
        title="Ustawienia"
        subtitle={isOwner ? "Twój profil oraz ustawienia całego biura." : "Twój profil i preferencje."}
      />
      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <SettingsNav isOwner={isOwner} />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
