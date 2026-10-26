import Link from "next/link";
import { Card } from "../../components/ui";
import { DostepPortal, type DostepWiersz } from "../../klienci/[id]/dostep-portal";

/**
 * Zakładka portalu przy nieruchomości. Gdy właściciel ma już portal, zakładka
 * w ogóle tu nie prowadzi, tylko prosto na jego stronę w „Portalu klienta”
 * (jedno miejsce zamiast dwóch). Tutaj zostaje utworzenie dostępu.
 */
export function PortalTab({
  propertyTitle,
  owner,
  dostepy,
  qr,
  appUrl,
}: {
  propertyId?: string;
  propertyTitle: string;
  cenaObecna?: number | null;
  owner: { id: string; name: string } | null;
  dostepy: DostepWiersz[];
  qr: Record<string, string>;
  appUrl: string;
  activities?: unknown[];
  dodaj?: React.ReactNode;
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

  const aktywny = dostepy.find((d) => !d.revoked_at && d.rodzaj === "sprzedajacy");

  return (
    <div className="space-y-6">
      {aktywny && (
        <Link
          href={`/app/portal/${aktywny.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900 p-5 text-white transition hover:bg-slate-800"
        >
          <span>
            <span className="block font-semibold">Otwórz portal klienta: {owner.name}</span>
            <span className="block text-sm text-white/60">Działania, podpowiedzi dla klienta, propozycja ceny i wiadomości w jednym miejscu.</span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Właściciel: <Link href={`/app/klienci/${owner.id}`} className="font-semibold underline">{owner.name}</Link>. Utwórz mu
        dostęp i pokaż kod QR przy podpisaniu umowy, a w portalu zobaczy „{propertyTitle}”.
      </div>

      <DostepPortal
        clientId={owner.id}
        clientName={owner.name}
        appUrl={appUrl}
        istniejace={dostepy}
        qr={qr}
        presetRodzaj="sprzedajacy"
        tylkoRodzaj="sprzedajacy"
      />
    </div>
  );
}
