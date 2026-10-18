import Image from "next/image";
import type { CSSProperties } from "react";
import type { ProductModule } from "@/lib/marketing/modules";
import { BrowserShot } from "@/app/components/mk/showcase";
import { ShotFor } from "@/app/components/mk/shot-for";
import { PdKroki } from "@/app/components/ld/podstrona";

/* Cztery układy treści podstrony modułu. Moduły dostają je na zmianę, więc
   sąsiednie strony nie wyglądają jak ten sam szablon z innym tytułem. */

type Wspolne = { mod: ProductModule; lang: string; scena: string; t: { problemEyebrow: string; problemTitle: string; capabilitiesEyebrow: string; capabilitiesTitle: string; forWhom: string } };
const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

function Ekran({ mod, lang, className = "" }: { mod: ProductModule; lang: string; className?: string }) {
  return (
    <BrowserShot fit className={className}>
      <ShotFor shot={mod.shot} lang={lang} />
    </BrowserShot>
  );
}

function Glowa({ eyebrow, tytul, opis, srodek = false }: { eyebrow: string; tytul: string; opis?: string; srodek?: boolean }) {
  return (
    <div className={`pd-glowa${srodek ? " pd-glowa--srodek" : ""}`}>
      <p className="mk-eyebrow" data-pd="gora">
        {eyebrow}
      </p>
      <h2 data-pd="gora" style={d(0.08)}>
        {tytul}
      </h2>
      {opis && (
        <p data-pd="gora" style={d(0.16)}>
          {opis}
        </p>
      )}
    </div>
  );
}

function Problem({ mod, scena, t, odwroc = false }: Wspolne & { odwroc?: boolean }) {
  return (
    <section className="pd-sekcja">
      <div className={`pd-ramka pm-problem${odwroc ? " pm-problem--odwroc" : ""}`}>
        <div>
          <Glowa eyebrow={t.problemEyebrow} tytul={t.problemTitle} />
          <p className="pm-problem__tekst" data-pd="gora" style={d(0.2)}>
            {mod.problem}
          </p>
        </div>
        <figure className="pd-zdjecie pm-problem__foto" data-pd="maska">
          <div data-pd-paralaksa="0.1">
            <Image src={scena} alt="" fill sizes="(max-width: 900px) 100vw, 45vw" className="object-cover" />
          </div>
        </figure>
      </div>
    </section>
  );
}

function DlaKogo({ mod, t }: Wspolne) {
  return (
    <section className="pd-sekcja pd-sekcja--ciasna">
      <div className="pd-ramka">
        <div className="pm-dla" data-pd="skala">
          <p className="mk-eyebrow">{t.forWhom}</p>
          <p className="pm-dla__tekst">{mod.forWhom}</p>
        </div>
      </div>
    </section>
  );
}

/** A: duży ekran, problem obok zdjęcia, możliwości jako kroki z przyklejonym ekranem. */
export function UkladKroki(p: Wspolne) {
  const { mod, lang, t } = p;
  return (
    <>
      <Problem {...p} />
      <section className="pd-sekcja">
        <div className="pd-ramka">
          <Glowa eyebrow={t.capabilitiesEyebrow} tytul={t.capabilitiesTitle.replace("{name}", mod.name)} />
          <PdKroki
            kroki={mod.capabilities.map((c, i) => ({
              tytul: c.title,
              tekst: c.body,
              ekran: i % 2 === 0 ? <Ekran mod={mod} lang={lang} /> : <div className="pm-wielka-liczba">{String(i + 1).padStart(2, "0")}<span>{c.title}</span></div>,
            }))}
          />
        </div>
      </section>
      <DlaKogo {...p} />
    </>
  );
}

/** B: siatka numerowanych kafli wjeżdżających po kolei, ekran pod spodem przechylony. */
export function UkladSiatka(p: Wspolne) {
  const { mod, lang, t } = p;
  return (
    <>
      <section className="pd-sekcja">
        <div className="pd-ramka">
          <Glowa srodek eyebrow={t.capabilitiesEyebrow} tytul={t.capabilitiesTitle.replace("{name}", mod.name)} />
          <div className="pm-siatka">
            {mod.capabilities.map((c, i) => (
              <div key={c.title} className="pm-kafel" data-pd="gora" style={d(i * 0.1)}>
                <span className="pm-kafel__nr">{String(i + 1).padStart(2, "0")}</span>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
          <div className="pm-pochylony" data-pd="skala">
            <Ekran mod={mod} lang={lang} />
          </div>
        </div>
      </section>
      <Problem {...p} odwroc />
      <DlaKogo {...p} />
    </>
  );
}

/** C: zygzak, każda możliwość na przemian z ekranem i zdjęciem, wjeżdża z boku. */
export function UkladZygzak(p: Wspolne) {
  const { mod, lang, t } = p;
  return (
    <>
      <Problem {...p} odwroc />
      <section className="pd-sekcja">
        <div className="pd-ramka">
          <Glowa eyebrow={t.capabilitiesEyebrow} tytul={t.capabilitiesTitle.replace("{name}", mod.name)} />
          <div className="pm-zygzak">
            {mod.capabilities.map((c, i) => (
              <div key={c.title} className={`pm-zygzak__wiersz${i % 2 ? " pm-zygzak__wiersz--odwroc" : ""}`}>
                <div data-pd={i % 2 ? "prawo" : "lewo"}>
                  <span className="pm-kafel__nr">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
                <div data-pd={i % 2 ? "lewo" : "prawo"} style={d(0.12)}>
                  {i === 0 ? (
                    <Ekran mod={mod} lang={lang} />
                  ) : (
                    <div className="pm-wielka-liczba pm-wielka-liczba--niska" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <DlaKogo {...p} />
    </>
  );
}

/** D: oś czasu z linią, ekran przyklejony obok. */
export function UkladOs(p: Wspolne) {
  const { mod, lang, t } = p;
  return (
    <>
      <section className="pd-sekcja">
        <div className="pd-ramka pm-os">
          <div className="pm-os__lewa">
            <Glowa eyebrow={t.capabilitiesEyebrow} tytul={t.capabilitiesTitle.replace("{name}", mod.name)} />
            <div className="pm-os__ekran" data-pd="skala">
              <Ekran mod={mod} lang={lang} />
            </div>
          </div>
          <ol className="pm-os__lista">
            {mod.capabilities.map((c, i) => (
              <li key={c.title} data-pd="gora" style={d(i * 0.06)}>
                <span className="pm-os__kropka" aria-hidden="true" />
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <Problem {...p} />
      <DlaKogo {...p} />
    </>
  );
}

export const UKLADY = [UkladKroki, UkladSiatka, UkladZygzak, UkladOs];
