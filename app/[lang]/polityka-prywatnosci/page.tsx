import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { getDict, toLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Polityka prywatności | AgentSpace",
  description:
    "Polityka prywatności AgentSpace: administrator i podmiot przetwarzający, zakres danych, podstawy prawne, płatności Przelewy24, funkcje AI, lista podprocesorów, przekazywanie poza EOG, prawa osób, cookies i bezpieczeństwo.",
  alternates: {
    canonical: "https://agentspace.pl/polityka-prywatnosci",
  },
  robots: { index: true, follow: true },
};

export default async function PolitykaPrywatnosci({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const notice = getDict(locale).pages.legal.notice;

  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PageHero
          eyebrow="Prawne"
          title="Polityka prywatności"
          description={<span className="text-[var(--color-mk-muted)]">Ostatnia aktualizacja: 2 października 2026</span>}
          compact
        />

        <section className="border-b border-[var(--mk-hairline)] px-6 py-16">
          <article className="prose-blog mx-auto max-w-3xl">
            {notice ? (
              <p className="rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-surface-2)] p-4 text-sm text-[var(--color-mk-muted)]">
                {notice}
              </p>
            ) : null}
            <h2>1. Kto jest administratorem Waszych danych</h2>
            <p>
              Administratorem danych osobowych przetwarzanych w związku z korzystaniem z serwisu
              pod adresem <strong>agentspace.pl</strong> oraz z aplikacji AgentSpace (dalej razem:{" "}
              <em>Usługa</em>) jest <strong>Spectra Nieruchomości</strong>, ul. Zbożowa 2/1,
              30-002 Kraków, NIP 6772516327, REGON 529666353 (dalej: <em>Operator</em>,{" "}
              <em>my</em>).
            </p>
            <p>
              We wszystkich sprawach dotyczących danych osobowych piszcie na{" "}
              <a href="mailto:nieruchomoscispectra@gmail.com">nieruchomoscispectra@gmail.com</a>.
              Nie wyznaczyliśmy inspektora ochrony danych, bo nie jesteśmy do tego zobowiązani.
            </p>

            <h2>2. Dwie role, w których występujemy</h2>
            <p>
              To najważniejsza rzecz w całym dokumencie, bo od niej zależy, kto za co odpowiada.
            </p>
            <ul>
              <li>
                <strong>Jesteśmy administratorem</strong> danych osób, które kontaktują się z nami
                w sprawie AgentSpace: odwiedzających stronę, osób wypełniających formularz,
                zapisanych na listę oczekujących oraz osób reprezentujących biura, które zostały
                naszymi klientami. Te dane opisuje niniejsza polityka.
              </li>
              <li>
                <strong>Jesteśmy podmiotem przetwarzającym</strong> dane, które biuro nieruchomości
                wprowadza do aplikacji: swoich klientów, właścicieli nieruchomości, najemców
                i kandydatów. Administratorem tych danych jest biuro, a my przetwarzamy je wyłącznie
                na jego polecenie, na zasadach opisanych w{" "}
                <Link href="/umowa-powierzenia">umowie powierzenia przetwarzania danych</Link>.
                Osoba, której dane wprowadziło biuro, swoje prawa realizuje wobec tego biura, a nie
                wobec nas.
              </li>
            </ul>

            <h2>3. Jakie dane przetwarzamy i skąd je mamy</h2>
            <h3>3.1. Dane podane przez Was</h3>
            <ul>
              <li>
                <strong>Formularz kontaktowy i lista oczekujących:</strong> imię i nazwisko, adres
                e-mail, numer telefonu, nazwa biura, liczba agentów, treść wiadomości.
              </li>
              <li>
                <strong>Założenie konta:</strong> imię i nazwisko, adres e-mail, numer telefonu,
                nazwa biura, hasło (przechowywane wyłącznie w postaci skrótu kryptograficznego,
                nigdy jawnie).
              </li>
              <li>
                <strong>Dane rozliczeniowe:</strong> nazwa firmy, adres, NIP, dane do faktury oraz
                historia zamówień abonamentu.
              </li>
              <li>
                <strong>Treści, które tworzycie w aplikacji:</strong> notatki, dokumenty, zdjęcia
                ofert, wiadomości. W zakresie, w jakim dotyczą osób trzecich, administratorem jest
                Wasze biuro (punkt 2).
              </li>
            </ul>

            <h3>3.2. Dane zbierane automatycznie</h3>
            <ul>
              <li>
                Adres IP, typ przeglądarki i urządzenia, system operacyjny, strona, z której
                nastąpiło wejście, oraz czas wizyty. Służą bezpieczeństwu i statystyce.
              </li>
              <li>
                Źródło wejścia na stronę (adres odsyłający i parametry kampanii, tzw. UTM), zapisane
                w pamięci sesji przeglądarki, żeby wiedzieć, skąd przyszło zapytanie.
              </li>
              <li>
                Dzienniki zdarzeń aplikacji: daty logowania, adresy IP w postaci skróconej
                (hashowanej) przy ograniczaniu liczby zapytań, błędy techniczne.
              </li>
            </ul>

            <h2>4. Po co przetwarzamy dane, na jakiej podstawie i jak długo</h2>
            <h3>4.1. Odpowiedź na zapytanie i przygotowanie oferty</h3>
            <p>
              Podstawa: art. 6 ust. 1 lit. b RODO (działania przed zawarciem umowy) oraz art. 6
              ust. 1 lit. f RODO (nasz prawnie uzasadniony interes w prowadzeniu korespondencji).
              Dane trzymamy przez czas prowadzenia rozmowy, a jeśli nie dojdzie do współpracy,
              maksymalnie <strong>3 lata</strong> na potrzeby analiz sprzedażowych i obrony przed
              roszczeniami.
            </p>

            <h3>4.2. Prowadzenie konta i świadczenie Usługi</h3>
            <p>
              Podstawa: art. 6 ust. 1 lit. b RODO (wykonanie umowy). Przez czas trwania umowy oraz
              przez okres przedawnienia roszczeń po jej zakończeniu.
            </p>

            <h3>4.3. Rozliczenia, płatności i księgowość</h3>
            <p>
              Podstawa: art. 6 ust. 1 lit. c RODO (obowiązek prawny wynikający z przepisów
              podatkowych i o rachunkowości). Dokumenty księgowe przechowujemy przez{" "}
              <strong>5 lat</strong> licząc od końca roku, w którym upłynął termin płatności
              podatku.
            </p>

            <h3>4.4. Bezpieczeństwo Usługi</h3>
            <p>
              Podstawa: art. 6 ust. 1 lit. f RODO. Obejmuje wykrywanie nadużyć, ograniczanie liczby
              zapytań, przeciwdziałanie spamowi i nieautoryzowanemu dostępowi. Dzienniki zdarzeń
              przechowujemy do <strong>12 miesięcy</strong>.
            </p>

            <h3>4.5. Marketing własny</h3>
            <p>
              Podstawa: art. 6 ust. 1 lit. f RODO, a dla wiadomości elektronicznych dodatkowo Wasza
              zgoda zgodnie z Prawem komunikacji elektronicznej. Do czasu wycofania zgody albo
              wniesienia sprzeciwu. Zgodę można wycofać w każdej chwili, jednym mailem, bez podania
              przyczyny.
            </p>

            <h3>4.6. Ustalenie, dochodzenie i obrona roszczeń</h3>
            <p>
              Podstawa: art. 6 ust. 1 lit. f RODO. Przez okres przedawnienia roszczeń, zwykle{" "}
              <strong>3 lata</strong> w obrocie między przedsiębiorcami.
            </p>

            <h2>5. Płatności</h2>
            <p>
              Płatności za abonament obsługuje zewnętrzny operator płatności{" "}
              <strong>PayPro S.A. (Przelewy24)</strong>, ul. Pastelowa 8, 60-198 Poznań, wpisany do
              rejestru krajowych instytucji płatniczych prowadzonego przez Komisję Nadzoru
              Finansowego.
            </p>
            <ul>
              <li>
                Przekazujemy operatorowi płatności wyłącznie dane niezbędne do rozliczenia
                transakcji: identyfikator zamówienia, kwotę, adres e-mail oraz dane firmy
                potrzebne do faktury.
              </li>
              <li>
                <strong>Nie mamy dostępu do numeru Waszej karty ani do danych logowania do
                bankowości.</strong> Te dane podajecie bezpośrednio operatorowi płatności i my ich
                nigdy nie widzimy ani nie przechowujemy.
              </li>
              <li>
                W zakresie obsługi płatności PayPro S.A. jest odrębnym administratorem danych
                i przetwarza je na podstawie własnej polityki prywatności oraz obowiązków
                wynikających z prawa bankowego i przepisów o przeciwdziałaniu praniu pieniędzy.
              </li>
              <li>
                Historię zamówień i płatności przechowujemy w aplikacji na potrzeby rozliczeń
                i obowiązków podatkowych, przez okres wskazany w punkcie 4.3.
              </li>
            </ul>

            <h2>6. Funkcje oparte o sztuczną inteligencję</h2>
            <p>
              Część funkcji Usługi (AI Coach, asystent dnia, pisanie follow-upów, odczyt dokumentów,
              szybki wpis) korzysta z modeli językowych dostarczanych przez{" "}
              <strong>Anthropic PBC</strong> z siedzibą w Stanach Zjednoczonych.
            </p>
            <ul>
              <li>
                Do dostawcy modelu trafia wyłącznie treść potrzebna do wykonania danej operacji:
                na przykład transkrypt ćwiczebnej rozmowy albo tekst, który ma zostać przetworzony.
              </li>
              <li>
                <strong>AI Coach to symulacja.</strong> Agent rozmawia z klientem granym przez
                model, a nie z prawdziwą osobą, i do treningu nie są używane dane prawdziwych
                klientów biura.
              </li>
              <li>
                Przekazanie danych do USA odbywa się na podstawie standardowych klauzul umownych
                przyjętych przez Komisję Europejską (art. 46 ust. 2 lit. c RODO), stanowiących
                odpowiednie zabezpieczenie.
              </li>
              <li>
                Zgodnie z warunkami, na jakich korzystamy z API, przekazane treści nie są używane
                do trenowania modeli dostawcy.
              </li>
              <li>
                Wyniki działania AI mają charakter pomocniczy. Decyzje podejmuje człowiek, a my nie
                gwarantujemy poprawności ani kompletności wygenerowanych treści.
              </li>
            </ul>

            <h2>7. Komu przekazujemy dane</h2>
            <p>
              Korzystamy z dostawców, którzy przetwarzają dane w naszym imieniu na podstawie umów
              powierzenia. Poniżej pełna lista wraz z miejscem przetwarzania:
            </p>
            <ul>
              <li>
                <strong>Vercel Inc.</strong> (USA, serwery w UE) - hosting aplikacji i strony.
              </li>
              <li>
                <strong>Supabase Inc.</strong> (USA, serwery we Frankfurcie, Niemcy) - baza danych,
                uwierzytelnianie i magazyn plików.
              </li>
              <li>
                <strong>Anthropic PBC</strong> (USA) - modele językowe, zakres opisany w punkcie 6.
              </li>
              <li>
                <strong>Resend Inc.</strong> (USA) - wysyłka wiadomości e-mail: powiadomień,
                raportów i zaproszeń do zespołu.
              </li>
              <li>
                <strong>PayPro S.A.</strong> (Polska) - obsługa płatności, zakres opisany
                w punkcie 5.
              </li>
              <li>
                <strong>OpenStreetMap Foundation</strong> (Wielka Brytania) i{" "}
                <strong>CARTO</strong> - podkłady map i wyszukiwanie adresów. Do tych usług trafia
                wyłącznie wpisywany adres, nigdy dane osobowe klientów biura.
              </li>
              <li>
                Dostawcy usług księgowych i prawnych oraz, w razie potrzeby, firma windykacyjna,
                w zakresie niezbędnym do rozliczeń i dochodzenia roszczeń.
              </li>
              <li>
                Organy publiczne, jeżeli zwrócą się do nas z żądaniem opartym na przepisach prawa.
              </li>
            </ul>
            <p>
              Dane osobowe <strong>nie są sprzedawane</strong> ani udostępniane podmiotom trzecim
              w celach ich własnego marketingu.
            </p>

            <h2>8. Przekazywanie danych poza Europejski Obszar Gospodarczy</h2>
            <p>
              Dane aplikacji przechowujemy na serwerach w Unii Europejskiej (Frankfurt). Przekazanie
              poza EOG następuje wyłącznie do dostawców wskazanych w punktach 6 i 7 mających siedzibę
              w USA i odbywa się na podstawie standardowych klauzul umownych przyjętych przez Komisję
              Europejską, a w przypadku dostawców objętych Data Privacy Framework także na podstawie
              decyzji Komisji o odpowiednim stopniu ochrony. Kopię stosowanych zabezpieczeń
              udostępniamy na żądanie.
            </p>

            <h2>9. Wasze prawa</h2>
            <p>Przysługuje Wam prawo do:</p>
            <ul>
              <li>dostępu do danych i otrzymania ich kopii,</li>
              <li>sprostowania danych nieprawidłowych i uzupełnienia niekompletnych,</li>
              <li>usunięcia danych, o ile nie stoi temu na przeszkodzie obowiązek prawny,</li>
              <li>ograniczenia przetwarzania,</li>
              <li>
                przenoszenia danych przetwarzanych automatycznie na podstawie umowy lub zgody,
              </li>
              <li>
                <strong>sprzeciwu</strong> wobec przetwarzania opartego na naszym prawnie
                uzasadnionym interesie, a wobec marketingu bezpośredniego - w każdej chwili i bez
                uzasadnienia,
              </li>
              <li>
                cofnięcia zgody w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania
                sprzed cofnięcia,
              </li>
              <li>
                wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2,
                00-193 Warszawa.
              </li>
            </ul>
            <p>
              Żądanie wystarczy wysłać mailem. Odpowiadamy bez zbędnej zwłoki, najpóźniej
              w terminie miesiąca. Jeżeli nie mamy pewności, kto składa żądanie, możemy poprosić
              o dodatkowe informacje potwierdzające tożsamość, wyłącznie w tym celu.
            </p>

            <h2>10. Czy podanie danych jest obowiązkowe</h2>
            <p>
              Podanie danych jest dobrowolne, ale bez nich nie zawrzemy umowy ani nie odpowiemy na
              zapytanie. Dane do faktury są wymagane przepisami podatkowymi.
            </p>

            <h2>11. Pliki cookie i pamięć przeglądarki</h2>
            <p>
              Na stronie używamy plików cookie oraz pamięci lokalnej przeglądarki w trzech celach:
            </p>
            <ul>
              <li>
                <strong>Niezbędne:</strong> utrzymanie sesji po zalogowaniu i bezpieczeństwo.
                Działają bez zgody, bo bez nich Usługa nie zadziała.
              </li>
              <li>
                <strong>Funkcjonalne:</strong> zapamiętanie wybranego motywu (jasny lub ciemny)
                i języka. Zapisywane lokalnie, nie trafiają na nasze serwery.
              </li>
              <li>
                <strong>Analityczne:</strong> Vercel Web Analytics, narzędzie zliczające odsłony
                bez używania plików cookie i bez profilowania pojedynczych osób.
              </li>
            </ul>
            <p>
              Ustawienia plików cookie zmienicie w przeglądarce. Wyłączenie plików niezbędnych
              uniemożliwi zalogowanie się do aplikacji.
            </p>

            <h2>12. Powiadomienia push</h2>
            <p>
              Jeśli włączycie powiadomienia, przeglądarka przekaże nam identyfikator subskrypcji
              powiązany z urządzeniem. Służy wyłącznie do wysyłania przypomnień o zadaniach
              i zgłoszeniach. Wyłączenie powiadomień w ustawieniach aplikacji albo przeglądarki
              kończy ich wysyłanie i usuwa subskrypcję.
            </p>

            <h2>13. Zautomatyzowane decyzje i profilowanie</h2>
            <p>
              <strong>Nie podejmujemy wobec Was decyzji wyłącznie w sposób zautomatyzowany</strong>,
              które wywoływałyby skutki prawne lub w podobny sposób istotnie na Was wpływały
              w rozumieniu art. 22 RODO. Funkcje AI opisane w punkcie 6 przygotowują podpowiedzi
              i oceny ćwiczebne, ale decyzję podejmuje zawsze człowiek.
            </p>

            <h2>14. Jak chronimy dane</h2>
            <ul>
              <li>Szyfrowana transmisja (HTTPS) na całej stronie i w aplikacji.</li>
              <li>Hasła przechowywane wyłącznie jako skróty kryptograficzne.</li>
              <li>
                Rozdzielenie danych między biurami na poziomie bazy, z dodatkowym zabezpieczeniem
                po stronie serwera i kontrolą uprawnień per osoba i per moduł.
              </li>
              <li>Dokumenty w prywatnym magazynie, z linkami do pobrania ważnymi dwie minuty.</li>
              <li>Nagłówki bezpieczeństwa i ograniczanie liczby zapytań.</li>
              <li>Regularne kopie zapasowe bazy danych.</li>
            </ul>
            <p>
              W razie naruszenia ochrony danych osobowych zawiadamiamy Prezesa UODO w ciągu 72
              godzin od jego stwierdzenia, a osoby, których dane dotyczą, gdy naruszenie może
              powodować wysokie ryzyko naruszenia ich praw.
            </p>

            <h2>15. Dane osób niepełnoletnich</h2>
            <p>
              Usługa jest kierowana wyłącznie do przedsiębiorców i nie jest przeznaczona dla osób
              poniżej 16 roku życia. Nie zbieramy świadomie danych takich osób.
            </p>

            <h2>16. Zmiany polityki</h2>
            <p>
              Politykę możemy zmieniać w związku ze zmianą przepisów, zakresu Usługi albo listy
              dostawców. O istotnych zmianach uprzedzimy mailem albo komunikatem w aplikacji
              z wyprzedzeniem co najmniej 14 dni. Data ostatniej aktualizacji jest podana na górze
              strony.
            </p>
            <p>
              W sprawach nieuregulowanych stosuje się RODO, ustawę o ochronie danych osobowych
              z 10 maja 2018 roku oraz Prawo komunikacji elektronicznej.
            </p>
          </article>
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}
