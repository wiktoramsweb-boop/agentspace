import { formatDatePL } from "@/lib/datetime";
import { Card } from "../../components/ui";
import { CLIENT_SOURCES, type Client } from "@/lib/types";

const SOURCE_MAP = Object.fromEntries(CLIENT_SOURCES.map((s) => [s.value, s.label]));

/**
 * Kartoteka kontaktu w układzie ASARI: informacje podstawowe, dane adresowe
 * i zgody marketingowe. Puste sekcje się nie pokazują, żeby karta nie puchła
 * od myślników przy kliencie, o którym wiemy tylko imię i telefon.
 */
export function ClientDetails({ client }: { client: Client }) {
  const extraPhones = client.phones ?? [];
  const extraEmails = client.emails ?? [];

  const hasBasics =
    client.company || client.position || client.source || client.pesel || client.nip ||
    client.id_document || extraPhones.length > 0 || extraEmails.length > 0;
  const hasAddress = client.postal_code || client.voivodeship || client.country;

  if (!hasBasics && !hasAddress && !client.marketing_consent) return null;

  return (
    <>
      {hasBasics && (
        <Card>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
            Informacje podstawowe
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Firma" value={client.company} />
            <Row label="Stanowisko" value={client.position} />
            <Row label="Źródło" value={client.source ? (SOURCE_MAP[client.source] ?? client.source) : null} />
            <Row label="Nr dokumentu" value={client.id_document} />
            <Row label="PESEL" value={client.pesel} />
            <Row label="NIP" value={client.nip} />

            {extraPhones.map((p, i) => (
              <div key={`p${i}`} className="flex justify-between gap-3">
                <dt className="text-slate-500">Telefon {p.label ? `(${p.label})` : "dodatkowy"}</dt>
                <dd>
                  <a href={`tel:${p.value}`} className="text-emerald-600 hover:text-emerald-700">
                    {p.value}
                  </a>
                </dd>
              </div>
            ))}
            {extraEmails.map((e, i) => (
              <div key={`e${i}`} className="flex justify-between gap-3">
                <dt className="text-slate-500">E-mail dodatkowy</dt>
                <dd className="truncate">
                  <a href={`mailto:${e.value}`} className="text-emerald-600 hover:text-emerald-700">
                    {e.value}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {hasAddress && (
        <Card>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
            Dane adresowe
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Kod pocztowy" value={client.postal_code} />
            <Row label="Województwo" value={client.voivodeship} />
            <Row label="Państwo" value={client.country} />
          </dl>
        </Card>
      )}

      {client.marketing_consent && (
        <Card>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
            Zgody marketingowe
          </h2>
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Zgoda udzielona
            </span>
            {client.marketing_consent_at && (
              <span className="text-slate-500">
                {formatDatePL(client.marketing_consent_at)}
              </span>
            )}
          </p>
        </Card>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-800">{value}</dd>
    </div>
  );
}
