import { requireOwner } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader, Card } from "../../components/ui";
import { DemoPanel } from "./demo-panel";

export const metadata = { title: "Konto demo | AgentSpace" };

async function stan(agencyId: string) {
  const admin = createSupabaseAdmin();
  const licz = async (tabela: string) => {
    const { count } = await admin.from(tabela).select("id", { count: "exact", head: true }).eq("agency_id", agencyId);
    return count ?? 0;
  };
  const { data: agency } = await admin
    .from("agencies")
    .select("is_demo, demo_refreshed_at")
    .eq("id", agencyId)
    .maybeSingle();

  const [osoby, oferty, klienci, dzialania, leady, poszukiwania, faktury] = await Promise.all([
    licz("profiles"),
    licz("properties"),
    licz("clients"),
    licz("activities"),
    licz("leads"),
    licz("searches"),
    licz("invoices"),
  ]);

  return {
    jestDemo: Boolean(agency?.is_demo),
    odswiezone: (agency?.demo_refreshed_at as string | null) ?? null,
    osoby,
    oferty,
    klienci,
    dzialania,
    leady,
    poszukiwania,
    faktury,
  };
}

export default async function DemoPage() {
  const user = await requireOwner();
  const s = user.agency_id
    ? await stan(user.agency_id)
    : {
        jestDemo: false,
        odswiezone: null,
        osoby: 0,
        oferty: 0,
        klienci: 0,
        dzialania: 0,
        leady: 0,
        poszukiwania: 0,
        faktury: 0,
      };

  return (
    <>
      <PageHeader
        title="Konto demo"
        subtitle="Dane do pokazów u klienta: klienci, oferty, transakcje, działania, leady, poszukiwania i faktury, plus dane firmy. Odświeżają się same, żeby kalendarz nigdy nie był pusty."
      />

      {!s.jestDemo && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">To biuro nie jest jeszcze oznaczone jako demo</p>
          <p className="mt-1">
            Oznaczenie pojawi się po pierwszym wypełnieniu danych. Jeśli to jest Twoje
            prawdziwe biuro, <strong>nie używaj tego ekranu</strong>: operacje kasują
            klientów, oferty i transakcje.
          </p>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Osoby w zespole", s.osoby],
          ["Oferty", s.oferty],
          ["Klienci", s.klienci],
          ["Działania", s.dzialania],
          ["Leady", s.leady],
          ["Poszukiwania", s.poszukiwania],
          ["Faktury", s.faktury],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Przygotowanie</h2>
        <div className="mb-6 mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>Krok 1</strong> zakłada konta pięciu agentów. Bez nich nie ma zespołu,
            rankingu ani prowizji per osoba, bo profil w systemie musi mieć konto. Hasła są
            losowe i nigdzie nie zapisywane: na pokazie logujesz się jako właściciel.
          </p>
          <p>
            <strong>Krok 2</strong> wypełnia biuro danymi liczonymi od dzisiaj: klienci,
            oferty ze zdjęciami, zamknięte transakcje, cele agentów, dziennik wyników
            z sześciu tygodni wstecz oraz kalendarz na trzy tygodnie w przód.
          </p>
          <p>
            Potem nic nie musisz robić. Po zalogowaniu na to konto dane odświeżają się same,
            jeśli minęło więcej niż 12 godzin. Pokaz za dwa miesiące wygląda tak samo jak dziś.
          </p>
        </div>

        <DemoPanel />

        {s.odswiezone && (
          <p className="mt-5 text-xs text-slate-400">
            Ostatnie odświeżenie:{" "}
            {new Intl.DateTimeFormat("pl-PL", { dateStyle: "long", timeStyle: "short" }).format(
              new Date(s.odswiezone),
            )}
          </p>
        )}
      </Card>
    </>
  );
}
