import { LdStopka } from "./ld/rama";

/** Stopka marketingu: ta sama co na stronie głównej. */
export function SiteFooter({ lang = "pl" }: { lang?: string }) {
  return (
    <div className="ld">
      <LdStopka lang={lang} />
    </div>
  );
}
