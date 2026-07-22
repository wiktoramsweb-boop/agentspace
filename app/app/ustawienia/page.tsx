import { requireUser } from "@/lib/auth";
import { PageHeader, Card } from "../components/ui";
import { SettingsForm } from "./settings-form";

export default async function UstawieniaPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Ustawienia" subtitle="Twój profil i preferencje." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-5 text-lg font-semibold text-white">Profil</h2>
          <SettingsForm
            fullName={user.full_name ?? ""}
            monthlyGoal={user.monthly_goal_pln ?? 0}
          />
        </Card>

        <Card>
          <h2 className="mb-5 text-lg font-semibold text-white">Konto</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd className="text-zinc-200">{user.email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Rola</dt>
              <dd className="text-zinc-200">
                {user.role === "owner" ? "Właściciel biura" : "Agent"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Biuro</dt>
              <dd className="text-zinc-200">{user.agency?.name ?? "—"}</dd>
            </div>
            {user.agency?.trial_ends_at && user.agency.plan === "trial" && (
              <div>
                <dt className="text-zinc-500">Okres próbny do</dt>
                <dd className="text-zinc-200">
                  {new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(
                    new Date(user.agency.trial_ends_at),
                  )}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>
    </>
  );
}
