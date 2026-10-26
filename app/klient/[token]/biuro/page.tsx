import { notFound } from "next/navigation";
import { brandingBiura, dostepPoTokenie, opiekunKlienta } from "@/lib/data-portal";
import { ObieInstrukcje } from "../instalacja";
import { PrzelacznikPowiadomien } from "../powiadomienia";

export const dynamic = "force-dynamic";

/** Kontakt do biura, do agenta i instrukcja instalacji. */
export default async function BiuroKlienta({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dostep = await dostepPoTokenie(token);
  if (!dostep) notFound();

  const [biuro, agent] = await Promise.all([brandingBiura(dostep.agency_id), opiekunKlienta(dostep)]);

  return (
    <>
      <div className="portal-top">
        <h1>Biuro</h1>
      </div>
      <p className="portal-sub">
        Twoją sprawę prowadzi {biuro.nazwa}.
        {biuro.pelnaNazwa !== biuro.nazwa && (
          <>
            <br />
            <span style={{ fontSize: 13 }}>{biuro.pelnaNazwa}</span>
          </>
        )}
      </p>

      <div className="portal-info">
        <h3>Kontakt</h3>
        {agent && (
          <a className="portal-kontakt" href={agent.telefon ? `tel:${agent.telefon}` : undefined}>
            {agent.imie}
            <span>{agent.telefon ? "Twój agent · zadzwoń" : "Twój agent"}</span>
          </a>
        )}
        {biuro.telefon && (
          <a className="portal-kontakt" href={`tel:${biuro.telefon}`}>
            {biuro.telefon}
            <span>telefon do biura</span>
          </a>
        )}
        {biuro.email && (
          <a className="portal-kontakt" href={`mailto:${biuro.email}`}>
            {biuro.email}
            <span>e-mail</span>
          </a>
        )}
        {biuro.www && (
          <a className="portal-kontakt" href={biuro.www} target="_blank" rel="noopener noreferrer">
            {biuro.www.replace(/^https?:\/\//, "")}
            <span>strona</span>
          </a>
        )}
        {!agent && !biuro.telefon && !biuro.email && (
          <p>Dane kontaktowe znajdziesz na swojej umowie.</p>
        )}
      </div>

      <div className="portal-info">
        <h3>Dodaj na ekran telefonu</h3>
        <p>
          Po dodaniu otworzysz podgląd jednym stuknięciem, bez szukania linku, i zobaczysz
          powiadomienia o nowych terminach.
        </p>
        <ObieInstrukcje />
      </div>

      <div className="portal-info">
        <h3>Powiadomienia</h3>
        <p>
          Damy znać, gdy pojawi się nowa prezentacja albo coś się zmieni w sprawie. Bez
          reklam i bez pytania o zgodę po raz drugi.
        </p>
        <div style={{ marginTop: 12 }}>
          <PrzelacznikPowiadomien token={token} />
        </div>
      </div>

      <div className="portal-info">
        <h3>Prywatność</h3>
        <p>
          Ten podgląd jest przypisany tylko do Ciebie. Nie widzisz tu danych innych osób, a biuro
          w każdej chwili może dostęp wyłączyć. Nie przekazuj linku dalej.
        </p>
      </div>
    </>
  );
}
