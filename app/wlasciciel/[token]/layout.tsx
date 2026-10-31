import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brandingBiura } from "@/lib/data-portal";
import { dostepWlasciciela, wiadomosciWlasciciela } from "@/lib/data-wlasciciel";
import { NawigacjaWlasciciela } from "./nawigacja";
import "../../klient/[token]/portal.css";

export const metadata: Metadata = { title: "Portal właściciela", robots: { index: false, follow: false } };

/** Portal właściciela wygląda jak portal klienta: te same karty, marka biura, pasek na dole. */
export default async function Uklad({ children, params }: { children: React.ReactNode; params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  if (!d) notFound();
  const [biuro, wiadomosci] = await Promise.all([brandingBiura(d.agency_id), wiadomosciWlasciciela(d.id)]);
  return (
    <div className="portal">
      <header className="portal-marka">
        <div>
          <span className="portal-inicjal" aria-hidden="true">
            {biuro.inicjal}
          </span>
          <div>
            <b>{biuro.nazwa}</b>
            <small>Portal właściciela</small>
          </div>
        </div>
      </header>
      <main className="portal-main">{children}</main>
      <NawigacjaWlasciciela token={token} nowa={wiadomosci.some((w) => w.autor === "biuro" && !w.read_at)} />
    </div>
  );
}
