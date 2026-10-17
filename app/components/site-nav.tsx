import { LdNav } from "./ld/rama";

/**
 * Nawigacja marketingu: ta sama co na stronie głównej (rama w ld/rama.tsx),
 * żeby wejście w podstronę nie przenosiło do starego wyglądu.
 */
export function SiteNav({ lang = "pl" }: { lang?: string }) {
  return (
    <div className="ld ld-pasek">
      <LdNav lang={lang} />
    </div>
  );
}
