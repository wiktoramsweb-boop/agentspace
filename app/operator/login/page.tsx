import { redirect } from "next/navigation";
import { panelSkonfigurowany, sesjaWazna } from "@/lib/operator-auth";
import { FormularzLogowania } from "./formularz";

export const dynamic = "force-dynamic";

export default async function OperatorLoginPage() {
  if (await sesjaWazna()) redirect("/operator");

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5 text-lg font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          AgentSpace
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-zinc-300">
            operator
          </span>
        </div>

        {panelSkonfigurowany() ? (
          <FormularzLogowania />
        ) : (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
            Panel nie jest skonfigurowany. Ustaw zmienne <code>OPERATOR_LOGIN</code> i{" "}
            <code>OPERATOR_PASSWORD</code> w Vercel i wdroż ponownie.
          </p>
        )}
      </div>
    </div>
  );
}
