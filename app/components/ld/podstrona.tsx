import Image from "next/image";
import { Fragment, type CSSProperties, type ReactNode } from "react";

/* Klocki podstron marketingu. Ruch robi RuchPodstrony (atrybuty data-pd*),
   wygląd podstrona.css. Każdy klocek działa też bez JS: wtedy jest po prostu widoczny. */

const opoznienie = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

/** Nagłówek rozbity na słowa, które wjeżdżają kolejno spod maski. */
export function Slowa({ tekst, jako: Tag = "h1", className = "" }: { tekst: string; jako?: "h1" | "h2" | "h3"; className?: string }) {
  return (
    <Tag className={`pd-slowa ${className}`} data-pd="slowa" aria-label={tekst}>
      {tekst.split(" ").map((s, i) => (
        <Fragment key={i}>
          <span className="pd-slowo" aria-hidden="true">
            <span style={{ "--i": i } as CSSProperties}>{s}</span>
          </span>{" "}
        </Fragment>
      ))}
    </Tag>
  );
}

type Hero = {
  tlo: string;
  alt: string;
  eyebrow?: string;
  tytul: string;
  opis?: ReactNode;
  children?: ReactNode;
  /** pelny: zdjęcie na całą szerokość; okno: zdjęcie w dużym oknie pod tekstem; pas: tekst obok wysokiego zdjęcia. */
  wariant?: "pelny" | "okno" | "pas";
  podpis?: string;
  /** Pasek pod nagłówkiem (okruszki, fakty). */
  dol?: ReactNode;
};

export function PdHero({ tlo, alt, eyebrow, tytul, opis, children, wariant = "pelny", podpis, dol }: Hero) {
  const tekst = (
    <div className="pd-hero__tekst">
      {eyebrow && (
        <p className="mk-eyebrow" data-pd="gora">
          {eyebrow}
        </p>
      )}
      <Slowa tekst={tytul} />
      {opis && (
        <div className="pd-hero__opis" data-pd="gora" style={opoznienie(0.25)}>
          {opis}
        </div>
      )}
      {children && (
        <div className="pd-hero__akcje" data-pd="gora" style={opoznienie(0.35)}>
          {children}
        </div>
      )}
    </div>
  );

  if (wariant === "okno") {
    return (
      <section className="pd-hero pd-hero--okno">
        <div className="pd-ramka">{tekst}</div>
        <div className="pd-ramka">
          <figure className="pd-hero__okno" data-pd="skala">
            <div className="pd-hero__okno-in" data-pd-paralaksa="0.08">
              <Image src={tlo} alt={alt} fill priority sizes="100vw" className="object-cover" />
            </div>
            {podpis && <figcaption>{podpis}</figcaption>}
          </figure>
        </div>
        {dol && <div className="pd-ramka pd-hero__dol">{dol}</div>}
      </section>
    );
  }

  if (wariant === "pas") {
    return (
      <section className="pd-hero pd-hero--pas">
        <div className="pd-ramka pd-hero__siatka">
          {tekst}
          <figure className="pd-hero__pas" data-pd="maska">
            <Image src={tlo} alt={alt} fill priority sizes="(max-width: 900px) 100vw, 45vw" className="object-cover object-[72%_50%]" />
            {podpis && <figcaption>{podpis}</figcaption>}
          </figure>
        </div>
        {dol && <div className="pd-ramka pd-hero__dol">{dol}</div>}
      </section>
    );
  }

  return (
    <section className="pd-hero pd-hero--pelny">
      <div className="pd-hero__tlo" aria-hidden="true">
        <div className="pd-hero__tlo-in" data-pd-paralaksa="-0.12">
          <Image src={tlo} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
      </div>
      <div className="pd-ramka">{tekst}</div>
      {podpis && <p className="pd-ramka pd-hero__podpis">{podpis}</p>}
      {dol && <div className="pd-ramka pd-hero__dol">{dol}</div>}
    </section>
  );
}

/** Liczby, które odliczają się po wejściu w kadr. */
export function PdLiczby({ liczby }: { liczby: { wartosc: number; przyrostek?: string; opis: string }[] }) {
  return (
    <div className="pd-liczby">
      {liczby.map((l, i) => (
        <div key={l.opis} className="pd-liczba" data-pd="gora" style={opoznienie(i * 0.08)}>
          <b>
            <span data-pd-licznik={l.wartosc}>{l.wartosc.toLocaleString("pl-PL")}</span>
            {l.przyrostek}
          </b>
          <span>{l.opis}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Zdjęcie, które przy przewijaniu rozszerza się z zaokrąglonego okna na cały ekran,
 * a na końcu odsłania tekst. Używane na cenniku.
 */
export function PdRozwinOkno({ src, alt, eyebrow, tytul, tekst }: { src: string; alt: string; eyebrow: string; tytul: string; tekst: string }) {
  return (
    <section className="pd-rozwin pd-rozwin--okno" data-pd-rozwin="2.4">
      <div className="pd-rozwin__przyklej">
        <div className="pd-rozwin__kadr">
          <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" />
        </div>
        <div className="pd-rozwin__tekst">
          <p className="mk-eyebrow">{eyebrow}</p>
          <h2>{tytul}</h2>
          <p>{tekst}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Zdjęcie odsłaniane rosnącym kołem ze środka ekranu, a nagłówek nad nim
 * rozjeżdża się na boki. Inny ruch niż na cenniku, używany na „O nas”.
 */
export function PdRozwinKolo({ src, alt, lewa, prawa, cytat }: { src: string; alt: string; lewa: string; prawa: string; cytat: string }) {
  return (
    <section className="pd-rozwin pd-rozwin--kolo" data-pd-rozwin="2.2">
      <div className="pd-rozwin__przyklej">
        <p className="pd-kolo__slowo pd-kolo__slowo--l">{lewa}</p>
        <p className="pd-kolo__slowo pd-kolo__slowo--p">{prawa}</p>
        <div className="pd-rozwin__kadr">
          <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" />
        </div>
        <blockquote className="pd-kolo__cytat">{cytat}</blockquote>
      </div>
    </section>
  );
}

/**
 * Ekran przyklejony z boku, który zmienia się razem z tekstem kroków.
 * Na telefonie każdy krok ma swój ekran pod spodem.
 */
export function PdKroki({ kroki }: { kroki: { tytul: string; tekst: string; ekran: ReactNode; etykieta?: string }[] }) {
  return (
    <div className="pd-kroki" data-pd-kroki data-aktywny="0">
      <div className="pd-kroki__ekrany" aria-hidden="true">
        {kroki.map((k, i) => (
          <div key={k.tytul} className={`pd-kroki__ekran${i === 0 ? " on" : ""}`} data-pd-ekran={i}>
            {k.ekran}
          </div>
        ))}
      </div>
      <ol className="pd-kroki__lista">
        {kroki.map((k, i) => (
          <li key={k.tytul} className={`pd-krok${i === 0 ? " on" : ""}`} data-pd-krok>
            <span className="pd-krok__nr">{k.etykieta ?? String(i + 1).padStart(2, "0")}</span>
            <h3>{k.tytul}</h3>
            <p>{k.tekst}</p>
            <div className="pd-krok__ekran-tel">{k.ekran}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Przewijany pas haseł, np. lista modułów. */
export function PdPas({ hasla, odwrotnie = false }: { hasla: string[]; odwrotnie?: boolean }) {
  const lista = [...hasla, ...hasla];
  return (
    <div className={`pd-pas${odwrotnie ? " pd-pas--wstecz" : ""}`} aria-hidden="true">
      <div className="pd-pas__tor">
        {lista.map((h, i) => (
          <span key={i}>{h}</span>
        ))}
      </div>
    </div>
  );
}
