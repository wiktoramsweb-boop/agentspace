import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getAddonState } from "@/lib/site/addon";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PostsEditor, type PostRow } from "../site-forms";

export default async function WpisyPage() {
  const owner = await requireOwner();
  const addon = await getAddonState(owner.agency_id!);
  if (!addon.active) redirect("/app/ustawienia/strona");

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("site_posts")
    .select("*")
    .eq("agency_id", owner.agency_id!)
    .order("published_at", { ascending: false });

  const posts = (data ?? []) as unknown as PostRow[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Poradnik na stronie</h1>
        <p className="mt-1 text-sm text-slate-500">
          Wpisy pomagają wam wychodzić w Google na pytania, które i tak zadają klienci. Jeden porządny tekst miesięcznie
          w zupełności wystarczy.
        </p>
      </div>
      <PostsEditor posts={posts} />
    </div>
  );
}
