"use client";

import { useEffect } from "react";

/**
 * Animacje wejścia dla wzorów stron, bez dodatkowej biblioteki.
 *
 * Elementy oznaczamy atrybutami w zwykłym HTML:
 *   data-rev   - wjeżdża z dołu, gdy wejdzie w kadr
 *   data-revs  - to samo, ale dzieci po kolei
 *   data-par="10" - paralaksa tła (wartość w procentach wysokości)
 */
export function WzMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = document.querySelectorAll<HTMLElement>("[data-rev], [data-revs]");
    targets.forEach((el) => {
      if (el.hasAttribute("data-revs")) {
        Array.from(el.children).forEach((child, i) => {
          (child as HTMLElement).style.setProperty("--i", String(i));
        });
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach((el) => io.observe(el));

    // Paralaksa liczona w jednej pętli klatkowej, żeby scroll pozostał płynny.
    const parallax = Array.from(document.querySelectorAll<HTMLElement>("[data-par]"));
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        for (const el of parallax) {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) continue;
          const amount = Number(el.dataset.par ?? 8);
          const progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 .. 1
          el.style.transform = `translate3d(0, ${(progress * amount).toFixed(2)}%, 0)`;
        }
      });
    };
    if (parallax.length) {
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
