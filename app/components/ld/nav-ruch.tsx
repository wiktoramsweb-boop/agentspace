"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

/**
 * Wspólny ruch całej strony marketingowej: płynne przewijanie (to samo na
 * stronie głównej i podstronach), poświata za kursorem, tło nawigacji po
 * przewinięciu, menu na telefonie i przycisk „na górę”.
 * Silnik strony głównej korzysta z tego samego Lenisa przez window.__lenis.
 */
export function NavRuch() {
  useEffect(() => {
    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DOKLADNY = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    const burger = document.querySelector<HTMLButtonElement>("[data-burger]");
    const menu = document.querySelector<HTMLElement>("[data-menu]");
    const poswiata = document.querySelector<HTMLElement>("[data-poswiata]");
    const sprzatanie: (() => void)[] = [];
    const nasluch = (el: EventTarget, ev: string, fn: EventListener, o?: AddEventListenerOptions) => {
      el.addEventListener(ev, fn, o);
      sprzatanie.push(() => el.removeEventListener(ev, fn, o));
    };

    // Płynne przewijanie tylko na komputerze: na telefonie systemowe jest lepsze.
    const lenis = !RM && DOKLADNY ? new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true }) : null;
    window.__lenis = lenis;

    const przewin = () => nav?.classList.toggle("przewinieta", scrollY > 30);
    przewin();
    nasluch(window, "scroll", przewin, { passive: true });

    const ustaw = (otwarte: boolean) => {
      if (!menu || !burger) return;
      menu.classList.toggle("otwarte", otwarte);
      burger.setAttribute("aria-expanded", String(otwarte));
      burger.setAttribute("aria-label", (otwarte ? burger.dataset.labelZamknij : burger.dataset.labelOtworz) || "");
      document.documentElement.style.overflow = otwarte ? "hidden" : "";
      if (otwarte) lenis?.stop();
      else lenis?.start();
    };
    if (burger) nasluch(burger, "click", () => ustaw(!menu?.classList.contains("otwarte")));
    menu?.querySelectorAll("a").forEach((a) => nasluch(a, "click", () => ustaw(false)));
    nasluch(window, "keydown", ((e: KeyboardEvent) => {
      if (e.key === "Escape" && menu?.classList.contains("otwarte")) ustaw(false);
    }) as EventListener);

    document.querySelectorAll<HTMLAnchorElement>('a[href="#top"]').forEach((a) =>
      nasluch(a, "click", ((e: MouseEvent) => {
        e.preventDefault();
        if (lenis) lenis.scrollTo(0);
        else scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" });
      }) as EventListener),
    );

    // Poświata: miękkie światło, które leniwie dogania kursor.
    let px = innerWidth / 2, py = innerHeight / 3, tx = px, ty = py;
    if (DOKLADNY && poswiata && !RM) {
      nasluch(window, "mousemove", ((e: MouseEvent) => {
        tx = e.clientX;
        ty = e.clientY;
        poswiata.classList.add("widoczna");
      }) as EventListener, { passive: true });
      nasluch(document.documentElement, "mouseleave", () => poswiata.classList.remove("widoczna"));
    }

    let raf = 0;
    const petla = (czas: number) => {
      lenis?.raf(czas);
      if (poswiata && DOKLADNY && !RM) {
        px += (tx - px) * 0.07;
        py += (ty - py) * 0.07;
        poswiata.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(petla);
    };
    raf = requestAnimationFrame(petla);

    return () => {
      cancelAnimationFrame(raf);
      sprzatanie.forEach((f) => f());
      lenis?.destroy();
      window.__lenis = null;
      document.documentElement.style.overflow = "";
    };
  }, []);
  return null;
}
