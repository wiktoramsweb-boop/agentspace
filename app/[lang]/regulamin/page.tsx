import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/app/components/site-nav";
import { SiteFooter } from "@/app/components/site-footer";
import { PageHero } from "@/app/components/page-hero";
import { getDict, localeHref, toLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/i18n/metadata";

/**
 * Regulamin świadczenia usługi SaaS.
 *
 * PROJEKT DO WERYFIKACJI PRAWNEJ. Dokument opisuje faktyczny stan usługi
 * (działa, jest płatna, ma abonament), w miejsce poprzedniej wersji mówiącej
 * o fazie przedpremierowej i liście oczekujących.
 *
 * Cen tu nie wpisujemy, tylko odsyłamy do cennika - inaczej każda zmiana
 * ceny wymagałaby zmiany regulaminu i powiadamiania klientów.
 */

const UPDATED = "29 września 2026";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  return pageMetadata(
    locale,
    "/regulamin",
    "Regulamin | AgentSpace",
    "Regulamin świadczenia usługi AgentSpace: zakres usługi, abonament, dostępność, odpowiedzialność, rozwiązanie umowy i dane osobowe.",
  );
}

export default async function Regulamin({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const notice = getDict(locale).pages.legal.notice;

  return (
    <>
      <SiteNav lang={locale} />
      <main className="mk relative min-h-screen">
        <PageHero
          eyebrow="Prawne"
          title="Regulamin świadczenia usługi"
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

            <h2>§1. Postanowienia ogólne</h2>
            <p>
              Niniejszy Regulamin określa zasady świadczenia usługi AgentSpace drogą
              elektroniczną, w modelu oprogramowania jako usługi (SaaS).
            </p>
            <p>
              <strong>Operatorem</strong> usługi jest Spectra Nieruchomości, ul. Zbożowa 2/1,
              30-002 Kraków, NIP 6772516327, REGON 529666353, adres kontaktowy:
              nieruchomoscispectra@gmail.com.
            </p>
            <p>
              Usługa jest kierowana wyłącznie do przedsiębiorców, w szczególności biur
              nieruchomości. Regulamin nie znajduje zastosowania do konsumentów.
            </p>

            <h2>§2. Definicje</h2>
            <ul>
              <li>
                <strong>Usługa</strong> - dostęp do platformy AgentSpace, obejmującej moduły
                wskazane w wybranym pakiecie, wraz ze wsparciem technicznym.
              </li>
              <li>
                <strong>Klient</strong> - przedsiębiorca, który zawarł Umowę z Operatorem.
              </li>
              <li>
                <strong>Konto biura</strong> - wyodrębniona przestrzeń Klienta w Usłudze, wraz
                z kontami Użytkowników.
              </li>
              <li>
                <strong>Użytkownik</strong> - osoba upoważniona przez Klienta do korzystania
                z Konta biura, w roli: CEO, menedżer albo agent.
              </li>
              <li>
                <strong>Okres rozliczeniowy</strong> - miesiąc albo rok, zgodnie z wyborem
                Klienta przy zawarciu Umowy.
              </li>
              <li>
                <strong>Dane Klienta</strong> - dane wprowadzone do Usługi przez Klienta lub
                Użytkowników, w tym dane jego klientów i nieruchomości.
              </li>
            </ul>

            <h2>§3. Zakres i charakter Usługi</h2>
            <p>
              Usługa obejmuje w szczególności: bazę klientów (CRM), wspólną bazę
              nieruchomości, cele i lejek sprzedaży, rozliczanie prowizji i kartę transakcji,
              zadania i kalendarz, dokumenty, panel właściciela oraz moduł treningu rozmów
              z wykorzystaniem sztucznej inteligencji (AI Coach). Zakres modułów dostępnych
              dla Klienta wynika z wybranego pakietu.
            </p>
            <p>
              Strona internetowa biura stanowi <strong>usługę dodatkową</strong>, rozliczaną
              odrębnie. Jej włączenie nie jest warunkiem korzystania z Usługi podstawowej.
            </p>
            <p>
              Usługa ma charakter narzędziowy. Operator nie świadczy usług pośrednictwa
              w obrocie nieruchomościami, nie doradza w zakresie prawnym, podatkowym ani
              finansowym, a treści generowane przez moduły sztucznej inteligencji
              (w szczególności propozycje wiadomości, opisy ofert, oceny rozmów i analizy)
              mają charakter pomocniczy i wymagają weryfikacji przez Użytkownika przed
              wykorzystaniem. Operator nie odpowiada za decyzje biznesowe podjęte na ich
              podstawie.
            </p>

            <h2>§4. Zawarcie Umowy i konta Użytkowników</h2>
            <p>
              Umowa zostaje zawarta z chwilą założenia Konta biura i akceptacji Regulaminu
              albo z chwilą podpisania odrębnej umowy, jeżeli Strony ją zawierają.
            </p>
            <p>
              Klient zakłada konta Użytkowników i nimi zarządza. Klient odpowiada za działania
              i zaniechania swoich Użytkowników jak za własne, w tym za zachowanie poufności
              danych logowania. Liczba Użytkowników nie może przekraczać limitu wynikającego
              z wybranego pakietu.
            </p>

            <h2>§5. Abonament i płatności</h2>
            <p>
              Wysokość opłat określa cennik dostępny pod adresem{" "}
              <Link href={localeHref(locale, "/cennik")}>agentspace.pl/cennik</Link>. Ceny są
              cenami netto, do których dolicza się podatek VAT według obowiązującej stawki,
              o ile jest należny.
            </p>
            <p>
              Opłata jest naliczana z góry za Okres rozliczeniowy. Faktura jest wystawiana
              w postaci elektronicznej, na co Klient wyraża zgodę.
            </p>
            <ul>
              <li>
                <strong>Rozliczenie roczne:</strong> dwa miesiące abonamentu gratis
                w porównaniu z rozliczeniem miesięcznym, a cena pozostaje niezmienna przez
                24 miesiące od zawarcia Umowy, przy zachowaniu ciągłości subskrypcji.
              </li>
              <li>
                <strong>Zmiana pakietu:</strong> podwyższenie pakietu następuje od kolejnego
                Okresu rozliczeniowego. Jeżeli liczba Użytkowników trwale przekroczy limit
                pakietu, Operator poinformuje o tym Klienta przed zmianą i zaproponuje wyższy
                pakiet. Operator nie nalicza dopłat za Użytkownika w trakcie Okresu
                rozliczeniowego.
              </li>
              <li>
                <strong>Opóźnienie w płatności:</strong> po upływie 14 dni od terminu Operator
                może zawiesić dostęp do Usługi, po uprzednim wezwaniu wysłanym na adres e-mail
                Klienta. Zawieszenie nie powoduje usunięcia Danych Klienta.
              </li>
            </ul>
            <p>
              Operator może zmienić wysokość opłat, informując Klienta z co najmniej
              30-dniowym wyprzedzeniem. Zmiana obowiązuje od kolejnego Okresu rozliczeniowego.
              Klient, który nie akceptuje zmiany, może wypowiedzieć Umowę ze skutkiem na koniec
              bieżącego Okresu rozliczeniowego.
            </p>

            <h2>§6. Obowiązki Klienta</h2>
            <p>Klient zobowiązuje się do:</p>
            <ul>
              <li>
                korzystania z Usługi zgodnie z prawem, w szczególności do przetwarzania danych
                osobowych swoich klientów na podstawie odpowiedniej podstawy prawnej
                i z zachowaniem obowiązku informacyjnego wobec tych osób,
              </li>
              <li>
                niewprowadzania do Usługi danych, do których nie posiada tytułu prawnego,
                oraz treści bezprawnych,
              </li>
              <li>
                niepodejmowania prób obchodzenia zabezpieczeń, testowania odporności
                infrastruktury bez zgody Operatora ani automatycznego pobierania danych
                w sposób obciążający Usługę ponad zwykłe korzystanie,
              </li>
              <li>nieudostępniania kont osobom spoza swojej organizacji.</li>
            </ul>

            <h2>§7. Dostępność Usługi i wsparcie</h2>
            <p>
              Operator dokłada starań, aby Usługa była dostępna nieprzerwanie, i zakłada
              dostępność na poziomie <strong>99% w skali miesiąca kalendarzowego</strong>,
              z wyłączeniem zaplanowanych prac serwisowych oraz przerw wynikających
              z okoliczności niezależnych od Operatora, w tym awarii u dostawców
              infrastruktury.
            </p>
            <p>
              O planowanych pracach serwisowych mogących powodować przerwę Operator informuje
              z co najmniej 24-godzinnym wyprzedzeniem, w miarę możliwości poza godzinami
              pracy biur.
            </p>
            <p>
              Wsparcie techniczne jest świadczone drogą elektroniczną w dni robocze.
              Operator odpowiada na zgłoszenia w terminie do 24 godzin w dni robocze.
            </p>

            <h2>§8. Odpowiedzialność</h2>
            <p>
              Operator odpowiada za niewykonanie lub nienależyte wykonanie Umowy na zasadach
              ogólnych, z zastrzeżeniem poniższych ograniczeń.
            </p>
            <p>
              Odpowiedzialność Operatora wobec Klienta jest ograniczona do wysokości opłat
              uiszczonych przez Klienta w okresie 12 miesięcy poprzedzających zdarzenie
              będące podstawą roszczenia. Operator nie odpowiada za utracone korzyści.
            </p>
            <p>
              Powyższe ograniczenia nie mają zastosowania do szkody wyrządzonej umyślnie
              ani w innych przypadkach, w których wyłączenie lub ograniczenie
              odpowiedzialności jest niedopuszczalne w świetle bezwzględnie obowiązujących
              przepisów prawa.
            </p>
            <p>
              Operator wykonuje kopie zapasowe Danych Klienta. Klient przyjmuje do wiadomości,
              że kopie zapasowe nie zastępują jego własnych procedur archiwizacji i że
              w każdej chwili może wyeksportować swoje dane.
            </p>

            <h2>§9. Dane osobowe</h2>
            <p>
              W zakresie danych wprowadzanych do Usługi przez Klienta administratorem danych
              osobowych pozostaje Klient, a Operator działa jako podmiot przetwarzający.
              Zasady przetwarzania określa{" "}
              <Link href={localeHref(locale, "/umowa-powierzenia")}>
                Umowa powierzenia przetwarzania danych osobowych
              </Link>
              , stanowiąca integralną część Umowy.
            </p>
            <p>
              Zasady przetwarzania danych osób odwiedzających serwis oraz danych kontaktowych
              Klienta opisuje{" "}
              <Link href={localeHref(locale, "/polityka-prywatnosci")}>
                Polityka prywatności
              </Link>
              .
            </p>

            <h2>§10. Czas trwania Umowy i jej rozwiązanie</h2>
            <p>
              Umowa jest zawierana na czas nieokreślony, z rozliczeniem w wybranych Okresach
              rozliczeniowych. Umowa nie jest zawierana na czas określony.
            </p>
            <p>
              Każda ze Stron może wypowiedzieć Umowę ze skutkiem na koniec bieżącego Okresu
              rozliczeniowego, bez podania przyczyny i bez opłat z tego tytułu. Wypowiedzenie
              wymaga formy dokumentowej, wystarczy wiadomość e-mail.
            </p>
            <p>
              Operator może wypowiedzieć Umowę ze skutkiem natychmiastowym w przypadku
              rażącego naruszenia Regulaminu przez Klienta, w szczególności wprowadzania
              treści bezprawnych lub działania na szkodę infrastruktury, po uprzednim
              bezskutecznym wezwaniu do zaprzestania naruszeń.
            </p>
            <p>
              <strong>Po rozwiązaniu Umowy</strong> Klient zachowuje możliwość eksportu Danych
              Klienta przez <strong>30 dni</strong>. Po upływie tego terminu Operator usuwa
              Dane Klienta ze środowiska produkcyjnego, a z kopii zapasowych w cyklu ich
              nadpisywania, nie później niż w ciągu 90 dni. Operator nie zatrzymuje Danych
              Klienta jako zabezpieczenia roszczeń.
            </p>

            <h2>§11. Reklamacje</h2>
            <p>
              Reklamacje dotyczące Usługi należy zgłaszać na adres
              nieruchomoscispectra@gmail.com. Zgłoszenie powinno zawierać opis
              nieprawidłowości oraz dane umożliwiające identyfikację Konta biura. Operator
              rozpatruje reklamację w terminie 14 dni od otrzymania.
            </p>

            <h2>§12. Zmiany Regulaminu</h2>
            <p>
              Operator może zmienić Regulamin z ważnych przyczyn, w szczególności zmiany
              przepisów prawa, zmiany zakresu Usługi lub zmian technologicznych. O zmianie
              Operator informuje Klienta na adres e-mail przypisany do Konta biura,
              z co najmniej 30-dniowym wyprzedzeniem.
            </p>
            <p>
              Jeżeli Klient nie akceptuje zmian, może wypowiedzieć Umowę przed dniem wejścia
              zmian w życie. Dalsze korzystanie z Usługi po tej dacie oznacza akceptację
              nowego brzmienia Regulaminu.
            </p>

            <h2>§13. Postanowienia końcowe</h2>
            <p>
              W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa
              polskiego, w szczególności Kodeksu cywilnego oraz ustawy o świadczeniu usług
              drogą elektroniczną.
            </p>
            <p>
              Spory wynikające z Umowy Strony poddają pod rozstrzygnięcie sądu właściwego
              miejscowo dla siedziby Operatora.
            </p>
            <p>
              Jeżeli którekolwiek postanowienie Regulaminu okaże się nieważne, pozostałe
              postanowienia zachowują moc.
            </p>
          </article>
        </section>
      </main>
      <SiteFooter lang={locale} />
    </>
  );
}
