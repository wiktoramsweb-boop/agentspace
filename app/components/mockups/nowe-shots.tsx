/**
 * Makiety ekranów modułów dodanych w październiku 2026. Ten sam język co
 * light-shots.tsx (jasne tło, karty, drobny tekst), ale bez animacji wejścia:
 * makieta ma być widoczna od razu, także bez JavaScriptu.
 */

const tx = (lang: string | undefined, pl: string, en: string) => (lang === "en" ? en : pl);

function Ramka({ tytul, akcja, children }: { tytul: string; akcja?: string; children: React.ReactNode }) {
  return (
    <div className="h-full w-full bg-slate-50 p-4 text-[11px] text-slate-700 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">{tytul}</p>
        {akcja && <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white">{akcja}</span>}
      </div>
      {children}
    </div>
  );
}

/** Tablica transakcji: kolumny etapów z kartami klientów. */
export function ShotTablica({ lang = "pl" }: { lang?: string }) {
  const kolumny: { n: string; kolor: string; karty: [string, string, string?][] }[] = [
    { n: tx(lang, "Nowy", "New"), kolor: "bg-slate-400", karty: [["Magdalena K.", tx(lang, "kupno · 650 tys.", "buying · 650k")], ["Tomasz M.", tx(lang, "najem · 3 tys./mc", "renting · 3k/mo")]] },
    { n: tx(lang, "Prezentacje", "Viewings"), kolor: "bg-sky-500", karty: [["Joanna L.", tx(lang, "3 oglądania", "3 viewings"), tx(lang, "jutro 17:00", "tomorrow 5pm")], ["Paweł Z.", tx(lang, "Ruczaj · 56 m²", "Ruczaj · 56 m²")]] },
    { n: tx(lang, "Negocjacje", "Negotiation"), kolor: "bg-amber-500", karty: [["Ewa Z.", tx(lang, "oferta 705 tys.", "offer 705k"), tx(lang, "obniżka −3%", "price −3%")]] },
    { n: tx(lang, "Umowa", "Contract"), kolor: "bg-emerald-600", karty: [["Katarzyna M.", tx(lang, "rezerwacja podpisana", "reservation signed")]] },
  ];
  return (
    <Ramka tytul={tx(lang, "Tablica klientów", "Client board")} akcja={tx(lang, "Lista / Tablica", "List / Board")}>
      <div className="grid grid-cols-4 gap-2">
        {kolumny.map((k) => (
          <div key={k.n} className="rounded-xl bg-slate-100 p-2">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-slate-800">
              <span className={`h-2 w-2 rounded-full ${k.kolor}`} />
              {k.n}
              <span className="ml-auto text-slate-400">{k.karty.length}</span>
            </p>
            <div className="space-y-1.5">
              {k.karty.map(([kto, co, znacznik], i) => (
                <div key={kto} className={`rounded-lg border bg-white p-2 ${k.n === tx(lang, "Prezentacje", "Viewings") && i === 0 ? "rotate-[-2deg] border-emerald-400 shadow-md" : "border-slate-200"}`}>
                  <p className="truncate font-medium text-slate-800">{kto}</p>
                  <p className="truncate text-[10px] text-slate-500">{co}</p>
                  {znacznik && <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 text-[9px] font-medium text-amber-700">{znacznik}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-slate-500">{tx(lang, "Przeciągnij kartę do kolejnej kolumny: etap zmienia się od razu, a automatyzacje tworzą zadanie.", "Drag a card to the next column: the stage changes and automations create a task.")}</p>
    </Ramka>
  );
}

/** Czat zespołu z odnośnikiem do oferty. */
export function ShotCzat({ lang = "pl" }: { lang?: string }) {
  const wiad: [string, string, boolean][] = [
    ["Anna W.", tx(lang, "Ktoś zna kupującego na 3 pokoje na Ruczaju do 720 tys.?", "Anyone has a buyer for 3 rooms in Ruczaj up to 720k?"), false],
    ["Kamil S.", tx(lang, "Mam! Pani Joanna, szuka od miesiąca. Podsyłam kartę:", "Yes! Joanna, looking for a month. Here's the card:"), false],
    ["Ty", tx(lang, "Super, umawiam oglądanie na czwartek.", "Great, booking a viewing for Thursday."), true],
  ];
  return (
    <Ramka tytul={tx(lang, "Czat zespołu", "Team chat")}>
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <div className="space-y-1 rounded-xl bg-white p-2">
          {[tx(lang, "# Całe biuro", "# Whole office"), tx(lang, "# Kupujący", "# Buyers"), "Anna W.", "Kamil S."].map((k, i) => (
            <p key={k} className={`truncate rounded-md px-2 py-1 ${i === 1 ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-600"}`}>
              {k}
              {i === 0 && <span className="ml-1 rounded-full bg-emerald-600 px-1.5 text-[9px] text-white">3</span>}
            </p>
          ))}
        </div>
        <div className="space-y-2 rounded-xl bg-white p-3">
          {wiad.map(([kto, tresc, moja]) => (
            <div key={tresc} className={`flex ${moja ? "justify-end" : ""}`}>
              <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 ${moja ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>
                {!moja && <p className="text-[10px] font-semibold text-slate-500">{kto}</p>}
                <p>{tresc}</p>
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-slate-200 p-2">
            <p className="font-medium text-slate-800">{tx(lang, "Klient: Joanna Lewandowska", "Client: Joanna Lewandowska")}</p>
            <p className="text-[10px] text-slate-500">{tx(lang, "kupno · 3 pokoje · do 720 tys.", "buying · 3 rooms · up to 720k")}</p>
          </div>
        </div>
      </div>
    </Ramka>
  );
}

/** Koszty i wynik miesiąca. */
export function ShotKoszty({ lang = "pl" }: { lang?: string }) {
  const kafle: [string, string, string][] = [
    [tx(lang, "Prowizje", "Commissions"), "48 600 zł", "text-slate-900"],
    [tx(lang, "Dla agentów", "For agents"), "21 870 zł", "text-slate-900"],
    [tx(lang, "Koszty biura", "Office costs"), "11 240 zł", "text-slate-900"],
    [tx(lang, "Wynik", "Result"), "15 490 zł", "text-emerald-700"],
  ];
  const slupki = [40, 55, 35, 70, 62, 80];
  return (
    <Ramka tytul={tx(lang, "Koszty i wynik · październik", "Costs and result · October")} akcja={tx(lang, "Paczka dla księgowej", "Accountant pack")}>
      <div className="grid grid-cols-4 gap-2">
        {kafle.map(([l, v, k]) => (
          <div key={l} className="rounded-xl border border-slate-200 bg-white p-2.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-400">{l}</p>
            <p className={`mt-0.5 text-sm font-semibold ${k}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-[1fr_140px] gap-2">
        <div className="flex h-24 items-end gap-2 rounded-xl border border-slate-200 bg-white p-3">
          {slupki.map((h, i) => (
            <div key={i} className="flex flex-1 items-end gap-0.5">
              <div className="flex-1 rounded-t bg-slate-300" style={{ height: `${h}%` }} />
              <div className="flex-1 rounded-t bg-emerald-600" style={{ height: `${h * 0.45}%` }} />
            </div>
          ))}
        </div>
        <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-2.5">
          {[[tx(lang, "Czynsz biura", "Office rent"), "4 920"], [tx(lang, "Portale", "Portals"), "2 460"], ["CRM", "738"], [tx(lang, "Paliwo", "Fuel"), "1 180"]].map(([n, k]) => (
            <p key={n} className="flex justify-between"><span>{n}</span><span className="font-medium">{k}</span></p>
          ))}
        </div>
      </div>
    </Ramka>
  );
}

/** Kosztorys remontu. */
export function ShotRemont({ lang = "pl" }: { lang?: string }) {
  const pom: [string, string, string][] = [
    [tx(lang, "Salon", "Living room"), "18,7 m²", "16 975 zł"],
    [tx(lang, "Pokój", "Bedroom"), "15,3 m²", "14 855 zł"],
    [tx(lang, "Kuchnia", "Kitchen"), "6 m²", "23 361 zł"],
    [tx(lang, "Łazienka", "Bathroom"), "5 m²", "26 062 zł"],
  ];
  return (
    <Ramka tytul={tx(lang, "Kosztorys remontu", "Renovation estimate")} akcja="PDF">
      <div className="grid grid-cols-[1fr_150px] gap-2">
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {[tx(lang, "Odświeżenie", "Refresh"), tx(lang, "Średni", "Medium"), tx(lang, "Generalny", "Full")].map((z, i) => (
              <span key={z} className={`rounded-lg border px-2 py-1.5 text-center font-medium ${i === 2 ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white"}`}>{z}</span>
            ))}
          </div>
          {pom.map(([n, m, k]) => (
            <div key={n} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <span className="flex-1 font-medium text-slate-800">{n}</span>
              <span className="text-slate-400">{m}</span>
              <span className="w-16 text-right font-semibold">{k}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[9px] uppercase tracking-wider text-slate-400">{tx(lang, "Szacowany koszt", "Estimated cost")}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">104 055 zł</p>
          <p className="text-slate-500">{tx(lang, "2 081 zł/m² · 6 tyg.", "2,081 zł/m² · 6 wks")}</p>
          <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-[10px]">
            <p className="flex justify-between"><span>{tx(lang, "Robocizna", "Labour")}</span><span>44 285</span></p>
            <p className="flex justify-between"><span>{tx(lang, "Materiały", "Materials")}</span><span>43 303</span></p>
            <p className="flex justify-between"><span>VAT 8%</span><span>7 007</span></p>
          </div>
        </div>
      </div>
    </Ramka>
  );
}

/** Reguły automatyzacji. */
export function ShotAutomatyzacje({ lang = "pl" }: { lang?: string }) {
  const reguly: [string, string, boolean, string][] = [
    [tx(lang, "Etap oferty: prezentacje", "Listing stage: viewings"), tx(lang, "zadanie dla opiekuna za 2 dni", "task for the owner in 2 days"), true, "14"],
    [tx(lang, "Oferta pasuje do poszukiwania", "Listing matches a search"), tx(lang, "zadanie: zadzwoń do kupującego", "task: call the buyer"), true, "6"],
    [tx(lang, "Nowy lead z formularza", "New lead from the form"), tx(lang, "przydział i powiadomienie push", "assignment and push"), true, "31"],
    [tx(lang, "Klient bez kontaktu 14 dni", "Client without contact 14 days"), tx(lang, "zadanie: zadzwoń", "task: call"), false, "0"],
  ];
  return (
    <Ramka tytul={tx(lang, "Automatyzacje", "Automations")} akcja={tx(lang, "+ Reguła", "+ Rule")}>
      <div className="space-y-1.5">
        {reguly.map(([gdy, to, wl, ile]) => (
          <div key={gdy} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
            <span className={`flex h-4 w-7 items-center rounded-full p-0.5 ${wl ? "justify-end bg-emerald-600" : "bg-slate-300"}`}>
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-800">{tx(lang, "Gdy", "When")}: {gdy}</span>
              <span className="block truncate text-slate-500">→ {to}</span>
            </span>
            <span className="text-[10px] text-slate-400">{ile} {tx(lang, "razy w mies.", "this month")}</span>
          </div>
        ))}
      </div>
    </Ramka>
  );
}
