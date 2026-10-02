import Link from "next/link";
import type { Metadata } from "next";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { getDict, toLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Polityka prywatności | AgentSpace",
  description:
    "Polityka prywatności AgentSpace - administrator danych, dane w aplikacji, AI, odbiorcy danych, prawa użytkowników, cookies, RODO.",
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
          description={<span className="text-[var(--color-mk-muted)]">Ostatnia aktualizacja: 1 października 2026</span>}
          compact
        />

        <section className="border-b border-[var(--mk-hairline)] px-6 py-16">
          <article className="prose-blog mx-auto max-w-3xl">
            {notice ? (
              <p className="rounded-xl border border-[var(--mk-hairline)] bg-[var(--mk-surface-2)] p-4 text-sm text-[var(--color-mk-muted)]">
                {notice}
              </p>
            ) : null}
            <h2>1. Administrator danych</h2>
            <p>
              Administratorem danych osobowych przetwarzanych w związku z korzystaniem z serwisu
              dostępnego pod adresem <strong>agentspace.pl</strong> (dalej: <em>Serwis</em>) jest:
            </p>
            <p>
              <strong>Spectra Nieruchomości</strong>
              <br />
              ul. Zbożowa 2/1
              <br />
              30-002 Kraków, Polska
              <br />
              NIP: 6772516327
              <br />
              REGON: 529666353
              <br />
              E-mail kontaktowy:{" "}
              <a href="mailto:nieruchomoscispectra@gmail.com">nieruchomoscispectra@gmail.com</a>
            </p>
            <p>
              W razie pytań dotyczących przetwarzania danych osobowych można skontaktować się
              z administratorem pod powyższym adresem e-mail.
            </p>

            <h2>2. Zakres przetwarzanych danych</h2>
            <p>Administrator przetwarza następujące kategorie danych osobowych:</p>
            <ul>
              <li>
                <strong>Formularz listy oczekujących:</strong> adres e-mail, nazwa biura
                nieruchomości, wielkość zespołu, numer telefonu (opcjonalnie).
              </li>
              <li>
                <strong>Formularz kontaktowy:</strong> imię i nazwisko, adres e-mail, nazwa biura,
                temat i treść wiadomości oraz informacja, skąd przyszła wizyta (strona odsyłająca,
                parametry kampanii).
              </li>
              <li>
                <strong>Konto w aplikacji AgentSpace:</strong> imię i nazwisko, adres e-mail,
                telefon, rola w biurze, opcjonalnie stanowisko, opis i zdjęcie, a także dane
                o korzystaniu z aplikacji (np. rozmowy treningowe z AI Coachem i ich oceny, cele
                i wyniki, zadania). Hasło przechowujemy wyłącznie w postaci zaszyfrowanego skrótu.
              </li>
              <li>
                <strong>Dane techniczne:</strong> adres IP, dane przeglądarki, system operacyjny,
                strona odsyłająca, czas wizyty. Na potrzeby ochrony przed nadużyciami (limity
                rejestracji, logowania i formularzy) zapisujemy jedynie skrót (hash) adresu IP,
                z którego nie da się odtworzyć samego adresu.
              </li>
              <li>
                <strong>Dane z plików cookies i pamięci przeglądarki</strong> opisane w sekcji 8.
              </li>
            </ul>

            <h2>3. Cele i podstawy prawne przetwarzania</h2>
            <p>Dane osobowe są przetwarzane w następujących celach:</p>
            <ul>
              <li>
                <strong>Lista oczekujących</strong> - kontakt w sprawie dostępu do AgentSpace,
                podstawa prawna: art. 6 ust. 1 lit. a) RODO (zgoda).
              </li>
              <li>
                <strong>Odpowiedź na wiadomość z formularza kontaktowego</strong> - podstawa
                prawna: art. 6 ust. 1 lit. f) RODO (prawnie uzasadniony interes administratora,
                jakim jest prowadzenie korespondencji).
              </li>
              <li>
                <strong>Świadczenie usługi AgentSpace</strong> (założenie i obsługa konta,
                funkcje aplikacji) - podstawa prawna: art. 6 ust. 1 lit. b) RODO (umowa).
              </li>
              <li>
                <strong>Marketing własny</strong> - informacje o nowych funkcjach i ofertach dla
                biur nieruchomości, podstawa prawna: art. 6 ust. 1 lit. f) RODO.
              </li>
              <li>
                <strong>Bezpieczeństwo i ochrona przed nadużyciami</strong> oraz{" "}
                <strong>cele analityczne</strong> - podstawa prawna: art. 6 ust. 1 lit. f) RODO.
              </li>
              <li>
                <strong>Wypełnienie obowiązków prawnych</strong> - np. rozliczenia podatkowe,
                podstawa prawna: art. 6 ust. 1 lit. c) RODO.
              </li>
            </ul>

            <h2>4. Dane klientów biur (AgentSpace jako podmiot przetwarzający)</h2>
            <p>
              Dane, które biuro nieruchomości wprowadza do aplikacji o swoich klientach (np.
              kontakty w CRM, oferty, dokumenty, zgłoszenia ze strony internetowej biura), są
              danymi, których <strong>administratorem jest biuro</strong>. AgentSpace przetwarza
              je wyłącznie w imieniu biura, na podstawie{" "}
              <Link href="/umowa-powierzenia">umowy powierzenia przetwarzania danych</Link>. W sprawach
              tych danych (np. ich usunięcia) właściwy jest kontakt z biurem, z którym dana osoba
              współpracuje. Dotyczy to także formularzy na stronach internetowych biur
              prowadzonych w AgentSpace.
            </p>

            <h2>5. Okres przechowywania danych</h2>
            <ul>
              <li>
                Dane z formularza listy oczekujących: do momentu wycofania zgody lub przez okres
                12 miesięcy od ostatniego kontaktu.
              </li>
              <li>Wiadomości z formularza kontaktowego: do 24 miesięcy od zakończenia korespondencji.</li>
              <li>
                Dane konta w aplikacji: przez czas korzystania z usługi; po jej zakończeniu
                usuwamy je lub anonimizujemy, z wyjątkiem danych, które musimy przechowywać na
                podstawie przepisów.
              </li>
              <li>Skróty adresów IP używane do limitów: do 3 dni.</li>
              <li>Dane analityczne i techniczne: do 26 miesięcy od ostatniej wizyty.</li>
              <li>
                Dane związane z zawartą umową: przez okres jej trwania oraz przez okres wymagany
                przepisami prawa (zwykle 5 lat od końca roku rozliczeniowego).
              </li>
            </ul>

            <h2>6. Prawa użytkownika</h2>
            <p>Zgodnie z RODO przysługują Ci następujące prawa:</p>
            <ul>
              <li>prawo dostępu do swoich danych osobowych (art. 15 RODO),</li>
              <li>prawo do sprostowania danych (art. 16 RODO),</li>
              <li>prawo do usunięcia danych - &quot;prawo do bycia zapomnianym&quot; (art. 17 RODO),</li>
              <li>prawo do ograniczenia przetwarzania (art. 18 RODO),</li>
              <li>prawo do przenoszenia danych (art. 20 RODO),</li>
              <li>prawo do sprzeciwu wobec przetwarzania (art. 21 RODO),</li>
              <li>prawo do cofnięcia zgody w dowolnym momencie (bez wpływu na zgodność z prawem przetwarzania dokonanego przed cofnięciem),</li>
              <li>
                prawo do wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych
                (uodo.gov.pl).
              </li>
            </ul>
            <p>
              W celu realizacji któregokolwiek z powyższych praw prosimy o kontakt mailowy pod
              adresem podanym w punkcie 1.
            </p>

            <h2>7. Odbiorcy danych</h2>
            <p>Dane mogą być udostępnione następującym kategoriom odbiorców:</p>
            <ul>
              <li>Hosting i baza danych: Vercel Inc. (USA), Supabase Inc. (serwery we Frankfurcie).</li>
              <li>Wysyłka wiadomości e-mail: Resend Inc. (USA).</li>
              <li>
                Funkcje sztucznej inteligencji (AI Coach, generowanie opisów i wiadomości,
                przetwarzanie dyktowanych notatek): Anthropic PBC (USA). Do modelu trafia wyłącznie
                tekst, który użytkownik wpisze lub podyktuje w danej funkcji.
              </li>
              <li>
                Rozpoznawanie mowy przy dyktowaniu: wbudowana funkcja przeglądarki; w zależności
                od przeglądarki nagranie może być przetwarzane przez jej producenta (np. Google
                w przeglądarce Chrome).
              </li>
              <li>
                Mapy i wyszukiwanie adresów: OpenStreetMap Foundation (podpowiadanie adresów,
                informacje o okolicy) oraz CARTO (podkłady map). Do tych usług trafia wpisany
                adres lub współrzędne, a przy wyświetlaniu mapy także adres IP przeglądarki.
              </li>
              <li>
                Powiadomienia push: usługi powiadomień producenta przeglądarki lub systemu
                (np. Google, Apple, Mozilla), jeśli użytkownik je włączy.
              </li>
              <li>Organom państwowym, jeżeli wymagają tego przepisy prawa.</li>
            </ul>
            <p>
              Część dostawców ma siedzibę poza Europejskim Obszarem Gospodarczym (głównie USA).
              W takich przypadkach transfer danych odbywa się na podstawie decyzji Komisji
              Europejskiej stwierdzającej odpowiedni stopień ochrony (EU-US Data Privacy
              Framework) lub standardowych klauzul umownych.
            </p>

            <h2>8. Pliki cookies i pamięć przeglądarki</h2>
            <p>
              Strona agentspace.pl i aplikacja nie używają reklamowych plików cookies ani
              narzędzi śledzących reklamodawców.
            </p>
            <ul>
              <li>
                <strong>Niezbędne</strong> - cookies sesji logowania w aplikacji. Bez nich nie da
                się zalogować, nie wymagają zgody.
              </li>
              <li>
                <strong>Pamięć przeglądarki</strong> - zapamiętanie wyboru motywu (jasny/ciemny)
                i podobnych ustawień wyglądu. Te dane nie opuszczają urządzenia.
              </li>
              <li>
                <strong>Statystyki</strong> - Vercel Web Analytics i Speed Insights, które mierzą
                ruch i szybkość strony bez plików cookies i bez identyfikowania osób.
              </li>
            </ul>
            <p>
              Strony internetowe biur prowadzone w AgentSpace liczą odsłony bez cookies i bez
              zapisywania adresów IP. Ustawienia cookies można w każdej chwili zmienić
              w przeglądarce.
            </p>

            <h2>9. Bezpieczeństwo danych</h2>
            <p>
              Administrator stosuje środki techniczne i organizacyjne odpowiednie do ryzyka
              naruszenia praw lub wolności osób fizycznych: szyfrowanie połączeń (HTTPS),
              hashowanie haseł, kopie zapasowe, ograniczony dostęp do danych, kontrolę uprawnień
              w aplikacji, limity chroniące przed nadużyciami oraz regularne przeglądy
              bezpieczeństwa.
            </p>

            <h2>10. Postanowienia końcowe</h2>
            <p>
              Niniejsza polityka prywatności może być aktualizowana w związku ze zmianami w
              prawie lub funkcjonalności Serwisu. O wszelkich istotnych zmianach poinformujemy
              użytkowników drogą e-mailową lub poprzez ogłoszenie na stronie.
            </p>
            <p>
              W sprawach nieuregulowanych niniejszą polityką zastosowanie mają przepisy RODO,
              Ustawy o ochronie danych osobowych z dnia 10 maja 2018 roku oraz inne właściwe
              przepisy prawa polskiego.
            </p>
          </article>
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}
