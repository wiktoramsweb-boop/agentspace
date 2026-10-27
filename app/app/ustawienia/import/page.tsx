import { requireModul } from "@/lib/auth";
import { KreatorImportu } from "./kreator";
import { ZgloszenieMigracji } from "./migracja";
import { PobieranieZdjec } from "./pobieranie-zdjec";
import { zdjeciaWKolejce } from "@/lib/import-zdjec";

/**
 * Import danych z innego systemu.
 *
 * Strona istnieje, bo biuro z trzystoma ofertami w innym CRM nie przepisze
 * ich ręcznie, a bez tego rozmowa handlowa kończy się na pytaniu
 * „a przeniesiecie nam bazę?".
 */
export default async function ImportPage() {
  const user = await requireModul("ustawienia");
  const wKolejce = user.agency_id ? await zdjeciaWKolejce(user.agency_id) : null;

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Import danych</h1>
      <p className="mb-6 max-w-2xl text-slate-600">
        Wgraj klientów i oferty z poprzedniego systemu. Zobaczysz podgląd, zanim cokolwiek trafi
        do bazy, a powtórzone rekordy zostaną pominięte. Opiekunów rozpoznam po mailu albo imieniu
        i nazwisku, a zdjęcia ofert pobiorę z linków w pliku.
      </p>

      <div className="mb-6 space-y-4">
        <ZgloszenieMigracji />
        {wKolejce ? <PobieranieZdjec naStart={wKolejce} /> : null}
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Jak przygotować plik</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Wyeksportuj dane z poprzedniego systemu do pliku XLSX albo CSV.</li>
          <li>Otwórz go w Excelu i zapisz jako <strong>CSV</strong>. Średnik czy przecinek rozpoznam sam.</li>
          <li>Pierwszy wiersz musi zawierać nazwy kolumn.</li>
          <li>Klientów i nieruchomości wgrywaj osobno, każde ze swojego pliku.</li>
          <li>Kolumna z ID z poprzedniego programu chroni przed podwójnym importem, gdy wgrasz plik jeszcze raz.</li>
          <li>Zdjęcia: kolumna z linkami do zdjęć (kilka w jednej komórce, oddzielone przecinkiem lub średnikiem).</li>
        </ol>
      </div>

      <KreatorImportu />
    </>
  );
}
