"use client";

import { useEffect } from "react";

/**
 * Zachowanie nawigacji: tło po przewinięciu, menu na telefonie i przycisk
 * „na górę”. Osobno od silnika strony głównej, bo nawigacja stoi też na
 * każdej podstronie, gdzie silnika nie ma.
 */
export function NavRuch() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    const burger = document.querySelector<HTMLButtonElement>("[data-burger]");
    const menu = document.querySelector<HTMLElement>("[data-menu]");
    const sprzatanie: (() => void)[] = [];
    const nasluch = (el: EventTarget, ev: string, fn: EventListener, o?: AddEventListenerOptions) => {
      el.addEventListener(ev, fn, o);
      sprzatanie.push(() => el.removeEventListener(ev, fn, o));
    };

    const przewin = () => nav?.classList.toggle("przewinieta", scrollY > 30);
    przewin();
    nasluch(window, "scroll", przewin, { passive: true });

    const ustaw = (otwarte: boolean) => {
      if (!menu || !burger) return;
      menu.classList.toggle("otwarte", otwarte);
      burger.setAttribute("aria-expanded", String(otwarte));
      burger.setAttribute("aria-label", (otwarte ? burger.dataset.labelZamknij : burger.dataset.labelOtworz) || "");
      document.documentElement.style.overflow = otwarte ? "hidden" : "";
      // Silnik strony głównej zatrzymuje wtedy płynne przewijanie.
      window.dispatchEvent(new CustomEvent("ld-menu", { detail: otwarte }));
    };
    if (burger) nasluch(burger, "click", () => ustaw(!menu?.classList.contains("otwarte")));
    menu?.querySelectorAll("a").forEach((a) => nasluch(a, "click", () => ustaw(false)));
    nasluch(window, "keydown", ((e: KeyboardEvent) => {
      if (e.key === "Escape" && menu?.classList.contains("otwarte")) ustaw(false);
    }) as EventListener);

    document.querySelectorAll<HTMLAnchorElement>('a[href="#top"]').forEach((a) =>
      nasluch(a, "click", ((e: MouseEvent) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("ld-gora"));
        if (!document.querySelector("[data-ld]")) scrollTo({ top: 0, behavior: "smooth" });
      }) as EventListener),
    );

    return () => {
      sprzatanie.forEach((f) => f());
      document.documentElement.style.overflow = "";
    };
  }, []);
  return null;
}
