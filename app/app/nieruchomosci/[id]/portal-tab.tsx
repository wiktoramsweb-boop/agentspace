import Link from "next/link";
import { Card } from "../../components/ui";
import { DostepPortal, type DostepWiersz } from "../../klienci/[id]/dostep-portal";
import { UdostepnijZdarzenie } from "../../klienci/[id]/udostepnij-zdarzenie";
import { WpisDlaKlienta, PropozycjaCeny } from "./portal-panel";
import { ACTIVITY_KINDS, type Activity } from "@/lib/types";

/** Data i godzina w jednej linii - lista ma być skanowalna wzrokiem. */
function kiedyKrotko(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Wszystko, co klient widzi o tej nieruchomości - w jednym miejscu.
 *
 * Wcześniej agent musiał: wejść w kartę klienta po kod QR, potem w Działania
 * po przełącznik widoczności, a cenę zmienić w kreatorze oferty. Teraz steruje
 * tym stąd, z poziomu oferty, której to dotyczy.
 */
export function PortalTab({
  propertyId,
  propertyTitle,
  cenaObecna,
  owner,
  dostepy,
  qr,
  appUrl,
  activities,
}: {
  propertyId: string;
  propertyTitle: string;
  cenaObecna: number | null;
  owner: { id: string; name: string } | null;
  dostepy: DostepWiersz[];
  qr: Record<string, string>;
  appUrl: string;
  activities: Activity[];
}) {
  if (!owner) {
    return (
      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">Portal klienta</h2>
        <p className="mt-3 text-sm text-slate-600">
          Najpierw wskaż właściciela tej nieruchomości w zakładce Oferta. Dostęp do portalu jest
          zawsze przypisany do konkretnej osoby, nie do samej oferty.
        </p>
      </Card>
    );
  }

  const aktywny = dostepy.find((d) => !d.revoked_at);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Właściciel: <Link href={`/app/klienci/${owner.id}`} className="font-semibold underline">{owner.name}</Link>.
        Wszystko poniżej dotyczy tego, co zobaczy w swojej aplikacji.
      </div>

      <DostepPortal
        clientId={owner.id}
        clientName={owner.name}
        appUrl={appUrl}
        istniejace={dostepy}
        qr={qr}
        presetRodzaj="sprzedajacy"
      />

      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Napisz, co się dzieje
        </h2>
        <p className="mt-2 mb-3 text-sm text-slate-600">
          Jedno zdanie, które klient zobaczy od razu w swojej aplikacji. Zapisze się też jako
          działanie przy tej ofercie, więc nie powstaje druga historia sprawy.
        </p>
        <WpisDlaKlienta propertyId={propertyId} />
      </Card>

      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Propozycja ceny
        </h2>
        <p className="mt-2 mb-3 text-sm text-slate-600">
          Obniżkę zatwierdza właściciel, nie biuro. Po jego zgodzie cena w ofercie zmieni się sama,
          a w portalu zostanie ślad z datą decyzji.
        </p>
        {aktywny ? (
          <PropozycjaCeny accessId={aktywny.id} propertyId={propertyId} obecna={cenaObecna} />
        ) : (
          <p className="text-sm text-slate-500">
            Najpierw utwórz dostęp do portalu - bez niego klient nie ma gdzie kliknąć zgody.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Co klient widzi w kalendarzu ({activities.length})
        </h2>
        <p className="mt-2 mb-4 text-sm text-slate-600">
          Prezentacje włączają się same. Reszta działań jest domyślnie ukryta, bo w temacie bywają
          dane innych osób. Zaznacz to, co klient ma zobaczyć, i napisz mu własny opis.
        </p>

        {activities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
            Brak działań przy tej ofercie. Dodaj je w zakładce Działania.
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => {
              const kind = ACTIVITY_KINDS.find((k) => k.value === a.kind);
              const widoczne = Boolean((a as { client_visible?: boolean }).client_visible);
              return (
                <li key={a.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {kind && (
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${kind.badge}`}>
                        {kind.label}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {a.subject}
                    </span>
                    {a.due_at && <span className="text-xs text-slate-400">{kiedyKrotko(a.due_at)}</span>}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        widoczne ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {widoczne ? "Widoczne" : "Ukryte"}
                    </span>
                  </div>
                  <UdostepnijZdarzenie
                    activityId={a.id}
                    widoczne={widoczne}
                    opis={(a as { client_note?: string | null }).client_note ?? null}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="text-xs text-slate-400">
        Podgląd klienta: {appUrl}/klient/… · {propertyTitle}
      </p>
    </div>
  );
}
