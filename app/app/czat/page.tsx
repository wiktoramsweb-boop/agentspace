import { requireAktywny } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { Czat } from "./czat";

export const metadata = { title: "Czat zespołu | AgentSpace" };

type Props = { searchParams: Promise<{ k?: string }> };

export default async function CzatPage({ searchParams }: Props) {
  const user = await requireAktywny();
  const { k } = await searchParams;
  const { data: ludzie } = await createSupabaseAdmin()
    .from("profiles")
    .select("id, full_name, avatar_path, job_title, role")
    .eq("agency_id", user.agency_id!)
    .order("full_name", { ascending: true });

  return (
    <Czat
      ja={user.id}
      agencyId={user.agency_id!}
      startowyKanal={k ?? null}
      ludzie={(ludzie ?? []).map((l) => ({
        id: l.id as string,
        name: (l.full_name as string | null) ?? "Osoba",
        avatar: (l.avatar_path as string | null) ?? null,
        stanowisko: (l.job_title as string | null) ?? null,
      }))}
    />
  );
}
