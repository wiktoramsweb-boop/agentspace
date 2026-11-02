import { notFound } from "next/navigation";
import Link from "next/link";
import { akceptacje, dokumentyWlasciciela, dostepWlasciciela, lokaleWlasciciela, opiekunLokalu, zgloszeniaWlasciciela } from "@/lib/data-wlasciciel";
import { PrzelacznikPowiadomien } from "../../klient/[token]/powiadomienia";
import { wlaczPushWlasciciela, wylaczPushWlasciciela } from "./actions";
import { FORMY_UMOWY } from "@/lib/najem-model";
import { todayPL } from "@/lib/datetime";
import { KARTA, WykresRoku } from "./widok";

export const dynamic = "force-dynamic";
const zl = (v: number) => `${v.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;

export default async function PulpitWlasciciela({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  if (!d) notFound();
  const lokale = await lokaleWlasciciela(d);
  const [zgloszenia, opiekun, dokumenty, zaakceptowane] = await Promise.all([zgloszeniaWlasciciela(d, lokale), opiekunLokalu(lokale[0]?.id), dokumentyWlasciciela(lokale, d.agency_id), akceptacje(d.id)]);
  const doAkceptacji = dokumenty.filter((x) => x.doAkceptacji && !zaakceptowane.has(x.id)).length + lokale.flatMap((l) => l.miesiace).filter((m) => !zaakceptowane.has(m.id)).length;
  const dzis = todayPL();
  const terminy = [
    ...lokale.filter((l) => l.najem?.do_dnia).map((l) => ({ data: l.najem!.do_dnia!, tekst: `Koniec umowy najmu: ${l.adres}` })),
    ...zgloszenia.filter((z) => z.termin && z.termin >= dzis && z.stan !== "zamkniete").map((z) => ({ data: z.termin!, tekst: `${z.rodzaj === "przeglad" ? "Przegląd" : "Termin"}: ${z.tytul}` })),
  ].sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5);
  const zgody = zgloszenia.filter((z) => z.zgoda === "oczekuje").length;
  const otwarte = zgloszenia.filter((z) => z.stan !== "zamkniete").length;
  const rok = todayPL().slice(0, 4);
  const wRoku = lokale.flatMap((l) => l.miesiace).filter((m) => m.r.miesiac.startsWith(rok));
  const netto = wRoku.reduce((a, m) => a + m.r.wplaty - m.r.prowizja - m.r.koszty, 0);
  return (
    <>
      <div className="portal-top">
        <h1>Dzień dobry, {d.nazwa.split(" ")[0]}</h1>
      </div>
      <section className="mb-3 rounded-2xl bg-[var(--t)] p-5 text-white">
        <small className="opacity-70">Dla Ciebie w {rok}</small>
        <p className="text-3xl font-bold tabular-nums">{zl(netto)}</p>
        <small className="opacity-70">
          {lokale.length} {lokale.length === 1 ? "lokal" : "lokale"} w zarządzaniu
        </small>
        <WykresRoku miesiace={Array.from({ length: 12 }, (_, i) => `${rok}-${String(i + 1).padStart(2, "0")}`).map((m) => ({ m, netto: wRoku.filter((x) => x.r.miesiac === m).reduce((a, x) => a + x.r.wplaty - x.r.prowizja - x.r.koszty, 0) }))} />
      </section>
      {doAkceptacji > 0 && (
        <Link href={`/wlasciciel/${token}/${dokumenty.some((x) => x.doAkceptacji && !zaakceptowane.has(x.id)) ? "dokumenty" : "rozliczenia"}`} className="mb-3 block rounded-2xl bg-[var(--akcent-tlo)] p-4 font-semibold text-[var(--akcent)] no-underline">
          Do akceptacji: {doAkceptacji}
        </Link>
      )}
      {zgody > 0 && (
        <Link href={`/wlasciciel/${token}/usterki`} className="mb-3 block rounded-2xl bg-[var(--bursztyn-tlo)] p-4 font-semibold text-[var(--bursztyn)] no-underline">
          Koszty czekające na Twoją zgodę: {zgody}
        </Link>
      )}
      {otwarte > 0 && zgody === 0 && (
        <Link href={`/wlasciciel/${token}/usterki`} className="mb-3 block rounded-2xl bg-[var(--akcent-tlo)] p-4 font-semibold text-[var(--akcent)] no-underline">
          Sprawy w toku: {otwarte}
        </Link>
      )}
      {terminy.length > 0 && (
        <section className={KARTA}>
          <b>Najbliższe terminy</b>
          <ul className="mt-2 space-y-1.5 text-sm">
            {terminy.map((t) => (
              <li key={t.tekst + t.data} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-[var(--t2)]">{t.tekst}</span>
                <span className="flex-shrink-0 font-semibold tabular-nums">{t.data.split("-").reverse().join(".")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {lokale.map((l) => {
        const ostatni = l.miesiace[0];
        return (
          <section key={l.id} className={KARTA}>
            <b className="block">{l.adres}</b>
            <small className="text-[var(--t2)]">
              {l.pow ? `${Number(l.pow).toLocaleString("pl-PL")} m²` : ""}
              {l.pokoje ? ` · ${l.pokoje} pok.` : ""}
            </small>
            {l.najem ? (
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[var(--t2)]">Najemca</dt>
                  <dd className="font-semibold">{l.najemca ?? "Wynajęte"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--t2)]">Czynsz</dt>
                  <dd className="font-semibold tabular-nums">{zl(l.najem.czynsz)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--t2)]">Umowa</dt>
                  <dd className="font-semibold">{FORMY_UMOWY.find((f) => f.id === l.najem!.forma)?.nazwa}</dd>
                </div>
                <div>
                  <dt className="text-[var(--t2)]">Do kiedy</dt>
                  <dd className="font-semibold">{l.najem.do_dnia ? l.najem.do_dnia.split("-").reverse().join(".") : "bezterminowo"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--t2)]">Kaucja</dt>
                  <dd className="font-semibold tabular-nums">{zl(l.najem.kaucja)}</dd>
                </div>
                {ostatni && (
                  <div>
                    <dt className="text-[var(--t2)]">Ostatnie rozliczenie</dt>
                    <dd className="font-semibold tabular-nums">{ostatni.r.miesiac.slice(5)}/{ostatni.r.miesiac.slice(0, 4)}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-[var(--t2)]">Biuro szuka najemcy.</p>
            )}
          </section>
        );
      })}
      {opiekun && (
        <section className={`${KARTA} flex items-center gap-3`}>
          {opiekun.zdjecie ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={opiekun.zdjecie} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--tlo2)] font-bold">{opiekun.imie.charAt(0)}</span>
          )}
          <span className="min-w-0 flex-1">
            <small className="block text-[var(--t2)]">Twój opiekun</small>
            <b className="block truncate">{opiekun.imie}</b>
          </span>
          {opiekun.telefon && (
            <a href={`tel:${opiekun.telefon}`} className="rounded-xl bg-[var(--t)] px-4 py-2 text-sm font-semibold text-white no-underline">
              Zadzwoń
            </a>
          )}
        </section>
      )}
      <section className={KARTA}>
        <b className="mb-2 block">Powiadomienia na telefon</b>
        <PrzelacznikPowiadomien token={token} wlacz={wlaczPushWlasciciela} wylacz={wylaczPushWlasciciela} />
      </section>
    </>
  );
}
