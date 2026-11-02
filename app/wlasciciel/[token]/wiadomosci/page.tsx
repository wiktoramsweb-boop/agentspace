import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { dostepWlasciciela, wiadomosciWlasciciela } from "@/lib/data-wlasciciel";
import { Rozmowa } from "../widok";
import { PrzelacznikPowiadomien } from "../../../klient/[token]/powiadomienia";
import { wlaczPushWlasciciela, wylaczPushWlasciciela } from "../actions";

export const dynamic = "force-dynamic";

export default async function Wiadomosci({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  if (!d) notFound();
  const lista = await wiadomosciWlasciciela(d.id);
  await createSupabaseAdmin().from("rental_owner_messages").update({ read_at: new Date().toISOString() }).eq("access_id", d.id).eq("autor", "biuro").is("read_at", null);
  return (
    <>
      <div className="portal-top">
        <h1>Wiadomości</h1>
      </div>
      <PrzelacznikPowiadomien token={token} zacheta="Włącz powiadomienia, żeby od razu wiedzieć o rozliczeniu i odpowiedzi biura." wlacz={wlaczPushWlasciciela} wylacz={wylaczPushWlasciciela} />
      <Rozmowa token={token} lista={lista} />
    </>
  );
}
