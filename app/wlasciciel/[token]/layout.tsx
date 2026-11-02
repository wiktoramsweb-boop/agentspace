import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brandingBiura } from "@/lib/data-portal";
import { dostepWlasciciela, wiadomosciWlasciciela } from "@/lib/data-wlasciciel";
import { NawigacjaWlasciciela } from "./nawigacja";
import { ZachetaInstalacji } from "../../klient/[token]/instalacja";
import "../../klient/[token]/portal.css";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  const nazwa = d ? (await brandingBiura(d.agency_id)).nazwa : "Portal właściciela";
  return {
    title: nazwa,
    robots: { index: false, follow: false },
    manifest: `/wlasciciel/${token}/manifest.webmanifest`,
    appleWebApp: { capable: true, statusBarStyle: "default", title: nazwa },
    icons: {
      icon: [{ url: `/wlasciciel/${token}/ikona?r=192`, sizes: "192x192", type: "image/png" }],
      apple: [{ url: `/wlasciciel/${token}/ikona?r=192`, sizes: "180x180", type: "image/png" }],
    },
  };
}

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
          {biuro.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/wlasciciel/${token}/ikona?r=192`} alt="" />
          ) : (
            <span className="portal-inicjal" aria-hidden="true">
              {biuro.inicjal}
            </span>
          )}
          <div>
            <b>{biuro.nazwa}</b>
            <small>Portal właściciela</small>
          </div>
        </div>
      </header>
      <main className="portal-main">
        <ZachetaInstalacji nazwaBiura={biuro.nazwa} />
        {children}
      </main>
      <NawigacjaWlasciciela token={token} nowa={wiadomosci.some((w) => w.autor === "biuro" && !w.read_at)} />
    </div>
  );
}
