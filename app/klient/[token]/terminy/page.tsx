import { notFound } from "next/navigation";
import { dostepPoTokenie, dostepnoscKupujacego } from "@/lib/data-portal";
import { FormularzTerminu, UsunTermin } from "./formularz";

export const dynamic = "force-dynamic";

const DNI = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
const MIES = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];

function opisDnia(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${DNI[d.getDay()]}, ${d.getDate()} ${MIES[d.getMonth()]}`;
}

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
      <p className="portal-sub" style={{ marginBottom: 18 }}>
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
              <span className="portal-kropka zrobione" />
              <div style={{ flex: 1 }}>
                <b>{opisDnia(t.dzien)}</b>
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
