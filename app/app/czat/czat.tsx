"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar } from "../components/avatar";
import { useToast } from "../components/toast";
import { useNaZywo } from "../components/na-zywo";
import { pole } from "../dokumenty-wzory/klocki";
import { BrakMigracji } from "../components/brak-migracji";
import { listaKanalow, przeczytane, rozmowaZ, wiadomosci, wycisz, type Kanal, type Wiadomosc } from "./actions";
import { ListaWiadomosci, NowaGrupa, Pisanie } from "./czesci";

export type Osoba = { id: string; name: string; avatar: string | null; stanowisko: string | null };



export function Czat({ ja, agencyId, ludzie, startowyKanal }: { ja: string; agencyId: string; ludzie: Osoba[]; startowyKanal: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [kanaly, setKanaly] = useState<Kanal[] | null>(null);
  const [brakMigracji, setBrakMigracji] = useState(false);
  const [aktywny, setAktywny] = useState<string | null>(startowyKanal);
  const [lista, setLista] = useState<Wiadomosc[]>([]);
  const [wiecej, setWiecej] = useState(false);
  const [laduje, setLaduje] = useState(false);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [nowaGrupaOtwarta, setNowaGrupaOtwarta] = useState(false);
  const [szukaj, setSzukaj] = useState("");
  // Wiadomość, na którą odpowiadamy: ustawia ją lista, czyta pole pisania.
  const [odpowiedz, setOdpowiedz] = useState<Wiadomosc | null>(null);
  const [, startTransition] = useTransition();
  const przewijak = useRef<HTMLDivElement>(null);
  const naDole = useRef(true);
  const osoba = useMemo(() => new Map(ludzie.map((l) => [l.id, l])), [ludzie]);

  const odswiezKanaly = useCallback(async () => {
    const w = await listaKanalow();
    if (!w.ok) {
      if ("brakMigracji" in w && w.brakMigracji) setBrakMigracji(true);
      return;
    }
    setKanaly(w.kanaly);
    setAktywny((a) => a ?? w.kanaly[0]?.id ?? null);
  }, []);

  const wczytaj = useCallback(async (id: string) => {
    setLaduje(true);
    const w = await wiadomosci(id);
    setLaduje(false);
    if (!w.ok) return;
    naDole.current = true;
    setLista(w.lista);
    setWiecej(w.wiecej);
    void przeczytane(id).then(() => {
      void odswiezKanaly();
      window.dispatchEvent(new Event("czat-przeczytane"));
    });
  }, [odswiezKanaly]);

  useEffect(() => {
    void odswiezKanaly();
  }, [odswiezKanaly]);

  useEffect(() => {
    if (aktywny) {
      void wczytaj(aktywny);
      const url = new URL(window.location.href);
      url.searchParams.set("k", aktywny);
      window.history.replaceState(null, "", url.toString());
    }
  }, [aktywny, wczytaj]);

  // Nowa wiadomość gdziekolwiek: odświeżamy listę kanałów (liczniki),
  // a w otwartej rozmowie dociągamy wiadomości.
  useNaZywo({
    kanal: `czat-${ja}`,
    tabela: "chat_messages",
    wlaczony: !brakMigracji && kanaly !== null,
    zapasMs: 15_000,
    onZmiana: (z) => {
      const kanal = z?.new?.channel_id as string | undefined;
      if (aktywny && (!kanal || kanal === aktywny)) {
        // Najpierw „przeczytane”, potem liczniki: odwrotna kolejność pokazywała
        // nieprzeczytaną wiadomość w rozmowie, którą właśnie widać na ekranie.
        void wiadomosci(aktywny).then(async (w) => {
          if (w.ok) {
            setLista(w.lista);
            await przeczytane(aktywny);
          }
          void odswiezKanaly();
          window.dispatchEvent(new Event("czat-przeczytane"));
        });
      } else {
        void odswiezKanaly();
      }
    },
  });

  // Obecność: kto ma teraz otwartą aplikację.
  useEffect(() => {
    if (brakMigracji) return;
    const supabase = createSupabaseBrowserClient();
    let ch: ReturnType<typeof supabase.channel> | null = null;
    try {
      ch = supabase.channel(`obecnosc-${agencyId}`, { config: { presence: { key: ja } } });
      ch.on("presence", { event: "sync" }, () => {
        const stan = ch!.presenceState();
        setOnline(new Set(Object.keys(stan)));
      }).subscribe((status) => {
        if (status === "SUBSCRIBED") void ch!.track({ at: Date.now() });
      });
    } catch {
      ch = null;
    }
    return () => {
      if (ch) void supabase.removeChannel(ch);
    };
  }, [agencyId, ja, brakMigracji]);

  // Przewijanie na dół przy nowych wiadomościach, jeśli ktoś już był na dole.
  useEffect(() => {
    const el = przewijak.current;
    if (el && naDole.current) el.scrollTop = el.scrollHeight;
  }, [lista]);

  async function starsze() {
    if (!aktywny || !lista.length) return;
    const el = przewijak.current;
    const wysokosc = el?.scrollHeight ?? 0;
    const w = await wiadomosci(aktywny, lista[0].created_at);
    if (!w.ok) return;
    naDole.current = false;
    setLista((l) => [...w.lista, ...l]);
    setWiecej(w.wiecej);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - wysokosc;
    });
  }

  function otworzRozmowe(osobaId: string) {
    startTransition(async () => {
      const w = await rozmowaZ(osobaId);
      if (!w.ok) return toast(w.error, "error");
      await odswiezKanaly();
      setAktywny(w.id);
    });
  }

  if (brakMigracji) {
    return (
      <>
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Czat zespołu</h1>
        <BrakMigracji />
      </>
    );
  }

  const kanal = kanaly?.find((k) => k.id === aktywny) ?? null;
  const nazwaKanalu = (k: Kanal) => (k.kind === "prywatny" ? osoba.get(k.z ?? "")?.name ?? "Rozmowa" : k.name);
  const grupy = (kanaly ?? []).filter((k) => k.kind !== "prywatny");
  const prywatne = new Map((kanaly ?? []).filter((k) => k.kind === "prywatny" && k.z).map((k) => [k.z as string, k]));
  const fraza = szukaj.trim().toLocaleLowerCase("pl-PL");
  const ludzieWidoczni = ludzie
    .filter((l) => l.id !== ja && (!fraza || l.name.toLocaleLowerCase("pl-PL").includes(fraza)))
    .sort((a, b) => {
      const ka = prywatne.get(a.id)?.last_message_at ?? "";
      const kb = prywatne.get(b.id)?.last_message_at ?? "";
      return kb.localeCompare(ka) || a.name.localeCompare(b.name, "pl");
    });

  return (
    <div className="-mx-5 -my-8 flex h-[calc(100dvh-57px)] overflow-hidden border-slate-200 bg-white md:-mx-10 md:-my-10 md:h-[100dvh]">
      {/* Lista rozmów */}
      <aside className={`${aktywny ? "hidden md:flex" : "flex"} w-full flex-col border-r border-slate-200 md:w-[300px] md:flex-shrink-0`}>
        <div className="border-b border-slate-200 p-4">
          <h1 className="text-lg font-semibold text-slate-900">Czat zespołu</h1>
          <input
            value={szukaj}
            onChange={(e) => setSzukaj(e.target.value)}
            placeholder="Szukaj osoby…"
            className={`${pole} mt-3 !py-2`}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-1 flex items-center justify-between px-2 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kanały</p>
            <button
              type="button"
              onClick={() => setNowaGrupaOtwarta(true)}
              className="rounded-md px-1.5 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Nowa grupa"
              title="Nowa grupa"
            >
              +
            </button>
          </div>
          {kanaly === null && <p className="px-3 py-2 text-sm text-slate-400">Wczytuję…</p>}
          {grupy.map((k) => (
            <PozycjaListy
              key={k.id}
              aktywna={k.id === aktywny}
              onClick={() => setAktywny(k.id)}
              ikona={<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-500">#</span>}
              nazwa={k.name}
              podglad={k.ostatnia}
              licznik={k.nieprzeczytane}
            />
          ))}
          <p className="mb-1 mt-4 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Wiadomości prywatne</p>
          {ludzieWidoczni.map((l) => {
            const dm = prywatne.get(l.id);
            return (
              <PozycjaListy
                key={l.id}
                aktywna={!!dm && dm.id === aktywny}
                onClick={() => (dm ? setAktywny(dm.id) : otworzRozmowe(l.id))}
                ikona={
                  <span className="relative">
                    <Avatar name={l.name} path={l.avatar} size={32} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${online.has(l.id) ? "bg-emerald-500" : "bg-slate-300"}`}
                      aria-label={online.has(l.id) ? "w aplikacji" : "poza aplikacją"}
                    />
                  </span>
                }
                nazwa={l.name}
                podglad={dm?.ostatnia ?? l.stanowisko}
                licznik={dm?.nieprzeczytane ?? 0}
              />
            );
          })}
        </div>
      </aside>

      {/* Rozmowa */}
      <section className={`${aktywny ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {kanal ? (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => setAktywny(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Wróć do listy">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                </button>
                {kanal.kind === "prywatny" ? (
                  <Avatar name={nazwaKanalu(kanal)} path={osoba.get(kanal.z ?? "")?.avatar} size={36} />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-500">#</span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{nazwaKanalu(kanal)}</p>
                  <p className="truncate text-xs text-slate-500">
                    {kanal.kind === "prywatny"
                      ? online.has(kanal.z ?? "")
                        ? "W aplikacji"
                        : osoba.get(kanal.z ?? "")?.stanowisko ?? "Poza aplikacją"
                      : `${kanal.czlonkowie.length} os. · ${kanal.czlonkowie.filter((c) => online.has(c)).length} w aplikacji`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => startTransition(async () => { await wycisz(kanal.id, true); toast("Powiadomienia z tej rozmowy wyciszone."); })}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Wycisz
              </button>
            </header>

            <div
              ref={przewijak}
              onScroll={(e) => {
                const el = e.currentTarget;
                naDole.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                if (el.scrollTop < 40 && wiecej && !laduje) void starsze();
              }}
              className="flex-1 overflow-y-auto px-4 py-4"
            >
              {laduje && lista.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Wczytuję rozmowę…</p>}
              {!laduje && lista.length === 0 && (
                <div className="py-16 text-center">
                  <p className="font-medium text-slate-700">Tu zaczyna się rozmowa</p>
                  <p className="mt-1 text-sm text-slate-500">Napisz coś albo wklej ofertę przyciskiem obok pola wiadomości.</p>
                </div>
              )}
              <ListaWiadomosci lista={lista} ja={ja} osoba={osoba} onZmiana={() => aktywny && void wczytaj(aktywny)} onOdpowiedz={(w) => setOdpowiedz(w)} />
            </div>

            <Pisanie
              key={kanal.id}
              kanalId={kanal.id}
              ludzie={ludzie.filter((l) => l.id !== ja)}
              odpowiedzNa={odpowiedz}
              autorOdpowiedzi={odpowiedz ? osoba.get(odpowiedz.author_id ?? "")?.name ?? "" : ""}
              anulujOdpowiedz={() => setOdpowiedz(null)}
              onWyslano={(w) => {
                naDole.current = true;
                setLista((l) => [...l, w]);
                setOdpowiedz(null);
                void odswiezKanaly();
              }}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-10 text-center">
            <div>
              <p className="font-medium text-slate-700">Wybierz rozmowę</p>
              <p className="mt-1 text-sm text-slate-500">Kanał ogólny widzi całe biuro. Rozmowy prywatne widzicie tylko wy dwoje.</p>
            </div>
          </div>
        )}
      </section>

      {nowaGrupaOtwarta && (
        <NowaGrupa
          ludzie={ludzie.filter((l) => l.id !== ja)}
          onClose={() => setNowaGrupaOtwarta(false)}
          onUtworzono={async (id) => {
            setNowaGrupaOtwarta(false);
            await odswiezKanaly();
            setAktywny(id);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function PozycjaListy({
  aktywna,
  onClick,
  ikona,
  nazwa,
  podglad,
  licznik,
}: {
  aktywna: boolean;
  onClick: () => void;
  ikona: ReactNode;
  nazwa: string;
  podglad: string | null;
  licznik: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${aktywna ? "bg-slate-100" : "hover:bg-slate-50"}`}
    >
      {ikona}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm ${licznik > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>{nazwa}</span>
        {podglad && <span className="block truncate text-xs text-slate-500">{podglad}</span>}
      </span>
      {licznik > 0 && (
        <span className="flex min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold leading-5 text-white">
          {licznik > 99 ? "99+" : licznik}
        </span>
      )}
    </button>
  );
}
