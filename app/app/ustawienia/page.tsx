import { requireUser } from "@/lib/auth";
import { APP_TZ } from "@/lib/datetime";
import { ROLE_LABELS } from "@/lib/types";
import { Card } from "../components/ui";
import { SettingsForm } from "./settings-form";
import { AvatarUploader } from "./avatar-uploader";
import { avatarUrl } from "../components/avatar";
import { PushToggle } from "./push-toggle";
import { ChangeEmail } from "./change-email";

export default async function UstawieniaPage() {
  const user = await requireUser();
  const trialOver =
    !!user.agency?.trial_ends_at && new Date(user.agency.trial_ends_at) < new Date();

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Profil</h2>
          <div className="mb-6 border-b border-slate-200 pb-6">
            <AvatarUploader name={user.full_name ?? user.email ?? "?"} currentUrl={avatarUrl(user.avatar_path)} />
          </div>
          <SettingsForm
            jobTitle={user.job_title ?? ""}
            bio={user.bio ?? ""}
            fullName={user.full_name ?? ""}
            phone={user.phone ?? ""}
            monthlyGoal={user.monthly_goal_pln ?? 0}
            defaultSplit={user.default_split_pct ?? 50}
          />
        </Card>

        <Card>
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Konto</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-800">{user.email}</dd>
              <ChangeEmail currentEmail={user.email ?? ""} />
            </div>
            <div>
              <dt className="text-slate-500">Rola</dt>
              <dd className="text-slate-800">{ROLE_LABELS[user.role]}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Biuro</dt>
              <dd className="text-slate-800">{user.agency?.name ?? "-"}</dd>
            </div>
            {user.agency?.trial_ends_at && user.agency.plan === "trial" && (
              <div>
                {/* Po terminie zmieniamy etykietę, żeby data z przeszłości
                    nie wyglądała jak błąd aplikacji. */}
                <dt className="text-slate-500">
                  {trialOver ? "Okres próbny zakończony" : "Okres próbny do"}
                </dt>
                <dd className={trialOver ? "font-medium text-amber-600" : "text-slate-800"}>
                  {new Intl.DateTimeFormat("pl-PL", {
                    timeZone: APP_TZ,
                    dateStyle: "long",
                  }).format(new Date(user.agency.trial_ends_at))}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Powiadomienia</h2>
        <p className="mb-4 text-sm text-slate-500">
          Poranna odprawa i przypomnienia o kontakcie prosto na telefon.
        </p>
        <PushToggle />
      </Card>
    </>
  );
}
