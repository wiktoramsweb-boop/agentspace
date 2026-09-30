import { Card } from "../../components/ui";
import { describeDetails } from "@/lib/property-fields";
import type { Property } from "@/lib/types";

/**
 * Pola zależne od typu nieruchomości na karcie oferty. Sekcje i etykiety bierzemy
 * z tego samego słownika co kreator, więc nie ma szansy, żeby się rozjechały.
 */
export function DetailsCard({ property }: { property: Property }) {
  const groups = describeDetails(
    property.property_type,
    property.deal_kind,
    property.details as Record<string, unknown> | null,
  );
  if (!groups.length) return null;

  return (
    <Card>
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-500">
        Szczegóły oferty
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Pola właściwe dla tego typu nieruchomości. Uzupełnisz je w edycji oferty, w kroku Parametry.
      </p>
      <div className="space-y-2">
        {groups.map((g, i) => (
          <details
            key={g.title}
            open={i < 2}
            className="group rounded-xl border border-slate-200 bg-slate-50/60"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-900">
              <svg
                className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.4}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
              <span className="flex-1">{g.title}</span>
              <span className="text-[11px] font-normal text-slate-400">{g.items.length}</span>
            </summary>
            <dl className="grid gap-x-6 gap-y-2.5 border-t border-slate-200 px-3.5 py-3 sm:grid-cols-2">
              {g.items.map((it) => (
                <div key={it.label} className="min-w-0">
                  <dt className="text-xs text-slate-500">{it.label}</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {it.value}
                    {it.unit && <span className="ml-1 text-xs font-normal text-slate-400">{it.unit}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
    </Card>
  );
}
