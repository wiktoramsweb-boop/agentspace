import { notFound } from "next/navigation";
import { dostepWlasciciela, lokaleWlasciciela, zgloszeniaWlasciciela } from "@/lib/data-wlasciciel";
import { ListaZgloszen, NoweZgloszenie } from "../widok";

export const dynamic = "force-dynamic";

export default async function Usterki({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  if (!d) notFound();
  const lokale = await lokaleWlasciciela(d);
  const lista = await zgloszeniaWlasciciela(d, lokale);
  return (
    <>
      <div className="portal-top">
        <h1>Usterki i przeglądy</h1>
      </div>
      <NoweZgloszenie token={token} lokale={lokale.map((l) => ({ id: l.id, adres: l.adres }))} />
      <ListaZgloszen token={token} lista={lista} />
    </>
  );
}
