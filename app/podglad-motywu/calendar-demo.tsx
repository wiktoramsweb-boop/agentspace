"use client";

import { CalendarApp } from "../app/kalendarz/calendar-app";
import type { CalendarEvent, CallInsights } from "@/lib/data-calendar";
import { addDaysKey, mondayOfKey, todayPL, warsawToIso } from "@/lib/datetime";

/** Przykładowy tydzień do podglądu kalendarza (tylko tryb deweloperski). */
export function CalendarDemo({ view = "tydzien" }: { view?: "tydzien" | "miesiac" }) {
  const monday = mondayOfKey(todayPL());
  const ev = (
    day: number,
    time: string,
    kind: CalendarEvent["kind"],
    subject: string,
    status: CalendarEvent["status"] = "wykonane",
    who: string | null = null,
  ): CalendarEvent => ({
    id: `${day}-${time}-${subject}`,
    kind,
    status,
    priority: "normalny",
    subject,
    due_at: warsawToIso(addDaysKey(monday, day), time)!,
    duration_s: kind === "polaczenie" ? 300 : null,
    contact_name: who,
    contact_phone: kind === "polaczenie" ? "600100200" : null,
    clientName: null,
    propertyTitle: kind === "spotkanie" ? "Kraków, ul. Sołtysowska" : null,
    assignee_ids: ["u1"],
    assigneeNames: ["Wiktor Szostek"],
  });

  const events: CalendarEvent[] = [
    ev(0, "09:15", "polaczenie", "Pozysk Warmijska", "wykonane", "Małgorzata Z."),
    ev(0, "09:40", "polaczenie", "Follow-up po prezentacji", "wykonane", "Roman K."),
    ev(0, "11:00", "spotkanie", "Spotkanie pozyskowe", "wykonane", "Anna Nowak"),
    ev(1, "10:00", "polaczenie", "Zimny telefon FSBO", "wykonane", "Jan K."),
    ev(1, "10:10", "polaczenie", "Aktualizacja ceny", "wykonane", "Ewa"),
    ev(1, "14:30", "zadanie", "Zamówić sesję zdjęciową", "zaplanowane"),
    ev(2, "12:00", "wydarzenie", "Odprawa zespołu", "zaplanowane"),
    ev(2, "16:00", "spotkanie", "Prezentacja Stalowe", "zaplanowane", "Państwo Kowalscy"),
    ev(3, "09:30", "polaczenie", "Oddzwonić do Pani Anny", "zaplanowane", "Anna"),
    ev(4, "13:00", "spotkanie", "Podpisanie umowy", "zaplanowane", "Marcin Ptak"),
  ];

  const heat = Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) =>
      d < 5 && h >= 9 && h <= 17 ? Math.max(0, Math.round(6 - Math.abs(h - 10.5) * 1.4 + (d === 1 ? 2 : 0))) : 0,
    ),
  );
  const byHour = Array.from({ length: 24 }, (_, h) => heat.reduce((a, row) => a + row[h], 0));
  const byWeekday = heat.map((row) => row.reduce((a, v) => a + v, 0));
  const insights: CallInsights = {
    days: 90,
    total: byHour.reduce((a, v) => a + v, 0),
    heat,
    byHour,
    byWeekday,
    avgMinute: 11 * 60 + 12,
    busiestHour: 10,
    bestWeekday: 1,
    perActiveDay: 14.3,
    thisWeek: 61,
    lastWeek: 48,
    office: { avgMinute: 12 * 60 + 5, perAgent: 402 },
  };

  return (
    <CalendarApp
      view={view}
      dateKey={todayPL()}
      rangeStart={view === "miesiac" ? mondayOfKey(`${todayPL().slice(0, 7)}-01`) : monday}
      rangeEnd={view === "miesiac" ? addDaysKey(mondayOfKey(`${todayPL().slice(0, 7)}-01`), 41) : addDaysKey(monday, 6)}
      events={events}
      insights={insights}
      scope="moje"
      scopeOptions={[
        { value: "moje", label: "Mój kalendarz" },
        { value: "biuro", label: "Całe biuro" },
      ]}
      insightsWho="Ty"
      insightsSelf
      agents={[{ id: "u1", name: "Wiktor Szostek" }]}
      clients={[]}
      properties={[]}
      reportDefault={false}
    />
  );
}
