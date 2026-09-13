import type { CalendarEvent } from "@/lib/data-calendar";
import { partsPL } from "@/lib/datetime";

export type CalView = "dzien" | "tydzien" | "miesiac";

/**
 * Kolory rodzajów działań w kalendarzu. Tło półprzezroczyste, żeby blok
 * wyglądał dobrze w jasnym i ciemnym motywie bez osobnych klas.
 */
export const KIND_STYLE: Record<
  CalendarEvent["kind"],
  { label: string; plural: string; dot: string; block: string; bar: string }
> = {
  polaczenie: {
    label: "Telefon",
    plural: "Telefony",
    dot: "bg-blue-500",
    block: "bg-blue-500/10 hover:bg-blue-500/15 border-blue-500",
    bar: "bg-blue-500",
  },
  spotkanie: {
    label: "Spotkanie",
    plural: "Spotkania",
    dot: "bg-rose-500",
    block: "bg-rose-500/10 hover:bg-rose-500/15 border-rose-500",
    bar: "bg-rose-500",
  },
  zadanie: {
    label: "Zadanie",
    plural: "Zadania",
    dot: "bg-violet-500",
    block: "bg-violet-500/10 hover:bg-violet-500/15 border-violet-500",
    bar: "bg-violet-500",
  },
  wydarzenie: {
    label: "Wydarzenie",
    plural: "Wydarzenia",
    dot: "bg-amber-500",
    block: "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500",
    bar: "bg-amber-500",
  },
};

export const KIND_ORDER: CalendarEvent["kind"][] = ["polaczenie", "spotkanie", "zadanie", "wydarzenie"];

export const WEEKDAYS_SHORT = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
export const WEEKDAYS_LONG = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];

/** Ile minut zajmuje działanie w siatce. Telefon krótko, spotkanie godzinę. */
export function durationMin(e: CalendarEvent): number {
  if (e.kind === "polaczenie") return e.duration_s ? Math.max(15, Math.round(e.duration_s / 60)) : 20;
  if (e.kind === "zadanie") return 30;
  return 60;
}

export type Placed = { event: CalendarEvent; start: number; end: number; lane: number; lanes: number };

/**
 * Rozkład działań jednego dnia na tory: nakładające się wpisy stają obok
 * siebie zamiast się zasłaniać (jak w Kalendarzu Google).
 */
export function layoutDay(events: CalendarEvent[]): Placed[] {
  const items = events
    .map((event) => {
      const p = partsPL(event.due_at);
      const start = p ? p.hour * 60 + p.minute : 0;
      return { event, start, end: start + durationMin(event), lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => (c.lanes = lanes));
    out.push(...cluster);
    cluster = [];
  };

  for (const it of items) {
    if (cluster.length && it.start >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    // Pierwszy wolny tor w bieżącej grupie.
    const busy = new Set(cluster.filter((c) => c.end > it.start).map((c) => c.lane));
    let lane = 0;
    while (busy.has(lane)) lane++;
    it.lane = lane;
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.end);
  }
  if (cluster.length) flush();
  return out;
}

export function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** „Wrzesień 2026" (nazwa miesiąca w mianowniku, z wielkiej litery). */
export function monthTitle(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const name = new Intl.DateTimeFormat("pl-PL", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

/** „14 września" (dopełniacz, jak w zdaniu). */
export function dayMonth(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
