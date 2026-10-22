import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getScenarioBySlug, getWeeklySessionCount } from "@/lib/data";
import { PERSONALITIES } from "@/lib/types";
import { startSession } from "../actions";
import { Card } from "../../components/ui";
import { SubmitButton } from "../../components/submit-button";
import { glosWlaczony } from "@/lib/glos";
import { plecRozmowcy } from "@/lib/karta-rozmowy";
import { maV49 } from "@/lib/schemat";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { Select } from "../../components/select";
import { adresZMiastem } from "@/lib/adres";
import { technika as znajdzTechnike } from "@/lib/techniki/techniki";
import { lekcja as znajdzLekcje } from "@/lib/coach/sciezka";
import { kartaRozmowy } from "@/lib/karta-rozmowy";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ oferta?: string; zadanie?: string; technika?: string; lekcja?: string }> };

/** Oferty do treningu: agent swoje, reszta zespołu wszystkie z biura. */
async function ofertyDoTreningu(agencyId: string, userId: string, role: string) {
  let q = createSupabaseAdmin()
    .from("properties")
    .select("id, title, address, city, price_pln, area_m2")
    .eq("agency_id", agencyId)
    .order("updated_at", { ascending: false })
    .limit(300);
  if (role === "agent" || role === "trainee") q = q.eq("agent_id", userId);
  const { data } = await q;
  return (data ?? []).map((o) => ({
    value: o.id as string,
    label: adresZMiastem(o.address as string | null, o.city as string | null) || (o.title as string),
    hint: [o.area_m2 ? `${o.area_m2} m²` : "", o.price_pln ? `${new Intl.NumberFormat("pl-PL").format(Number(o.price_pln))} zł` : ""].filter(Boolean).join(" · ") || undefined,
  }));
}

/** Karta wyboru głosu. Węższa niż karta trybu, bo opis jest jednozdaniowy. */
function GlosKarty({
  wartosc,
  tytul,
  opis,
  domyslny,
}: {
  wartosc: string;
  tytul: string;
  opis: string;
  domyslny?: boolean;
}) {
  return (
    <label className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:ring-2 has-[:checked]:ring-emerald-500/40">
      <input type="radio" name="plec" value={wartosc} defaultChecked={domyslny} className="peer sr-only" />
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-900">{tytul}</span>
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 transition-colors group-has-[:checked]:border-emerald-500 group-has-[:checked]:bg-emerald-500">
          <span className="h-2 w-2 rounded-full bg-transparent transition-colors group-has-[:checked]:bg-white" />
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{opis}</p>
    </label>
  );
}

/** Karta wyboru trybu. Ta sama stylizacja, co przy osobowości i trudności. */
function TrybKarty({
  wartosc,
  tytul,
  opis,
  stopka,
  domyslny,
}: {
  wartosc: string;
  tytul: string;
  opis: string;
  stopka: string;
  domyslny?: boolean;
}) {
  return (
    <label className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all hover:border-slate-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:ring-2 has-[:checked]:ring-emerald-500/40">
      <input type="radio" name="tryb" value={wartosc} defaultChecked={domyslny} className="peer sr-only" />
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-900">{tytul}</span>
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 transition-colors group-has-[:checked]:border-emerald-500 group-has-[:checked]:bg-emerald-500">
          <span className="h-2 w-2 rounded-full bg-transparent transition-colors group-has-[:checked]:bg-white" />
        </span>
      </div>
      <p className="text-sm text-slate-500">{opis}</p>
      <p className="mt-2 text-xs text-slate-400">{stopka}</p>
    </label>
  );
}

export default async function ScenarioSetupPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const { slug } = await params;
  const sp = await searchParams;
  const scenario = await getScenarioBySlug(slug);
  if (!scenario) notFound();

  const glos = glosWlaczony();
  const lekcjaZ = znajdzLekcje(sp.lekcja);
  const lekcja = lekcjaZ && lekcjaZ.scenariusz === slug ? lekcjaZ : null;
  const technika = sp.technika ? znajdzTechnike(sp.technika) : lekcja ? znajdzTechnike(lekcja.technika) : undefined;
  const karta = kartaRozmowy(scenario!.brief);
  const charakter = lekcja ? PERSONALITIES.find((p) => p.value === lekcja.charakter) : null;
  const v49 = await maV49();
  const oferty = user.agency_id && v49 ? await ofertyDoTreningu(user.agency_id, user.id, user.role) : [];
  const zadanie =
    v49 && sp.zadanie
      ? (
          await createSupabaseAdmin()
            .from("training_assignments")
            .select("id, min_score, difficulty, personality, property_id, note")
            .eq("id", sp.zadanie)
            .eq("agent_id", user.id)
            .maybeSingle()
        ).data
      : null;

  // Tygodniowy limit rozmów AI - jeśli wyczerpany, nie pozwól zacząć.
  const limitReached =
    user.weekly_ai_limit != null && (await getWeeklySessionCount(user.id)) >= user.weekly_ai_limit;

  return (
    <>
      <Link href="/app/trening" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        ← Wszystkie scenariusze
      </Link>

      <section className="relative mb-8 overflow-hidden rounded-[28px] bg-slate-900 p-6 text-white md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
              {lekcja ? `Poziom ${lekcja.poziom.nr} · Lekcja ${lekcja.id} · próg ${lekcja.prog}/100` : "Rozmowa treningowa"}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{lekcja ? lekcja.tytul : scenario!.title}</h1>
            {lekcja && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/85">{lekcja.cel}</p>}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">{scenario!.brief}</p>
          </div>
          <div className="flex items-center gap-4 rounded-3xl bg-white/[0.06] p-4 ring-1 ring-white/10 md:w-64 md:flex-col md:text-center">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl font-bold text-slate-900">
              {karta.kto.replace(/^Pan[i]?\s+/, "").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{karta.kto}</p>
              {karta.szczegoly.length > 0 && <p className="mt-1 text-xs text-white/55">{karta.szczegoly.join(" · ")}</p>}
            </div>
          </div>
        </div>
      </section>

      {technika && (
        <Card className="mb-8 !border-slate-900 !bg-slate-900 text-white">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Ćwiczysz technikę</p>
            <Link href={`/app/techniki/${technika.slug}`} className="text-xs text-slate-300 hover:text-white">
              Pełny opis →
            </Link>
          </div>
          <p className="mt-1 text-lg font-semibold">{technika.nazwa}</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {technika.kroki.map((k, i) => (
              <li key={k} className="flex gap-2 text-sm text-slate-200">
                <span className="font-bold text-emerald-300">{i + 1}.</span>
                {k}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-slate-400">Kroki będą widoczne także w trakcie rozmowy.</p>
        </Card>
      )}

      {limitReached && (
        <Card className="mb-8 !border-amber-500/30 !bg-amber-500/10">
          <p className="font-semibold text-amber-700">Wykorzystałeś limit rozmów AI na ten tydzień.</p>
          <p className="mt-1 text-sm text-amber-700">
            Limit odnowi się w poniedziałek. Jeśli potrzebujesz więcej - poproś CEO o zwiększenie limitu.
          </p>
        </Card>
      )}

      {zadanie && (
        <Card className="mb-8 !border-violet-300 !bg-violet-50">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-700">Zadanie od menedżera</p>
          <p className="mt-1 text-slate-800">
            Próg zaliczenia: <strong>{zadanie.min_score ?? 7}/10</strong>. Trudność{zadanie.personality ? ", typ klienta" : ""}
            {zadanie.property_id ? " i oferta są" : " jest"} ustawione w zadaniu, wybór poniżej ich nie zmieni.
          </p>
          {zadanie.note && <p className="mt-2 text-sm italic text-slate-600">„{zadanie.note}”</p>}
        </Card>
      )}

      <form action={startSession}>
        <input type="hidden" name="scenarioId" value={scenario!.id} />
        {zadanie && <input type="hidden" name="assignmentId" value={zadanie.id} />}
        {technika && <input type="hidden" name="technika" value={technika.slug} />}
        {lekcja && (
          <>
            <input type="hidden" name="lekcja" value={lekcja.id} />
            <input type="hidden" name="personality" value={lekcja.charakter} />
            <input type="hidden" name="difficulty" value={lekcja.poziomTrudnosci} />
            <div className="mb-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Charakter klienta (ustawia lekcja)</p>
                <p className="mt-1 font-semibold text-slate-900">{charakter?.label ?? lekcja.charakter}</p>
                {charakter && <p className="text-sm text-slate-500">{charakter.description}</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Trudność (ustawia lekcja)</p>
                <p className="mt-1 font-semibold text-slate-900">{{ latwy: "Łatwy", sredni: "Średni", trudny: "Trudny" }[lekcja.poziomTrudnosci]}</p>
                <p className="text-sm text-slate-500">Zaliczasz od {lekcja.prog} punktów na 100.</p>
              </div>
            </div>
          </>
        )}

        {glos && (
          <>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-600">
              Krok 2 · Jak chcesz trenować?
            </p>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Rozmowa czy pisanie?</h2>
            <p className="mb-4 text-sm text-slate-500">
              Jedno i drugie uczy czego innego. Przez telefon ćwiczysz tempo, przerywanie i to, co
              robisz z ciszą. Pisząc masz czas dobrać słowa.
            </p>
            <div className="mb-8 grid gap-3 sm:grid-cols-2">
              <TrybKarty
                wartosc="glos"
                domyslny
                tytul="Rozmowa przez telefon"
                opis="Dzwonisz, klient odbiera i rozmawiacie na głos. Najbliżej prawdziwego telefonu."
                stopka="Potrzebny mikrofon · 22 kredyty za minutę"
              />
              <TrybKarty
                wartosc="pisanie"
                tytul="Pisanie"
                opis="Piszesz na klawiaturze albo dyktujesz mikrofonem, a klient odpisuje."
                stopka="Bez słuchawek · 1 kredyt za wypowiedź"
              />
            </div>

          </>
        )}

        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-600">
          Kto odbierze
        </p>
        <p className="mb-4 text-sm text-slate-500">
          Domyślnie tak jak w scenariuszu. Wybierz kobietę albo mężczyznę, a klient zmieni się
          w całości: imię, „Pan” albo „Pani” i sposób mówienia, także głos w rozmowie telefonicznej.
        </p>
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <GlosKarty wartosc="auto" domyslny tytul="Jak w scenariuszu" opis={plecRozmowcy(scenario!.brief) === "k" ? "Kobieta, zgodnie z opisem" : "Mężczyzna, zgodnie z opisem"} />
          <GlosKarty wartosc="k" tytul="Kobieta" opis="Pani, kobiecy głos" />
          <GlosKarty wartosc="m" tytul="Mężczyzna" opis="Pan, męski głos" />
        </div>

        {!lekcja && (
          <>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-600">
          Krok {glos ? 3 : 2} · Wybierz typ klienta
        </p>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Jak ma zachowywać się AI?</h2>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONALITIES.map((p, i) => (
            <label
              key={p.value}
              className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all hover:border-slate-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:ring-2 has-[:checked]:ring-emerald-500/40"
            >
              <input
                type="radio"
                name="personality"
                value={p.value}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-900">{p.label}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 transition-colors group-has-[:checked]:border-emerald-500 group-has-[:checked]:bg-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-transparent transition-colors group-has-[:checked]:bg-white" />
                </span>
              </div>
              <p className="text-sm text-slate-500">{p.description}</p>
            </label>
          ))}
        </div>

        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-600">
          Krok {glos ? 4 : 3} · Poziom trudności
        </p>
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Jak trudny ma być klient?</h2>
        <p className="mb-4 text-sm text-slate-500">
          Zacznij od łatwego, żeby złapać pewność - potem podnoś poprzeczkę. Nie każdy klient jest trudny.
        </p>
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { value: "latwy", label: "Łatwy", desc: "Życzliwy, daje się przekonać - na rozgrzewkę" },
            { value: "sredni", label: "Średni", desc: "Realistyczny opór, ustępuje przy dobrych argumentach" },
            { value: "trudny", label: "Trudny", desc: "Wymagający, trzyma obiekcję twardo" },
          ].map((d) => (
            <label
              key={d.value}
              className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all hover:border-slate-300 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:ring-2 has-[:checked]:ring-emerald-500/40"
            >
              <input
                type="radio"
                name="difficulty"
                value={d.value}
                defaultChecked={d.value === "sredni"}
                className="peer sr-only"
              />
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-900">{d.label}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 transition-colors group-has-[:checked]:border-emerald-500 group-has-[:checked]:bg-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-transparent transition-colors group-has-[:checked]:bg-white" />
                </span>
              </div>
              <p className="text-sm text-slate-500">{d.desc}</p>
            </label>
          ))}
        </div>

          </>
        )}

        {oferty.length > 0 && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-600">Opcjonalnie · Twoja oferta</p>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Trenuj na swojej ofercie</h2>
            <p className="mb-4 text-sm text-slate-500">
              Klient zapyta o to konkretne mieszkanie: cenę, metraż, to, czego nie ma w opisie. Najlepsza rozgrzewka
              przed prawdziwym telefonem. Ocena sprawdzi też, czy znasz swoją ofertę.
            </p>
            <div className="max-w-md">
              <Select
                name="propertyId"
                aria-label="Oferta do treningu"
                options={oferty}
                defaultValue={sp.oferta && oferty.some((o) => o.value === sp.oferta) ? sp.oferta : ""}
                placeholder="Bez oferty, jak w scenariuszu"
              />
            </div>
          </div>
        )}

        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-emerald-600">
          Krok {glos ? 5 : 4} · Zaczynamy
        </p>
        <SubmitButton
          overlay
          overlayText="Uruchamiam sesję z AI…"
          pendingText="Uruchamiam…"
          disabled={limitReached}
          className="w-full rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-white hover:bg-emerald-400 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.7)] sm:w-auto"
        >
          {limitReached ? "Limit wyczerpany na ten tydzień" : "Rozpocznij rozmowę z AI klientem →"}
        </SubmitButton>
        <p className="mt-2 text-sm text-slate-500">
          {glos
            ? "Przy rozmowie telefonicznej klient odezwie się, gdy odbierze. Przy pisaniu zacznie pierwszy. Na końcu rozłącz się albo kliknij „Zakończ i oceń”, a dostaniesz ocenę."
            : "AI odezwie się pierwszy. Pisz jak do prawdziwego klienta. Na końcu kliknij „Zakończ i oceń”."}
        </p>
      </form>
    </>
  );
}
