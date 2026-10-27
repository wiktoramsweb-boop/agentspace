"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { uploadToSignedUrl } from "@/lib/photo-process";
import { Select } from "../../components/select";
import {
  CENY_OBIEKTU,
  DODATKI,
  GRUPY_PLIKOW,
  OPCJE,
  PUSTE,
  TRYBY,
  bledyZamowienia,
  cenaZamowienia,
  type GrupaPlikow,
  type Tryb,
  type TypObiektu,
  type Zamowienie,
} from "@/lib/swiadectwa";
import { przygotujZamowienie, zlozZamowienie } from "../actions";

export type OfertaDoSwiadectwa = { id: string; title: string; address: string | null; city: string | null; area_m2: number | null; floor: number | null; property_type: string };

const pole = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

function rozbijAdres(adres: string | null): { ulica: string; nr: string; lokal: string } {
  const a = (adres ?? "").split(",")[0].replace(/^ul\.?\s*/i, "").trim();
  const m = a.match(/^(.*?)\s+(\d+[a-zA-Z]?)(?:\s*\/\s*(\d+[a-zA-Z]?))?$/);
  return m ? { ulica: m[1], nr: m[2], lokal: m[3] ?? "" } : { ulica: a, nr: "", lokal: "" };
}

function Pole({ label, opis, wymagane, children }: { label: string; opis?: string; wymagane?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {wymagane && <span className="text-rose-500"> *</span>}
      <div className="mt-1">{children}</div>
      {opis && <span className="mt-1 block text-xs font-normal leading-relaxed text-slate-500">{opis}</span>}
    </label>
  );
}

function Sekcja({ nr, tytul, children, opis }: { nr: string; tytul: string; opis?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
      <h2 className="text-base font-semibold text-emerald-700">
        {nr}. {tytul}
      </h2>
      {opis && <p className="mt-1 text-sm text-slate-500">{opis}</p>}
      <div className="mt-4 border-t border-slate-100 pt-4">{children}</div>
    </section>
  );
}

function Plik({ grupa, pliki, setPliki }: { grupa: GrupaPlikow; pliki: Record<GrupaPlikow, File[]>; setPliki: React.Dispatch<React.SetStateAction<Record<GrupaPlikow, File[]>>> }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">
        {GRUPY_PLIKOW[grupa].nazwa} <span className="font-normal text-slate-400">· {GRUPY_PLIKOW[grupa].wymagane ? "wymagane" : "opcjonalne"}</span>
      </p>
      <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 transition hover:bg-emerald-50">
        <span>
          <b className="block text-sm text-emerald-700">Wybierz pliki</b>
          <span className="text-xs text-slate-500">{GRUPY_PLIKOW[grupa].opis}</span>
        </span>
        <span className="text-xl font-bold text-emerald-600">+</span>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.heic,image/*,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const nowe = Array.from(e.target.files ?? []);
            setPliki((p) => ({ ...p, [grupa]: [...p[grupa], ...nowe].slice(0, 20) }));
            e.target.value = "";
          }}
        />
      </label>
      {pliki[grupa].length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">Nie wybrano plików</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {pliki[grupa].map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
              <span className="truncate">{f.name}</span>
              <button type="button" className="text-slate-400 hover:text-rose-600" onClick={() => setPliki((p) => ({ ...p, [grupa]: p[grupa].filter((_, j) => j !== i) }))} aria-label={`Usuń ${f.name}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FormularzSwiadectwa({ oferty, start }: { oferty: OfertaDoSwiadectwa[]; start: string | null }) {
  const poczatkowa = oferty.find((o) => o.id === start) ?? null;
  const [z, setZ] = useState<Zamowienie>(() => {
    if (!poczatkowa) return PUSTE;
    const a = rozbijAdres(poczatkowa.address);
    return { ...PUSTE, propertyId: poczatkowa.id, ulica: a.ulica, nrBudynku: a.nr, nrLokalu: a.lokal, miasto: poczatkowa.city ?? "", powierzchnia: poczatkowa.area_m2 ? String(poczatkowa.area_m2) : "", typ: poczatkowa.property_type === "dom" ? "dom" : poczatkowa.property_type === "lokal" ? "lokal" : "mieszkanie" };
  });
  const [pliki, setPliki] = useState<Record<GrupaPlikow, File[]>>({ budynek: [], rzut: [], swiadectwo_budynku: [] });
  const [czeka, setCzeka] = useState(false);
  const [postep, setPostep] = useState<string | null>(null);
  const [bledy, setBledy] = useState<string[]>([]);
  const [gotowe, setGotowe] = useState<{ numer: string; wyslano: boolean } | null>(null);
  const gora = useRef<HTMLDivElement>(null);
  const ustaw = <K extends keyof Zamowienie>(k: K, v: Zamowienie[K]) => setZ((x) => ({ ...x, [k]: v }));
  const cena = useMemo(() => cenaZamowienia(z.typ, z.tryb), [z.typ, z.tryb]);

  function zmienOferte(id: string) {
    const o = oferty.find((x) => x.id === id);
    if (!o) {
      ustaw("propertyId", null);
      return;
    }
    const a = rozbijAdres(o.address);
    setZ((x) => ({ ...x, propertyId: o.id, ulica: a.ulica, nrBudynku: a.nr, nrLokalu: a.lokal, miasto: o.city ?? x.miasto, powierzchnia: o.area_m2 ? String(o.area_m2) : x.powierzchnia, dodatki: o.floor === 0 ? Array.from(new Set([...x.dodatki, "parter" as const])) : x.dodatki }));
  }

  async function zamow() {
    const b = bledyZamowienia(z, pliki.budynek.length);
    setBledy(b);
    if (b.length) {
      gora.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setCzeka(true);
    try {
      const lista = (Object.keys(pliki) as GrupaPlikow[]).flatMap((g) => pliki[g].map((f) => ({ grupa: g, f })));
      setPostep("Przygotowuję zamówienie…");
      const prz = await przygotujZamowienie(lista.map((x) => ({ grupa: x.grupa, nazwa: x.f.name, rozmiar: x.f.size })));
      if (!prz.ok) throw new Error(prz.error);
      const wgrane: { grupa: GrupaPlikow; path: string; nazwa: string; rozmiar: number }[] = [];
      for (let i = 0; i < lista.length; i++) {
        setPostep(`Wgrywam pliki: ${i + 1} z ${lista.length}`);
        await uploadToSignedUrl(prz.uploads[i].signedUrl, lista[i].f, () => {});
        wgrane.push({ grupa: lista[i].grupa, path: prz.uploads[i].path, nazwa: lista[i].f.name, rozmiar: lista[i].f.size });
      }
      setPostep("Wysyłam zamówienie…");
      const wynik = await zlozZamowienie(prz.numer, z, wgrane);
      if (!wynik.ok) throw new Error(wynik.error);
      setGotowe({ numer: prz.numer, wyslano: wynik.wyslano });
      gora.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setBledy([e instanceof Error ? e.message : "Nie udało się złożyć zamówienia."]);
    } finally {
      setCzeka(false);
      setPostep(null);
    }
  }

  if (gotowe) {
    return (
      <div ref={gora} className="rounded-3xl bg-slate-900 p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Zamówienie przyjęte, czeka na wpłatę</p>
        <h2 className="mt-2 text-2xl font-semibold">Świadectwo dla: {`${z.ulica} ${z.nrBudynku}${z.nrLokalu ? `/${z.nrLokalu}` : ""}, ${z.miasto}`}</h2>
        <p className="mt-2 text-slate-300">
          Numer {gotowe.numer}. Po zaksięgowaniu wpłaty audytor skontaktuje się z: {z.imie}, {z.telefon}. Czas realizacji: {TRYBY[z.tryb].nazwa.toLowerCase()} ({TRYBY[z.tryb].opis}), liczony od wpłaty.
        </p>
        <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Płatność: {cena.netto} zł netto ({cena.brutto} zł brutto)</p>
          <p className="mt-1">W ciągu dnia roboczego wyślemy fakturę z danymi do przelewu na adres biura. W tytule przelewu wpisz numer {gotowe.numer}. Status zamówienia zobaczysz w „Moje zamówienia”.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/swiadectwa" className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-emerald-300">
            Moje zamówienia
          </Link>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20">
            Zamów kolejne
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={gora} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {bledy.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <b>Uzupełnij, zanim zamówisz:</b>
            <ul className="mt-1 list-disc pl-5">
              {bledy.slice(0, 8).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        <Sekcja nr="I" tytul="Wybierz typ obiektu">
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(CENY_OBIEKTU) as TypObiektu[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => ustaw("typ", t)}
                className={`rounded-2xl border-2 p-4 text-left transition ${z.typ === t ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
              >
                <b className="block text-slate-900">{CENY_OBIEKTU[t].nazwa}</b>
                <span className="text-sm text-slate-500">{CENY_OBIEKTU[t].opis}</span>
                <span className="mt-2 block text-sm font-semibold text-emerald-700">{CENY_OBIEKTU[t].cena} zł netto</span>
              </button>
            ))}
          </div>
        </Sekcja>

        <Sekcja nr="II" tytul="Czas realizacji" opis="Dotyczy dni roboczych.">
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(TRYBY) as Tryb[]).map((t) => (
              <button key={t} type="button" onClick={() => ustaw("tryb", t)} className={`rounded-2xl border-2 px-4 py-3 text-left transition ${z.tryb === t ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
                <b className="block text-sm text-slate-900">
                  {TRYBY[t].nazwa} <span className="font-normal text-slate-500">{TRYBY[t].opis}</span>
                </b>
                <span className="text-xs text-slate-500">{TRYBY[t].doplata ? `+${TRYBY[t].doplata} zł netto` : "bez dopłaty"}</span>
              </button>
            ))}
          </div>
        </Sekcja>

        <Sekcja nr="III" tytul="Podstawowe dane nieruchomości">
          {oferty.length > 0 && (
            <div className="mb-4 rounded-2xl bg-emerald-50/60 p-3">
              <Pole label="Uzupełnij z oferty w AgentSpace">
                <Select name="oferta" defaultValue={z.propertyId ?? ""} placeholder="Bez oferty, wpiszę ręcznie" onChange={(e) => zmienOferte(e.target.value)}>
                  {oferty.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </Select>
              </Pole>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Pole label="Ulica" wymagane>
              <input className={pole} value={z.ulica} onChange={(e) => ustaw("ulica", e.target.value)} />
            </Pole>
            <div className="grid grid-cols-2 gap-3">
              <Pole label="Nr budynku" wymagane>
                <input className={pole} value={z.nrBudynku} onChange={(e) => ustaw("nrBudynku", e.target.value)} />
              </Pole>
              <Pole label="Nr lokalu">
                <input className={pole} value={z.nrLokalu} onChange={(e) => ustaw("nrLokalu", e.target.value)} />
              </Pole>
            </div>
            <Pole label="Kod pocztowy" wymagane opis="Format 00-000.">
              <input className={pole} placeholder="00-000" value={z.kod} onChange={(e) => ustaw("kod", e.target.value)} />
            </Pole>
            <Pole label="Miasto" wymagane>
              <input className={pole} value={z.miasto} onChange={(e) => ustaw("miasto", e.target.value)} />
            </Pole>
            <Pole label="Powierzchnia użytkowa (m²)" wymagane opis="Bez piwnic, strychów, balkonów i tarasów.">
              <input className={pole} inputMode="decimal" value={z.powierzchnia} onChange={(e) => ustaw("powierzchnia", e.target.value)} />
            </Pole>
            <Pole label="Wysokość pomieszczeń (cm)" wymagane opis="Przy skosach wpisz średnią wysokość.">
              <input className={pole} inputMode="numeric" placeholder="np. 260" value={z.wysokosc} onChange={(e) => ustaw("wysokosc", e.target.value)} />
            </Pole>
            <Pole label="Liczba ścian zewnętrznych" wymagane opis="Ściany, za którymi jest powietrze zewnętrzne (nie klatka ani sąsiad).">
              <input className={pole} inputMode="numeric" value={z.scianyZewn} onChange={(e) => ustaw("scianyZewn", e.target.value)} />
            </Pole>
          </div>
          <p className="mb-3 mt-6 text-sm font-semibold text-slate-800">Kontakt dla audytora (właściciel lub osoba z dostępem do mieszkania)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Pole label="Imię" wymagane>
              <input className={pole} value={z.imie} onChange={(e) => ustaw("imie", e.target.value)} />
            </Pole>
            <Pole label="E-mail" wymagane>
              <input className={pole} type="email" placeholder="mail@example.com" value={z.email} onChange={(e) => ustaw("email", e.target.value)} />
            </Pole>
            <Pole label="Telefon" wymagane>
              <input className={pole} type="tel" value={z.telefon} onChange={(e) => ustaw("telefon", e.target.value)} />
            </Pole>
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            <input type="checkbox" checked={z.zgoda} onChange={(e) => ustaw("zgoda", e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-emerald-600" />
            Osoba do kontaktu zgadza się na kontakt w celu przygotowania świadectwa energetycznego. <span className="text-rose-500">*</span>
          </label>
        </Sekcja>

        <Sekcja nr="IV" tytul="Szczegółowe dane nieruchomości" opis="Podaj najlepsze dostępne informacje. Jeśli czegoś nie wiesz, wybierz „Nie wiem”, a brakujące dane audytor doprecyzuje.">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["ogrzewanie", "Rodzaj ogrzewania", undefined],
                ["cwu", "Ogrzewanie ciepłej wody", undefined],
                ["grzejniki", "Rodzaj grzejników", undefined],
                ["wentylacja", "Rodzaj wentylacji", "Grawitacyjna to kratki bez centrali. Mechaniczna ma wentylatory albo centralę."],
                ["sciany", "Materiał ścian zewnętrznych", "Sprawdź w projekcie, prospekcie dewelopera albo u administracji."],
                ["izolacja", "Materiał izolacji zewnętrznej", "Najczęściej styropian albo wełna mineralna."],
              ] as const
            ).map(([k, label, opis]) => (
              <Pole key={k} label={label} wymagane opis={opis}>
                <Select name={k} defaultValue={z[k]} placeholder="wybierz" onChange={(e) => ustaw(k, e.target.value)}>
                  {OPCJE[k].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Pole>
            ))}
            <Pole label="Grubość ściany BEZ izolacji (cm)" wymagane opis="Zmierz mur przy oknie albo drzwiach balkonowych, bez styropianu i tynku.">
              <input className={pole} inputMode="numeric" value={z.gruboscSciany} onChange={(e) => ustaw("gruboscSciany", e.target.value)} />
            </Pole>
            <Pole label="Grubość izolacji (cm)" wymagane opis="0 = brak izolacji.">
              <input className={pole} inputMode="numeric" value={z.gruboscIzolacji} onChange={(e) => ustaw("gruboscIzolacji", e.target.value)} />
            </Pole>
            <Pole label="Rok oddania budynku" wymagane>
              <input className={pole} inputMode="numeric" value={z.rokOddania} onChange={(e) => ustaw("rokOddania", e.target.value)} />
            </Pole>
            <Pole label="Rok ostatniej termomodernizacji" wymagane opis="Jeśli nie było, wpisz rok oddania budynku.">
              <input className={pole} inputMode="numeric" value={z.rokTermo} onChange={(e) => ustaw("rokTermo", e.target.value)} />
            </Pole>
          </div>
        </Sekcja>

        <Sekcja nr="V" tytul="Dodatkowe informacje" opis="Zaznacz tylko to, o czym wiesz, że występuje.">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(DODATKI) as (keyof typeof DODATKI)[]).map((d) => (
              <label key={d} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={z.dodatki.includes(d)}
                  onChange={(e) => ustaw("dodatki", e.target.checked ? [...z.dodatki, d] : z.dodatki.filter((x) => x !== d))}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600"
                />
                {DODATKI[d]}
              </label>
            ))}
          </div>
        </Sekcja>

        <Sekcja nr="VI" tytul="Komentarz i zdjęcia">
          <Pole label="Dodatkowy komentarz">
            <textarea className={pole} rows={4} placeholder="Wymiary okien i drzwi, materiał ram, ściany przy klatce lub windzie, inne ważne informacje." value={z.komentarz} onChange={(e) => ustaw("komentarz", e.target.value)} />
          </Pole>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Plik grupa="budynek" pliki={pliki} setPliki={setPliki} />
            <Plik grupa="rzut" pliki={pliki} setPliki={setPliki} />
            <div className="sm:col-span-2">
              <Plik grupa="swiadectwo_budynku" pliki={pliki} setPliki={setPliki} />
            </div>
          </div>
        </Sekcja>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-3xl bg-slate-900 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Twoje zamówienie</p>
          <p className="mt-2 text-lg font-semibold">{CENY_OBIEKTU[z.typ].nazwa}</p>
          <p className="text-sm text-slate-300">
            {TRYBY[z.tryb].nazwa}, {TRYBY[z.tryb].opis}
          </p>
          <p className="mt-4 text-3xl font-bold tabular-nums">{cena.netto} zł</p>
          <p className="text-sm text-slate-300">netto ({cena.brutto} zł brutto)</p>
          <div className="my-5 h-px bg-white/10" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Co otrzymasz</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
            <li>✓ PDF świadectwa z podpisem kwalifikowanym</li>
            <li>✓ Wpis do centralnego rejestru (CEEB)</li>
            <li>✓ Fakturę VAT 23%</li>
            <li>✓ Kontakt audytora z osobą wskazaną w formularzu</li>
          </ul>
          <div className="my-5 h-px bg-white/10" />
          <p className="text-sm text-slate-300">Płatne z góry: po zamówieniu dostaniesz fakturę z danymi do przelewu. Audytor rusza po zaksięgowaniu wpłaty.</p>
          <button type="button" onClick={zamow} disabled={czeka} className="mt-5 w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60">
            {czeka ? postep ?? "Wysyłam…" : "Zamów świadectwo →"}
          </button>
          <p className="mt-3 text-xs text-slate-400">Świadectwo przygotowuje uprawniony audytor energetyczny współpracujący z AgentSpace.</p>
        </div>
      </aside>
    </div>
  );
}
