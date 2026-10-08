import { notFound } from "next/navigation";
import { dostepPoTokenie, opiekunKlienta, wiadomosciKlienta } from "@/lib/data-portal";
import { Czat } from "./czat";

export const dynamic = "force-dynamic";

export default async function WiadomosciKlienta({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) notFound();

  const [{ ready, lista }, agent] = await Promise.all([
    wiadomosciKlienta(dostep),
    opiekunKlienta(dostep),
  ]);

  return (
    <>
      <div className="portal-top">
        <h1>Wiadomości</h1>
      </div>
      <p className="portal-sub">
        {agent ? `Piszesz bezpośrednio do osoby prowadzącej sprawę: ${agent.imie}.` : "Piszesz bezpośrednio do biura."}
      </p>

      {!ready ? (
        <div className="portal-pusto">Wiadomości będą dostępne za chwilę.</div>
      ) : (
        <Czat token={token} wiadomosci={lista} />
      )}
    </>
  );
}
