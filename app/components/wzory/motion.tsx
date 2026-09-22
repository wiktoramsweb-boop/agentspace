"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Animacje wejścia dla wzorów stron, bez dodatkowej biblioteki.
 *
 * Elementy oznaczamy atrybutami w zwykłym HTML:
 *   data-rev      - wjeżdża z dołu, gdy wejdzie w kadr
 *   data-revs     - to samo, ale dzieci po kolei
 *   data-par="10" - paralaksa tła (wartość w procentach wysokości)
 *   data-count    - licznik liczący od zera do wartości z data-count
 *
 * Ukrycie przed animacją włącza dopiero klasa .wz-anim dodawana tutaj.
 * Dzięki temu przy wyłączonym albo zepsutym JavaScripcie strona jest
 * normalnie widoczna, zamiast zostać pustym białym ekranem.
 */
export function WzMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".wz");
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    root.classList.add("wz-anim");

    const seen = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
            if (e.target.hasAttribute("data-count")) runCount(e.target as HTMLElement);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );

    /** Obserwuje wszystko, co jeszcze nie było obserwowane (także treść doładowaną później). */
    function scan() {
      const targets = root!.querySelectorAll<HTMLElement>("[data-rev], [data-revs], [data-count]");
      targets.forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.hasAttribute("data-revs")) {
          Array.from(el.children).forEach((child, i) => {
            (child as HTMLElement).style.setProperty("--i", String(Math.min(i, 12)));
          });
        }
        io.observe(el);
      });
    }

    scan();

    // Filtry, przełączanie widoku i nawigacja bez przeładowania dokładają nowe
    // elementy po tym, jak obserwator już ruszył. Bez tego zostawały niewidoczne.
    const mo = new MutationObserver(() => scan());
    mo.observe(root, { childList: true, subtree: true });

    // Bezpiecznik: gdyby obserwator czegoś nie złapał, po chwili odsłaniamy wszystko.
    const safety = window.setTimeout(() => {
      root.querySelectorAll<HTMLElement>("[data-rev], [data-revs]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in");
      });
    }, 1200);

    // Paralaksa liczona w jednej pętli klatkowej, żeby scroll pozostał płynny.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        root.querySelectorAll<HTMLElement>("[data-par]").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const amount = Number(el.dataset.par ?? 8);
          const progress = (r.top + r.height / 2 - vh / 2) / vh;
          el.style.transform = `translate3d(0, ${(progress * amount).toFixed(2)}%, 0)`;
        });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(safety);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}

/** Licznik: od zera do wartości docelowej, z wyhamowaniem na końcu. */
function runCount(el: HTMLElement) {
  const target = Number(el.dataset.count ?? 0);
  const suffix = el.dataset.suffix ?? "";
  const decimals = Number(el.dataset.decimals ?? 0);
  const duration = 1100;
  const start = performance.now();

  const step = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const value = target * eased;
    el.textContent =
      new Intl.NumberFormat("pl-PL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value) +
      suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
