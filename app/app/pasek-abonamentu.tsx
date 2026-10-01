import Link from "next/link";

/**
 * Pasek nad treścią, gdy okres próbny albo abonament dobiega końca.
 *
 * Pokazujemy go wszystkim, nie tylko CEO: agent, który nagle traci dostęp
 * w środku dnia pracy, musi wiedzieć wcześniej, dlaczego tak się dzieje.
 * Przycisk do zakupu widzi tylko CEO, bo tylko on może kupić.
 */
export function PasekAbonamentu({
  probny,
  dni,
  czyCeo,
}: {
  probny: boolean;
  dni: number;
  czyCeo: boolean;
}) {
  const pilne = dni <= 2;
  const dniTekst = dni === 1 ? "1 dzień" : dni < 5 ? `${dni} dni` : `${dni} dni`;

  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
        pilne
          ? "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-100"
          : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100"
      }`}
    >
      <p className="text-sm">
        {probny ? (
          <>
            <strong>Okres próbny kończy się za {dniTekst}.</strong>{" "}
            {czyCeo
              ? "Wykup abonament, żeby zespół nie stracił dostępu."
              : "Przekaż to właścicielowi biura, żeby zespół nie stracił dostępu."}
          </>
        ) : (
          <>
            <strong>Abonament kończy się za {dniTekst}.</strong>{" "}
            {czyCeo ? "Przedłuż go, żeby nie przerwać pracy." : "Przekaż to właścicielowi biura."}
          </>
        )}
      </p>
      {czyCeo && (
        <Link
          href="/abonament"
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {probny ? "Wykup abonament" : "Przedłuż abonament"}
        </Link>
      )}
    </div>
  );
}
