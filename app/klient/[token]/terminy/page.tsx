import { notFound } from "next/navigation";
import { dostepPoTokenie, dostepnoscKupujacego } from "@/lib/data-portal";
import { FormularzTerminu, UsunTermin } from "./formularz";
import { naglowekDnia } from "../wspolne";

export const dynamic = "force-dynamic";

/** Kupujący zaznacza, kiedy może oglądać. */
export default async function TerminyKupujacego({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep || dostep.rodzaj !== "kupujacy") notFound();

  const terminy = await dostepnoscKupujacego(dostep);

  return (
    <>
      <div className="portal-top">
        <h1>Kiedy możesz oglądać</h1>
      </div>
      <p className="portal-sub">
        Zaznacz dni i godziny, w których jesteś dostępny. Agent dopasuje do tego prezentacje.
      </p>

      <FormularzTerminu token={token} />

      <section className="portal-sekcja">
        <h3>Twoje terminy</h3>
        {terminy.length === 0 ? (
          <div className="portal-pusto">Nie zaznaczyłeś jeszcze żadnego terminu.</div>
        ) : (
          terminy.map((t) => (
            <div key={t.id} className="portal-zdarzenie">
              <span className="portal-ikonka zrobione">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{naglowekDnia(t.dzien)}</b>
                <p>
                  {String(t.od).slice(0, 5)} - {String(t.do_godz).slice(0, 5)}
                </p>
              </div>
              <UsunTermin token={token} id={t.id} />
            </div>
          ))
        )}
      </section>
    </>
  );
}
