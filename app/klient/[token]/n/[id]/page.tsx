import { notFound } from "next/navigation";
import Link from "next/link";
import { dostepPoTokenie, procesNieruchomosci } from "@/lib/data-portal";
import { PanelNieruchomosci } from "../../nieruchomosc";

export const dynamic = "force-dynamic";

export default async function WidokNieruchomosci({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) notFound();

  const dane = await procesNieruchomosci(dostep, id);
  if (!dane) notFound();

  return (
    <>
      <div className="portal-top">
        <Link href={`/klient/${token}`} className="portal-wstecz" aria-label="Wróć">
          ←
        </Link>
        <h1 style={{ fontSize: 19 }}>Szczegóły sprawy</h1>
      </div>
      <PanelNieruchomosci token={token} dane={dane} />
    </>
  );
}
