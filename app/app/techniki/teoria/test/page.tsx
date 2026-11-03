import Link from "next/link";
import { redirect } from "next/navigation";
import { requireModul } from "@/lib/auth";
import { postepTeorii } from "@/lib/data-teoria";
import { MODULY_TEORII, TESTY, itemTestu, losujPytania, maTeorie, type ZakresTestu } from "@/lib/techniki/teoria";
import { Wstecz } from "../../../components/wstecz";
import { KOLOR_MODULU } from "../przeglad";
import { TestTeorii } from "./test-teorii";

export const metadata = { title: "Teoria: test" };

type Props = { searchParams: Promise<{ zakres?: string }> };

const ZAKRESY: ZakresTestu[] = ["m1", "m2", "m3", "egzamin", "bledy"];

export default async function TestPage({ searchParams }: Props) {
  const user = await requireModul("coach");
  if (!maTeorie(user.agency_id)) redirect("/app/techniki");
  const z = (await searchParams).zakres;
  const zakres = ZAKRESY.includes(z as ZakresTestu) ? (z as ZakresTestu) : "egzamin";
  const postep = await postepTeorii(user.agency_id, user.id);
  if (!postep.ready) redirect("/app/techniki?widok=teoria");

  // Pytania i kolejność odpowiedzi losuje serwer. Przeglądarka dostaje treść
  // i oryginalny numer odpowiedzi, ale nie wie, która jest poprawna.
  const pytania = losujPytania(zakres, Math.random, postep.bledy).map((q) => {
    const opcje = q.odpowiedzi.map((tekst, i) => ({ i, tekst }));
    for (let j = opcje.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [opcje[j], opcje[k]] = [opcje[k], opcje[j]];
    }
    return { id: q.id, pytanie: q.pytanie, opcje };
  });

  const modul = MODULY_TEORII.find((m) => m.id === zakres);
  const kolor = modul ? KOLOR_MODULU[modul.kolor] : { pelny: "#f59e0b", obrys: "#d97706" };
  const ustawienia =
    zakres === "bledy"
      ? { tytul: "Powtórka błędów", podtytul: "Pytania, na które ostatnio padła zła odpowiedź", prog: pytania.length, minut: null }
      : { tytul: TESTY[zakres].nazwa, podtytul: modul ? modul.nazwa : "Wszystkie moduły, jak na egzaminie po szkoleniu", prog: TESTY[zakres].prog, minut: TESTY[zakres].minut };
  const najlepszy = zakres === "bledy" ? null : (postep.testy[itemTestu(zakres)] ?? null);

  return (
    <>
      <Wstecz href="/app/techniki?widok=teoria" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Teoria
      </Wstecz>
      {pytania.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">Nie masz pytań do powtórki</p>
          <p className="mt-1 text-sm text-slate-500">Pojawią się tu, gdy w którymś teście padnie zła odpowiedź.</p>
          <Link href="/app/techniki/teoria/test?zakres=egzamin" className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Zrób egzamin próbny
          </Link>
        </div>
      ) : (
        <TestTeorii
          zakres={zakres}
          tryb={zakres === "egzamin" ? "egzamin" : "nauka"}
          {...ustawienia}
          pytania={pytania}
          najlepszy={najlepszy ? `${najlepszy.najlepszy}/${najlepszy.max}` : null}
          kolor={{ pelny: kolor.pelny, obrys: kolor.obrys }}
        />
      )}
    </>
  );
}
