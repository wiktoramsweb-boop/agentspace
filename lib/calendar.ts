// Budowanie linków "Dodaj do Google Calendar" — wariant bez API/OAuth.
// Klik w link otwiera Google Calendar z gotowym, wypełnionym wydarzeniem;
// użytkownik tylko potwierdza "Zapisz". Zero konfiguracji po stronie Google.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Znacznik daty dla wydarzenia całodniowego w formacie YYYYMMDD (czas lokalny).
function allDayStamp(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

// Parsuje "YYYY-MM-DD" jako datę lokalną (bez przesunięcia strefy),
// a pełne ISO z czasem — normalnie. Brak daty => dziś.
function toLocalDate(input?: string | null): Date {
  if (!input) return new Date();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  return new Date(input);
}

export function googleCalendarUrl(opts: {
  title: string;
  date?: string | null; // ISO / "YYYY-MM-DD" / null (=> dziś)
  details?: string;
  location?: string;
}): string {
  const start = toLocalDate(opts.date);
  // Wydarzenie całodniowe: data końca jest wyłączna, więc dodajemy 1 dzień.
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${allDayStamp(start)}/${allDayStamp(end)}`,
  });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
