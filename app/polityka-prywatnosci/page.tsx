import type { Metadata } from "next";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";
import { PageHero } from "../components/page-hero";

export const metadata: Metadata = {
  title: "Polityka prywatności | AgentSpace",
  description:
    "Polityka prywatności AgentSpace — administrator danych, podstawy prawne przetwarzania, prawa użytkowników, ciasteczka, RODO.",
  alternates: {
    canonical: "https://agentspace.pl/polityka-prywatnosci",
  },
  robots: { index: true, follow: true },
};

export default function PolitykaPrywatnosci() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        <PageHero
          eyebrow="Prawne"
          title="Polityka prywatności"
          description={<span className="text-zinc-500">Ostatnia aktualizacja: 15 maja 2026</span>}
          compact
        />

        <section className="border-b border-zinc-900 px-6 py-16">
          <article className="prose-blog mx-auto max-w-3xl">
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
                <strong>Dane podane w formularzu listy oczekujących:</strong> adres e-mail, nazwa
                biura nieruchomości, wielkość zespołu, numer telefonu (opcjonalnie).
              </li>
              <li>
                <strong>Dane techniczne:</strong> adres IP, dane przeglądarki, system operacyjny,
                strona odsyłająca, czas wizyty (zbierane automatycznie w celach statystycznych).
              </li>
              <li>
                <strong>Dane z plików cookies</strong> opisane w sekcji 7.
              </li>
            </ul>

            <h2>3. Cele i podstawy prawne przetwarzania</h2>
            <p>Dane osobowe są przetwarzane w następujących celach:</p>
            <ul>
              <li>
                <strong>Lista oczekujących</strong> — kontakt w sprawie wczesnego dostępu do
                AgentSpace, podstawa prawna: art. 6 ust. 1 lit. a) RODO (zgoda osoby, której dane
                dotyczą).
              </li>
              <li>
                <strong>Marketing własny</strong> — informacje o starcie produktu, nowych
                funkcjach, ofertach specjalnych dla biur nieruchomości, podstawa prawna: art. 6
                ust. 1 lit. f) RODO (prawnie uzasadniony interes administratora).
              </li>
              <li>
                <strong>Cele analityczne</strong> — pomiar ruchu, optymalizacja strony, podstawa
                prawna: art. 6 ust. 1 lit. f) RODO.
              </li>
              <li>
                <strong>Wypełnienie obowiązków prawnych</strong> — np. rozliczenia podatkowe po
                zawarciu umowy, podstawa prawna: art. 6 ust. 1 lit. c) RODO.
              </li>
            </ul>

            <h2>4. Okres przechowywania danych</h2>
            <ul>
              <li>
                Dane z formularza listy oczekujących: do momentu wycofania zgody lub przez okres
                12 miesięcy od ostatniego kontaktu.
              </li>
              <li>
                Dane analityczne i techniczne: do 26 miesięcy od ostatniej wizyty.
              </li>
              <li>
                Dane związane z zawartą umową: przez okres jej trwania oraz przez okres wymagany
                przepisami prawa (zwykle 5 lat od końca roku rozliczeniowego).
              </li>
            </ul>

            <h2>5. Prawa użytkownika</h2>
            <p>Zgodnie z RODO przysługują Ci następujące prawa:</p>
            <ul>
              <li>prawo dostępu do swoich danych osobowych (art. 15 RODO),</li>
              <li>prawo do sprostowania danych (art. 16 RODO),</li>
              <li>prawo do usunięcia danych — &quot;prawo do bycia zapomnianym&quot; (art. 17 RODO),</li>
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

            <h2>6. Odbiorcy danych</h2>
            <p>Dane mogą być udostępnione następującym kategoriom odbiorców:</p>
            <ul>
              <li>
                Dostawcom usług IT (hosting: Vercel Inc.; baza danych: Supabase Inc.; analityka:
                opisana w punkcie 7),
              </li>
              <li>
                Dostawcom usług komunikacyjnych (e-mail transactional: Resend Inc.),
              </li>
              <li>
                Organom państwowym, jeżeli wymagają tego przepisy prawa.
              </li>
            </ul>
            <p>
              Część dostawców usług ma siedzibę poza Europejskim Obszarem Gospodarczym (głównie
              USA). W takich przypadkach administrator zapewnia odpowiednie zabezpieczenia
              transferu danych zgodnie z RODO (standardowe klauzule umowne lub decyzje
              o adekwatnym poziomie ochrony danych).
            </p>

            <h2>7. Pliki cookies (ciasteczka)</h2>
            <p>
              Serwis wykorzystuje pliki cookies oraz podobne technologie w celu zapewnienia
              prawidłowego działania, analizy ruchu i optymalizacji doświadczenia użytkownika.
            </p>
            <p>Stosujemy następujące kategorie cookies:</p>
            <ul>
              <li>
                <strong>Niezbędne</strong> — konieczne do działania strony (np. zapamiętanie
                wyboru języka, sesje), nie wymagają zgody.
              </li>
              <li>
                <strong>Analityczne</strong> — pomiar ruchu (np. Google Analytics, Vercel
                Analytics) — wymagają zgody.
              </li>
              <li>
                <strong>Marketingowe</strong> — śledzenie konwersji reklam (np. Google Ads
                Conversion Tag, Meta Pixel) — wymagają zgody.
              </li>
            </ul>
            <p>
              Można w każdej chwili zmienić ustawienia cookies w przeglądarce lub odwołać zgodę
              przez panel ustawień prywatności na stronie.
            </p>

            <h2>8. Bezpieczeństwo danych</h2>
            <p>
              Administrator stosuje środki techniczne i organizacyjne odpowiednie do ryzyka
              naruszenia praw lub wolności osób fizycznych: szyfrowanie połączeń (HTTPS),
              hashowanie haseł, kopie zapasowe, ograniczony dostęp do danych, regularne audyty
              bezpieczeństwa.
            </p>

            <h2>9. Postanowienia końcowe</h2>
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
      <SiteFooter />
    </>
  );
}
