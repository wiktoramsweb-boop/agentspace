import type { Metadata } from "next";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

export const metadata: Metadata = {
  title: "Regulamin | AgentSpace",
  description:
    "Regulamin świadczenia usług AgentSpace — zasady korzystania z platformy do szkolenia agentów nieruchomości.",
  alternates: {
    canonical: "https://agentspace.pl/regulamin",
  },
  robots: { index: true, follow: true },
};

export default function Regulamin() {
  return (
    <>
      <SiteNav />
      <main className="bg-zinc-950 text-white">
        <section className="border-b border-zinc-900 px-6 pt-32 pb-12">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              Prawne
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Regulamin</h1>
            <p className="mt-4 text-zinc-500">Ostatnia aktualizacja: 15 maja 2026</p>
          </div>
        </section>

        <section className="border-b border-zinc-900 px-6 py-16">
          <article className="prose-blog mx-auto max-w-3xl">
            <h2>§1. Postanowienia ogólne</h2>
            <p>
              Niniejszy regulamin (dalej: <em>Regulamin</em>) określa zasady korzystania
              z serwisu internetowego dostępnego pod adresem <strong>agentspace.pl</strong>
              (dalej: <em>Serwis</em> lub <em>AgentSpace</em>).
            </p>
            <p>
              Operatorem Serwisu jest <strong>Spectra Nieruchomości</strong> z siedzibą
              w Krakowie, ul. Zbożowa 2/1, 30-002 Kraków, NIP: 6772516327,
              REGON: 529666353 (dalej: <em>Operator</em>).
            </p>
            <p>
              Kontakt z Operatorem możliwy jest pod adresem e-mail:{" "}
              <a href="mailto:nieruchomoscispectra@gmail.com">nieruchomoscispectra@gmail.com</a>.
            </p>

            <h2>§2. Definicje</h2>
            <ul>
              <li>
                <strong>Użytkownik</strong> — osoba fizyczna lub prawna korzystająca z Serwisu.
              </li>
              <li>
                <strong>Klient</strong> — Użytkownik biznesowy (biuro nieruchomości lub
                pośrednik), który zawarł umowę z Operatorem na korzystanie z AgentSpace.
              </li>
              <li>
                <strong>Usługa</strong> — platforma SaaS AgentSpace umożliwiająca szkolenie
                agentów nieruchomości, dostęp do AI Coacha, dashboard dla agentów i panel dla
                właściciela biura.
              </li>
              <li>
                <strong>Konto</strong> — indywidualny dostęp Klienta do Usługi po rejestracji.
              </li>
              <li>
                <strong>Lista oczekujących</strong> — formularz na stronie głównej umożliwiający
                rejestrację zainteresowania wczesnym dostępem do AgentSpace.
              </li>
            </ul>

            <h2>§3. Status Serwisu (faza pre-launch)</h2>
            <p>
              Na dzień publikacji Regulaminu AgentSpace znajduje się w fazie pre-launch
              — Usługa nie jest jeszcze dostępna w pełnej formie. Serwis umożliwia obecnie:
            </p>
            <ul>
              <li>zapoznanie się z planowanymi funkcjami Usługi,</li>
              <li>rejestrację na liście oczekujących (waitlist),</li>
              <li>dostęp do treści informacyjnych (blog, artykuły).</li>
            </ul>
            <p>
              Pełny start Usługi planowany jest na pierwszy kwartał 2026 roku. Operator zastrzega
              sobie prawo do zmiany terminu startu, o czym poinformuje osoby zapisane na liście
              oczekujących.
            </p>

            <h2>§4. Rejestracja na liście oczekujących</h2>
            <p>
              Zapis na listę oczekujących jest bezpłatny i niezobowiązujący. Wymaga podania
              następujących danych:
            </p>
            <ul>
              <li>adresu e-mail (wymagane),</li>
              <li>nazwy biura nieruchomości (wymagane),</li>
              <li>liczby agentów w zespole (wymagane),</li>
              <li>numeru telefonu (opcjonalne — dla szybszego kontaktu).</li>
            </ul>
            <p>
              Zapis oznacza zgodę na przetwarzanie danych osobowych w celu informowania
              o starcie Usługi oraz na otrzymywanie informacji marketingowych dotyczących
              AgentSpace. Zgodę można w dowolnym momencie wycofać poprzez kontakt mailowy.
            </p>

            <h2>§5. Pierwsze 10 biur (warunki promocyjne)</h2>
            <p>
              Pierwsze 10 biur nieruchomości, które wezmą udział w programie pilotażowym
              AgentSpace, otrzyma:
            </p>
            <ul>
              <li>3 miesiące bezpłatnego dostępu od momentu startu Usługi,</li>
              <li>30% rabatu na pierwszy rok subskrypcji (przy zachowaniu ciągłości umowy).</li>
            </ul>
            <p>
              Operator zastrzega sobie prawo do wyboru biur uczestniczących w programie na
              podstawie informacji podanych w formularzu listy oczekujących oraz dodatkowej
              kwalifikacji telefonicznej lub mailowej.
            </p>

            <h2>§6. Wymagania techniczne</h2>
            <p>Do korzystania z Serwisu wymagane jest:</p>
            <ul>
              <li>
                aktualna przeglądarka internetowa (Chrome 100+, Safari 15+, Firefox 100+,
                Edge 100+),
              </li>
              <li>dostęp do Internetu o stabilnej prędkości min. 5 Mbps,</li>
              <li>
                w przypadku korzystania z AI Coacha — mikrofon i głośniki / słuchawki,
              </li>
              <li>włączona obsługa JavaScript i plików cookies.</li>
            </ul>

            <h2>§7. Zasady korzystania z Serwisu</h2>
            <p>Użytkownik zobowiązuje się do:</p>
            <ul>
              <li>korzystania z Serwisu zgodnie z obowiązującym prawem,</li>
              <li>niepodejmowania działań mogących zakłócić działanie Serwisu,</li>
              <li>podawania prawdziwych i aktualnych danych podczas rejestracji,</li>
              <li>poszanowania praw własności intelektualnej Operatora i osób trzecich,</li>
              <li>
                niewykorzystywania treści Serwisu w celach komercyjnych bez zgody Operatora.
              </li>
            </ul>

            <h2>§8. Odpowiedzialność</h2>
            <p>
              Operator dokłada wszelkich starań, aby Serwis funkcjonował poprawnie. Operator
              nie ponosi odpowiedzialności za:
            </p>
            <ul>
              <li>
                przerwy w działaniu Serwisu wynikające z konserwacji, awarii lub przyczyn
                niezależnych od Operatora,
              </li>
              <li>
                szkody powstałe w wyniku niezgodnego z Regulaminem korzystania z Serwisu,
              </li>
              <li>
                treści zewnętrzne, do których prowadzą linki w Serwisie.
              </li>
            </ul>

            <h2>§9. Reklamacje</h2>
            <p>
              Wszelkie reklamacje dotyczące działania Serwisu lub Usługi należy zgłaszać na adres
              e-mail{" "}
              <a href="mailto:nieruchomoscispectra@gmail.com">
                nieruchomoscispectra@gmail.com
              </a>{" "}
              w terminie 14 dni od dnia stwierdzenia nieprawidłowości.
            </p>
            <p>
              Reklamacja powinna zawierać: imię i nazwisko lub nazwę firmy, adres e-mail,
              opis problemu, datę i okoliczności wystąpienia.
            </p>
            <p>Operator rozpatruje reklamację w terminie 14 dni od jej otrzymania.</p>

            <h2>§10. Dane osobowe</h2>
            <p>
              Zasady przetwarzania danych osobowych zostały szczegółowo opisane w{" "}
              <a href="/polityka-prywatnosci">Polityce Prywatności</a>.
            </p>

            <h2>§11. Zmiany Regulaminu</h2>
            <p>
              Operator zastrzega sobie prawo do wprowadzania zmian w Regulaminie. O zmianach
              poinformuje Użytkowników mailowo lub poprzez ogłoszenie w Serwisie z co najmniej
              7-dniowym wyprzedzeniem.
            </p>

            <h2>§12. Postanowienia końcowe</h2>
            <p>
              W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego,
              w szczególności Kodeksu cywilnego oraz ustawy z dnia 18 lipca 2002 r. o świadczeniu
              usług drogą elektroniczną.
            </p>
            <p>
              Spory wynikające z korzystania z Serwisu rozstrzygane będą przez sąd właściwy dla
              siedziby Operatora.
            </p>
            <p>Regulamin wchodzi w życie z dniem publikacji w Serwisie.</p>
          </article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
