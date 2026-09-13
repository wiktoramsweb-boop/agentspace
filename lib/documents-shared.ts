/**
 * Dokumenty przy ofercie i kliencie: rodzaje, rozpoznawanie po nazwie pliku,
 * formatowanie rozmiaru. Bezpieczne w przeglądarce (bez dostępu do bazy).
 */

export type DocEntity = "property" | "client";

export type DocKind = { value: string; label: string };

export const PROPERTY_DOC_KINDS: DocKind[] = [
  { value: "umowa_posrednictwa", label: "Umowa pośrednictwa" },
  { value: "kw", label: "Odpis księgi wieczystej" },
  { value: "rzut", label: "Rzut / plan" },
  { value: "swiadectwo", label: "Świadectwo energetyczne" },
  { value: "zaswiadczenie", label: "Zaświadczenie ze spółdzielni / wspólnoty" },
  { value: "protokol", label: "Protokół zdawczo-odbiorczy" },
  { value: "inne", label: "Inny dokument" },
];

export const CLIENT_DOC_KINDS: DocKind[] = [
  { value: "umowa_posrednictwa", label: "Umowa pośrednictwa" },
  { value: "umowa_rezerwacyjna", label: "Umowa rezerwacyjna" },
  { value: "dowod", label: "Skan dowodu osobistego" },
  { value: "pelnomocnictwo", label: "Pełnomocnictwo" },
  { value: "rodo", label: "Zgoda RODO" },
  { value: "inne", label: "Inny dokument" },
];

export function docKinds(entity: DocEntity): DocKind[] {
  return entity === "property" ? PROPERTY_DOC_KINDS : CLIENT_DOC_KINDS;
}

export function docKindLabel(entity: DocEntity, kind: string): string {
  return docKinds(entity).find((k) => k.value === kind)?.label ?? "Inny dokument";
}

/** Rodzaj zgadnięty z nazwy pliku - agent zwykle nie musi go wybierać ręcznie. */
export function guessDocKind(entity: DocEntity, fileName: string): string {
  const n = fileName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
  const rules: [RegExp, string][] = [
    [/\bkw\b|ksieg|wieczyst/, "kw"],
    [/rzut|plan|projekt/, "rzut"],
    [/swiadectw|energet|charakterystyk/, "swiadectwo"],
    [/zaswiadcz|spoldziel|wspolnot/, "zaswiadczenie"],
    [/protokol/, "protokol"],
    [/rezerwac/, "umowa_rezerwacyjna"],
    [/posredn|umowa/, "umowa_posrednictwa"],
    [/dowod|\bid\b|paszport/, "dowod"],
    [/pelnomoc/, "pelnomocnictwo"],
    [/rodo|zgod/, "rodo"],
  ];
  const allowed = new Set(docKinds(entity).map((k) => k.value));
  for (const [re, kind] of rules) if (re.test(n) && allowed.has(kind)) return kind;
  return "inne";
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Krótka etykieta typu pliku na ikonie: PDF, JPG, DOC... */
export function fileBadge(name: string, mime?: string | null): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  if (/^image\//.test(mime ?? "") || /^(jpe?g|png|webp|heic)$/.test(ext)) return ext === "png" ? "PNG" : "JPG";
  // Arkusze sprawdzamy przed Wordem: typ pliku xlsx zawiera słowo „officedocument".
  if (/^(xlsx?|ods)$/.test(ext) || /spreadsheet|ms-excel/.test(mime ?? "")) return "XLS";
  if (/^(docx?|odt)$/.test(ext) || /wordprocessing|msword|opendocument\.text/.test(mime ?? "")) return "DOC";
  return ext.slice(0, 4).toUpperCase() || "PLIK";
}

export type DocumentItem = {
  id: string;
  kind: string;
  name: string;
  size_bytes: number | null;
  mime: string | null;
  created_at: string;
  uploaderName: string | null;
};
