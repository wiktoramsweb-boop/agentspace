import { notFound } from "next/navigation";
import { akceptacje, dokumentyWlasciciela, dostepWlasciciela, lokaleWlasciciela } from "@/lib/data-wlasciciel";
import { docKindLabel } from "@/lib/documents-shared";
import { AkceptujDokument, KARTA, PobierzDokument } from "../widok";

export const dynamic = "force-dynamic";

export default async function Dokumenty({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  if (!d) notFound();
  const lokale = await lokaleWlasciciela(d);
  const [lista, zgody] = await Promise.all([dokumentyWlasciciela(lokale, d.agency_id), akceptacje(d.id)]);
  lista.sort((a, b) => Number(b.doAkceptacji && !zgody.has(b.id)) - Number(a.doAkceptacji && !zgody.has(a.id)));
  return (
    <>
      <div className="portal-top">
        <h1>Dokumenty</h1>
      </div>
      {lista.length === 0 && <p className="py-6 text-center text-sm text-[var(--t2)]">Biuro jeszcze nie dodało dokumentów.</p>}
      {lista.map((x) => (
        <section key={x.id} className={KARTA}>
          <PobierzDokument token={token} id={x.id} nazwa={x.nazwa} />
          <small className="block truncate text-[var(--t2)]">
            {docKindLabel("najem", x.rodzaj)} · {x.lokal}
          </small>
          {x.doAkceptacji && <AkceptujDokument token={token} id={x.id} zaakceptowano={zgody.get(x.id) ?? null} />}
        </section>
      ))}
    </>
  );
}
