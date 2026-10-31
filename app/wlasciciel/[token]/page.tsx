import { notFound } from "next/navigation";
import Link from "next/link";
import { dostepWlasciciela, lokaleWlasciciela, zgloszeniaWlasciciela } from "@/lib/data-wlasciciel";
import { FORMY_UMOWY } from "@/lib/najem-model";
import { todayPL } from "@/lib/datetime";
import { KARTA } from "./widok";

export const dynamic = "force-dynamic";
const zl = (v: number) => `${v.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;

export default async function PulpitWlasciciela({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await dostepWlasciciela(token);
  if (!d) notFound();
  const lokale = await lokaleWlasciciela(d);
  const zgloszenia = await zgloszeniaWlasciciela(d, lokale);
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
      </section>
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
    </>
  );
}
