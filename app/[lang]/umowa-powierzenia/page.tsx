import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

/**
 * Umowa powierzenia przetwarzania danych osobowych (art. 28 RODO).
 *
 * PROJEKT DO WERYFIKACJI PRAWNEJ. Biuro korzystające z AgentSpace jest
 * administratorem danych swoich klientów, a Operator podmiotem
 * przetwarzającym - bez tego dokumentu przetwarzanie nie ma podstawy,
 * a dział prawny po stronie biura zablokuje zakup.
 *
 * Lista podprocesorów musi odpowiadać stanowi faktycznemu. Przy dokładaniu
 * kolejnego dostawcy, który dotyka danych biur, dopisz go TUTAJ.
 */

const UPDATED = "29 września 2026";

const SUBPROCESSORS = [
  {
    name: "Supabase",
    role: "Baza danych, uwierzytelnianie i przechowywanie plików",
    where: "Unia Europejska (Frankfurt, infrastruktura AWS)",
  },
  {
    name: "Vercel",
    role: "Hosting aplikacji i przetwarzanie żądań",
    where: "Unia Europejska (region fra1), podmiot z siedzibą w USA",
  },
  {
    name: "Anthropic",
    role: "Modele językowe: propozycje wiadomości, opisy ofert, podsumowania i trening rozmów",
    where: "USA",
  },
  {
    name: "Resend",
    role: "Wysyłka wiadomości e-mail (raporty, powiadomienia)",
    where: "USA",
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  return pageMetadata(
    locale,
    "/umowa-powierzenia",
    "Umowa powierzenia przetwarzania danych | AgentSpace",
    "Umowa powierzenia przetwarzania danych osobowych (art. 28 RODO) dla biur nieruchomości korzystających z AgentSpace. Zakres, zabezpieczenia, lista podprocesorów.",
  );
}

export default async function UmowaPowierzenia({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const notice = getDict(locale).pages.legal.notice;

  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PageHero
          eyebrow="Prawne"
          title="Umowa powierzenia przetwarzania danych osobowych"
          description={
            <span className="text-[var(--color-mk-muted)]">Ostatnia aktualizacja: {UPDATED}</span>
          }
          compact
        />

        <section className="border-b border-[var(--mk-hairline)] px-6 py-16">
          <article className="prose-blog mx-auto max-w-3xl">
            {notice ? (
              <p className="rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-surface-2)] p-4 text-sm text-[var(--color-mk-muted)]">
                {notice}
              </p>
            ) : null}

            <p>
              Niniejsza Umowa stanowi integralną część{" "}
              <Link href={localeHref(locale, "/regulamin")}>Regulaminu świadczenia usługi</Link>{" "}
              i zostaje zawarta z chwilą zawarcia Umowy głównej. Jest zawierana na podstawie
              art. 28 ust. 3 RODO.
            </p>

            <h2>§1. Strony i role</h2>
            <p>
              <strong>Administratorem</strong> danych osobowych przetwarzanych w ramach Konta
              biura jest Klient, czyli biuro nieruchomości korzystające z Usługi.
            </p>
            <p>
              <strong>Podmiotem przetwarzającym</strong> jest Spectra Nieruchomości,
              ul. Zbożowa 2/1, 30-002 Kraków, NIP 6772516327 (dalej: Operator).
            </p>
            <p>
              Operator przetwarza dane wyłącznie na udokumentowane polecenie Administratora.
              Za polecenie uznaje się również korzystanie z funkcji Usługi zgodnie z jej
              przeznaczeniem.
            </p>

            <h2>§2. Przedmiot, charakter i cel przetwarzania</h2>
            <p>
              Operator przetwarza dane osobowe wyłącznie w celu świadczenia Usługi, to jest
              udostępnienia Administratorowi narzędzia do prowadzenia bazy klientów
              i nieruchomości, obsługi zadań i kalendarza, rozliczania transakcji, generowania
              dokumentów oraz, o ile Administrator z niej korzysta, publicznej strony
              internetowej biura.
            </p>
            <p>
              Operator <strong>nie wykorzystuje</strong> danych Administratora do własnych
              celów, w szczególności marketingowych, ani nie udostępnia ich innym klientom
              Usługi.
            </p>
            <p>
              Przetwarzanie trwa przez czas obowiązywania Umowy głównej oraz przez okres
              wskazany w §7.
            </p>

            <h2>§3. Rodzaj danych i kategorie osób</h2>
            <p>
              <strong>Kategorie osób:</strong> klienci Administratora (sprzedający, kupujący,
              wynajmujący, najemcy), osoby kontaktowe po stronie kontrahentów oraz
              pracownicy i współpracownicy Administratora będący Użytkownikami.
            </p>
            <p>
              <strong>Rodzaje danych:</strong> imię i nazwisko, numer telefonu, adres e-mail,
              adres nieruchomości, treść korespondencji i notatek z kontaktu, dane dotyczące
              transakcji, a także dokumenty wgrywane przez Administratora.
            </p>
            <p>
              Administrator nie powinien wprowadzać do Usługi danych szczególnych kategorii
              (art. 9 RODO) ani danych dotyczących wyroków skazujących. Usługa nie jest do
              tego przeznaczona.
            </p>

            <h2>§4. Obowiązki Operatora</h2>
            <p>Operator zobowiązuje się do:</p>
            <ul>
              <li>przetwarzania danych wyłącznie na polecenie Administratora,</li>
              <li>
                zapewnienia, by osoby upoważnione do przetwarzania danych zobowiązały się do
                zachowania poufności,
              </li>
              <li>
                zastosowania środków technicznych i organizacyjnych, o których mowa
                w art. 32 RODO, opisanych w §5,
              </li>
              <li>
                pomocy Administratorowi w realizacji żądań osób, których dane dotyczą, w tym
                w zakresie dostępu, sprostowania, usunięcia i przeniesienia danych,
              </li>
              <li>
                pomocy Administratorowi w wypełnieniu obowiązków z art. 32-36 RODO,
                w szczególności przy zgłaszaniu naruszeń i ocenie skutków dla ochrony danych,
              </li>
              <li>
                zgłoszenia Administratorowi każdego naruszenia ochrony danych{" "}
                <strong>bez zbędnej zwłoki, nie później niż w ciągu 24 godzin</strong> od jego
                stwierdzenia, wraz z informacjami umożliwiającymi Administratorowi wykonanie
                jego obowiązków wobec organu nadzorczego,
              </li>
              <li>
                udostępnienia Administratorowi informacji niezbędnych do wykazania spełnienia
                obowiązków z art. 28 RODO.
              </li>
            </ul>

            <h2>§5. Środki bezpieczeństwa</h2>
            <p>Operator stosuje w szczególności:</p>
            <ul>
              <li>szyfrowanie transmisji (TLS) oraz szyfrowanie danych w spoczynku,</li>
              <li>
                rozdzielenie danych poszczególnych biur, tak by Użytkownik jednego biura nie
                miał dostępu do danych innego,
              </li>
              <li>
                kontrolę dostępu opartą na rolach (CEO, menedżer, agent), egzekwowaną po
                stronie serwera,
              </li>
              <li>
                wygasające linki do pobierania dokumentów, zamiast adresów dostępnych
                bezterminowo,
              </li>
              <li>regularne kopie zapasowe wraz z weryfikacją możliwości odtworzenia,</li>
              <li>
                ograniczenie dostępu administracyjnego do danych produkcyjnych do osób,
                którym jest on niezbędny.
              </li>
            </ul>

            <h2>§6. Dalsze powierzenie (podprocesorzy)</h2>
            <p>
              Administrator wyraża ogólną zgodę na korzystanie przez Operatora z dalszych
              podmiotów przetwarzających, wymienionych poniżej. Operator zapewnia, by podmioty
              te były związane obowiązkami nie mniej surowymi niż wynikające z niniejszej
              Umowy, i odpowiada za ich działania jak za własne.
            </p>

            <div className="not-prose my-6 overflow-hidden rounded-xl border border-[var(--mk-hairline)]">
              <table className="w-full text-left text-[0.9375rem]">
                <thead>
                  <tr className="bg-[var(--mk-surface-2)] text-[var(--color-mk-text)]">
                    <th className="px-4 py-3 font-medium">Podmiot</th>
                    <th className="px-4 py-3 font-medium">Zakres</th>
                    <th className="px-4 py-3 font-medium">Lokalizacja</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--color-mk-muted)]">
                  {SUBPROCESSORS.map((s) => (
                    <tr key={s.name} className="border-t border-[var(--mk-hairline)]">
                      <td className="px-4 py-3 font-medium text-[var(--color-mk-text)]">{s.name}</td>
                      <td className="px-4 py-3">{s.role}</td>
                      <td className="px-4 py-3">{s.where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              Dane Konta biura są przechowywane na serwerach w Unii Europejskiej. W zakresie,
              w jakim korzystanie z funkcji opartych na sztucznej inteligencji oraz z wysyłki
              wiadomości e-mail wiąże się z przekazaniem danych poza Europejski Obszar
              Gospodarczy, przekazanie odbywa się na podstawie standardowych klauzul
              umownych zatwierdzonych przez Komisję Europejską.
            </p>
            <p>
              O zamiarze dodania lub zmiany podprocesora Operator informuje Administratora
              z co najmniej 30-dniowym wyprzedzeniem. Administrator może w tym terminie
              wnieść uzasadniony sprzeciw. Jeżeli Strony nie uzgodnią rozwiązania,
              Administrator może wypowiedzieć Umowę główną ze skutkiem na koniec bieżącego
              okresu rozliczeniowego.
            </p>

            <h2>§7. Zakończenie przetwarzania</h2>
            <p>
              Po rozwiązaniu Umowy głównej Administrator ma przez 30 dni możliwość
              samodzielnego wyeksportowania danych. Po upływie tego terminu Operator usuwa
              dane ze środowiska produkcyjnego, a z kopii zapasowych w cyklu ich
              nadpisywania, nie później niż w ciągu 90 dni, chyba że obowiązek dalszego
              przechowywania wynika z przepisów prawa.
            </p>
            <p>Na żądanie Administratora Operator potwierdza usunięcie danych.</p>

            <h2>§8. Kontrola i audyt</h2>
            <p>
              Administrator ma prawo do kontroli sposobu przetwarzania powierzonych danych.
              Kontrola odbywa się po uprzednim zawiadomieniu z co najmniej 14-dniowym
              wyprzedzeniem, w godzinach pracy Operatora, w sposób nienaruszający poufności
              danych innych klientów Usługi.
            </p>
            <p>
              Operator może wykazać spełnienie obowiązków, przedstawiając dokumentację
              stosowanych środków bezpieczeństwa oraz informacje o podprocesorach.
            </p>

            <h2>§9. Odpowiedzialność</h2>
            <p>
              Każda ze Stron odpowiada za szkody spowodowane przetwarzaniem naruszającym
              RODO na zasadach określonych w art. 82 RODO.
            </p>
            <p>
              Administrator odpowiada za posiadanie podstawy prawnej przetwarzania danych
              wprowadzanych do Usługi oraz za wykonanie obowiązku informacyjnego wobec osób,
              których dane dotyczą.
            </p>

            <h2>§10. Postanowienia końcowe</h2>
            <p>
              W sprawach nieuregulowanych stosuje się RODO oraz przepisy prawa polskiego.
              Zmiany niniejszej Umowy wymagają formy dokumentowej. Do zmian stosuje się tryb
              opisany w §12 Regulaminu.
            </p>
          </article>
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}
