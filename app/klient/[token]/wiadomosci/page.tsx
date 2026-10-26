import { notFound } from "next/navigation";
import { dostepPoTokenie, opiekunKlienta, oznaczPrzeczytaneKlienta, wiadomosciKlienta } from "@/lib/data-portal";
import { Czat } from "./czat";
import { PrzelacznikPowiadomien } from "../powiadomienia";

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
    oznaczPrzeczytaneKlienta(dostep).catch(() => undefined),
  ]);

  return (
    <>
      <div className="portal-rozmowca">
        {agent?.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agent.zdjecie} alt="" />
        ) : (
          <span aria-hidden="true">{(agent?.imie ?? "B").charAt(0).toUpperCase()}</span>
        )}
        <div>
          <b>{agent?.imie ?? "Biuro"}</b>
          <small>{agent ? "Prowadzi Twoją sprawę · odpowie tutaj" : "Odpowiemy tutaj"}</small>
        </div>
      </div>

      <PrzelacznikPowiadomien token={token} zacheta="Włącz powiadomienia, żeby wiedzieć, kiedy przyjdzie odpowiedź." />

      {!ready ? (
        <div className="portal-pusto">Wiadomości będą dostępne za chwilę.</div>
      ) : (
        <Czat token={token} wiadomosci={lista} agent={agent?.imie ?? null} />
      )}
    </>
  );
}
