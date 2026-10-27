import { notFound, redirect } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { postepAkademii } from "@/lib/data-akademia";
import { sprawdzian, stanAkademii } from "@/lib/techniki/akademia";
import { TECHNIKI } from "@/lib/techniki/techniki";
import { Wstecz } from "../../../components/wstecz";
import { Sprawdzian } from "./sprawdzian";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: sprawdzian((await params).id)?.tytul ?? "Sprawdzian" };
}

/** Prosty, powtarzalny los: ta sama kolejność odpowiedzi w obrębie jednego podejścia. */
function losowanie(ziarno: string) {
  let h = 2166136261;
  for (let i = 0; i < ziarno.length; i++) h = Math.imul(h ^ ziarno.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export default async function SprawdzianPage({ params }: Props) {
  const user = await requireModul("coach");
  const { id } = await params;
  const s = sprawdzian(id);
  if (!s) notFound();
  const { ready, wpisy } = await postepAkademii(user.agency_id, user.id);
  if (!ready) redirect("/app/techniki?widok=akademia");
  const stan = stanAkademii(wpisy);
  const st = [...stan.moduly.map((m) => m.sprawdzian), stan.egzamin].find((x) => x.id === id)!;
  if (!st.dostepny) redirect("/app/techniki?widok=akademia");

  // Odpowiedzi tasujemy na serwerze, bez numeru poprawnej: przeglądarka dostaje
  // tylko treść i oryginalny numer, a ocenę robi serwer.
  const los = losowanie(`${user.id}:${id}:${st.podejscia}`);
  const pytania = s.pytania.map((p) => {
    const opcje = p.odpowiedzi.map((tekst, i) => ({ i, tekst }));
    for (let j = opcje.length - 1; j > 0; j--) {
      const k = Math.floor(los() * (j + 1));
      [opcje[j], opcje[k]] = [opcje[k], opcje[j]];
    }
    return { pytanie: p.pytanie, opcje };
  });
  const modul = stan.moduly.find((m) => m.sprawdzian.id === id);

  return (
    <>
      <Wstecz href="/app/techniki?widok=akademia" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Akademia
      </Wstecz>
      <Sprawdzian
        id={id}
        tytul={s.tytul}
        podtytul={modul ? `Moduł ${modul.nr}: ${modul.nazwa}` : "Wszystkie moduły Akademii"}
        prog={s.prog}
        pytania={pytania}
        najlepszy={st.najlepszy}
        kolor={modul?.kolor ?? "zloto"}
        nazwyTechnik={Object.fromEntries(TECHNIKI.map((t) => [t.slug, t.nazwa]))}
      />
    </>
  );
}
