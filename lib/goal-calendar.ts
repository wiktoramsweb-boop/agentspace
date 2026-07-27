// Miesięczny kalendarz wykonania celu telefonów (cold calls) per dzień.
// UWAGA: cała apka kluczuje dni po dacie UTC (daily_logs.log_date = new Date().toISOString().slice(0,10)),
// więc tu też liczymy w UTC (Date.UTC z godziną 12, żeby uniknąć przesunięć DST).

export type CalDay = {
  date: string; // yyyy-mm-dd (UTC)
  dayNum: number;
  calls: number;
  target: number;
  met: boolean; // wykonany cel dnia (target > 0 i calls >= target)
  partial: boolean; // coś zrobione, ale poniżej celu
  isToday: boolean;
  isFuture: boolean;
  inMonth: boolean; // należy do miesiąca referencyjnego
};

export type MonthCalendar = { monthLabel: string; weeks: CalDay[][] };

const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

function ymdUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Poniedziałkowy indeks dnia tygodnia (0 = poniedziałek … 6 = niedziela). */
function mondayIdx(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

export function buildMonthCalendar(
  logs: { log_date: string; cold_calls: number }[],
  dailyTarget: number,
  ref: Date = new Date(),
): MonthCalendar {
  const callsByDate = new Map<string, number>();
  for (const l of logs) callsByDate.set(l.log_date, l.cold_calls ?? 0);

  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth();
  const todayStr = ymdUTC(new Date());

  const first = new Date(Date.UTC(year, month, 1, 12));
  const last = new Date(Date.UTC(year, month + 1, 0, 12)); // ostatni dzień miesiąca

  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - mondayIdx(first));
  const end = new Date(last);
  end.setUTCDate(last.getUTCDate() + (6 - mondayIdx(last)));

  const weeks: CalDay[][] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const week: CalDay[] = [];
    for (let i = 0; i < 7; i++) {
      const ds = ymdUTC(cur);
      const calls = callsByDate.get(ds) ?? 0;
      const met = dailyTarget > 0 && calls >= dailyTarget;
      week.push({
        date: ds,
        dayNum: cur.getUTCDate(),
        calls,
        target: dailyTarget,
        met,
        partial: calls > 0 && !met,
        isToday: ds === todayStr,
        isFuture: ds > todayStr,
        inMonth: cur.getUTCMonth() === month,
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  return { monthLabel: `${MONTHS_PL[month]} ${year}`, weeks };
}
