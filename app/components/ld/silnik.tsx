"use client";

import { useEffect } from "react";

/**
 * Silnik ruchu strony głównej: jedna pętla requestAnimationFrame dla
 * wszystkich efektów przewijania. Markup renderuje serwer, tu tylko
 * przestawiamy klasy i style, więc React nie ma czego rozjechać.
 *
 * Efekty przypięte (pulpit, etapy Coacha, poziomy tor) działają od 960 px.
 * Na telefonie te same treści stoją jedna pod drugą, bez przypinania.
 */

const ogranicz = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const plynnie = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const SZEROKI = 960;

export function Silnik() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-ld]");
    if (!root) return;
    const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = root) => c.querySelector<T>(s);
    const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = root) => Array.from(c.querySelectorAll<T>(s));
    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DOKLADNY = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const sprzatanie: (() => void)[] = [];
    const nasluch = (el: EventTarget, ev: string, fn: EventListener, o?: AddEventListenerOptions) => {
      el.addEventListener(ev, fn, o);
      sprzatanie.push(() => el.removeEventListener(ev, fn, o));
    };

    root.classList.add("js");
    if (RM) root.classList.add("statyczna");

    // Płynne przewijanie tworzy NavRuch (wspólne dla wszystkich stron): bierzemy je stamtąd w chwili użycia.
    const L = () => window.__lenis ?? null;

    /* ── Loader ── */
    const loader = $("[data-loader]");
    const start = () => {
      root.classList.add("gotowa");
      document.documentElement.classList.remove("ld-blok");
      mierz();
    };
    let widziany = false;
    try {
      widziany = sessionStorage.getItem("ld-intro") === "1";
    } catch {}
    if (!loader || RM || widziany) {
      loader?.remove();
      requestAnimationFrame(start);
    } else {
      document.documentElement.classList.add("ld-blok");
      const t1 = window.setTimeout(() => {
        loader.classList.add("koniec");
        // Znacznik dopiero po animacji: zapisany od razu psuł wejście, gdy efekt ruszał dwa razy.
        try {
          sessionStorage.setItem("ld-intro", "1");
        } catch {}
        window.setTimeout(start, 220);
        window.setTimeout(() => loader.remove(), 1200);
      }, 1350);
      sprzatanie.push(() => window.clearTimeout(t1));
    }

    /* Kotwice: płynne przewijanie. */
    $$<HTMLAnchorElement>('a[href^="#"]:not([href="#top"])').forEach((a) =>
      nasluch(a, "click", ((e: MouseEvent) => {
        const id = a.getAttribute("href") || "";
        if (id.length < 2) return;
        const cel = document.querySelector<HTMLElement>(id);
        if (!cel) return;
        e.preventDefault();
        const l = L();
        if (l) l.scrollTo(cel, { offset: -10 });
        else cel.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
      }) as EventListener),
    );

    /* ── Odliczanie liczb ── */
    const odlicz = (el: HTMLElement) => {
      const cel = Number(el.dataset.licznik);
      if (RM || !cel) return;
      const t0 = performance.now();
      const krok = (t: number) => {
        const p = ogranicz((t - t0) / 1400);
        el.textContent = String(Math.round(cel * plynnie(p)));
        if (p < 1) requestAnimationFrame(krok);
      };
      el.textContent = "0";
      requestAnimationFrame(krok);
    };

    /* ── Odsłanianie jednorazowe ── */
    const io = new IntersectionObserver(
      (wpisy) =>
        wpisy.forEach((w) => {
          if (!w.isIntersecting) return;
          w.target.classList.add("widac");
          w.target.querySelectorAll<HTMLElement>("[data-licznik]").forEach(odlicz);
          io.unobserve(w.target);
        }),
      { threshold: 0.22 },
    );
    $$(".ld-slowa, [data-odslon], [data-odslon-klasa]").forEach((el) => (RM ? el.classList.add("widac") : io.observe(el)));
    sprzatanie.push(() => io.disconnect());

    /* ── Manifest: słowa zapalają się z przewijaniem ── */
    const manifest = $("[data-manifest]");
    const slowaM = manifest ? $$(".w", manifest) : [];
    let poprzednieM = -1;

    /* ── 01 Pulpit: okno wypłaszcza się, punkty zapalają się po kolei ── */
    const plaszcz = $("[data-plaszcz]");
    const plaszczOkno = $("[data-plaszcz-okno]");
    const plaszczPunkty = $$("[data-plaszcz-punkt]");

    /* ── 02 Coach: przypięte etapy ── */
    const etapy = $("[data-etapy]");
    const etapTaby = etapy ? $$<HTMLButtonElement>("[data-etap-tab]", etapy) : [];
    const etapWizualy = etapy ? $$("[data-etap-wizual]", etapy) : [];
    const etapTeksty = etapy ? $$("[data-etap-tekst]", etapy) : [];
    const ILE_ETAPOW = etapTaby.length;
    let etapNr = 0;
    const ustawEtap = (i: number) => {
      if (i === etapNr) return;
      etapNr = i;
      etapTaby.forEach((t, k) => {
        t.classList.toggle("on", k === i);
        t.setAttribute("aria-selected", String(k === i));
      });
      etapWizualy.forEach((c, k) => c.classList.toggle("on", k === i));
      etapTeksty.forEach((c, k) => c.classList.toggle("on", k === i));
    };
    etapTaby.forEach((t, i) =>
      nasluch(t, "click", () => {
        if (RM || !etapy || vw < SZEROKI) {
          ustawEtap(i);
          return;
        }
        const gora = etapy.getBoundingClientRect().top + scrollY;
        const y = gora + ((etapy.offsetHeight - innerHeight) * (i + 0.5)) / ILE_ETAPOW;
        const l = L();
        if (l) l.scrollTo(y);
        else scrollTo({ top: y, behavior: "smooth" });
      }),
    );

    /* ── 03 Teren: poziomy tor ── */
    const poziomo = $("[data-poziomo]");
    const szyna = $("[data-poziomo-szyna]");
    const zegarPasek = $("[data-poziomo-pasek]");
    const znaczniki = $$("[data-poziomo-znacznik]");
    let szynaZakres = 0;

    /* ── Indeks modułów (historia: wiersze po prawej, okno po lewej) ── */
    const historie = $$("[data-historia]").map((el) => ({ el, kroki: $$(".ld-krok", el), ekrany: $$("[data-ekran]", el) }));
    const historia = (h: (typeof historie)[number]) => {
      const r = h.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || vw < SZEROKI) return;
      const vc = vh * 0.5;
      const s = h.kroki.map((k) => {
        const b = k.getBoundingClientRect();
        return b.top + b.height / 2;
      });
      const ile = s.length;
      let f: number;
      if (vc <= s[0]) f = 0;
      else if (vc >= s[ile - 1]) f = ile - 1;
      else {
        let i = 0;
        while (vc > s[i + 1]) i++;
        f = i + (vc - s[i]) / (s[i + 1] - s[i]);
      }
      h.ekrany.forEach((el, k) => {
        const d = f - k;
        const a = RM ? (Math.round(f) === k ? 1 : 0) : ogranicz(1 - (Math.abs(d) - 0.35) / 0.3);
        el.style.opacity = a.toFixed(3);
        el.style.transform = RM ? "none" : `scale(${(1.04 - 0.04 * a).toFixed(4)})`;
        const krok = h.kroki[k];
        if (krok) krok.classList.toggle("on", a > 0.5);
      });
    };

    /* ── 05 Start: linia osi ── */
    const linia = $("[data-linia]");
    const liniaPasek = $("[data-linia-pasek]");
    const wezly = $$("[data-linia-wezel]");

    /* ── FAQ ── */
    $$("[data-pyt]").forEach((p) => {
      const b = p.querySelector("button");
      if (b)
        nasluch(b, "click", () => {
          const otw = !p.classList.contains("otwarte");
          p.classList.toggle("otwarte", otw);
          b.setAttribute("aria-expanded", String(otw));
        });
    });

    /* ── Przyciski magnetyczne i ruch myszy dla pływających elementów ── */
    let mx = 0, my = 0, smx = 0, smy = 0;
    if (DOKLADNY) {
      nasluch(window, "mousemove", ((e: MouseEvent) => {
        mx = (e.clientX / innerWidth) * 2 - 1;
        my = (e.clientY / innerHeight) * 2 - 1;
      }) as EventListener, { passive: true });
      if (!RM)
        $$("[data-magnes]").forEach((b) => {
          nasluch(b, "mousemove", ((e: MouseEvent) => {
            const r = b.getBoundingClientRect();
            b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
          }) as EventListener);
          nasluch(b, "mouseleave", () => (b.style.transform = ""));
        });
    }

    const plywa = $$("[data-plywa]");
    const paralaksy = $$("[data-paralaksa]");

    let vh = innerHeight, vw = innerWidth;
    let sy = scrollY, ssy = sy, brudne = true;

    function mierz() {
      vh = innerHeight;
      vw = innerWidth;
      const przypinaj = !RM && vw >= SZEROKI;
      if (plaszcz) plaszcz.style.height = przypinaj ? `${2.4 * vh}px` : "";
      if (etapy) etapy.style.height = przypinaj ? `${(ILE_ETAPOW * 0.85 + 1) * vh}px` : "";
      if (poziomo && szyna) {
        szyna.style.transform = "";
        szynaZakres = przypinaj ? Math.max(0, szyna.scrollWidth - szyna.clientWidth) : 0;
        poziomo.style.height = przypinaj ? `${szynaZakres + vh * 1.1}px` : "";
      }
      brudne = true;
    }

    /** Postęp przewijania przypiętego toru: 0 na wejściu, 1 przy wyjściu. */
    const postep = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return null;
      return ogranicz(-r.top / Math.max(1, r.height - vh));
    };

    function aktualizuj() {
      historie.forEach(historia);
      if (RM) return;
      const szeroki = vw >= SZEROKI;
      let r: DOMRect;

      plywa.forEach((f) => {
        const d = Number(f.dataset.plywa);
        f.style.transform = `translate3d(${(smx * d * 14).toFixed(1)}px, ${(smy * d * 10 - Math.min(ssy, vh) * d * 0.06).toFixed(1)}px, 0)`;
      });

      paralaksy.forEach((el) => {
        r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const k = Number(el.dataset.paralaksa);
        const odSrodka = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-odSrodka * k).toFixed(1)}px, 0) scale(1.14)`;
      });

      if (manifest) {
        r = manifest.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          const k = Math.round(ogranicz((vh * 0.85 - r.top) / (vh * 0.35 + r.height)) * slowaM.length);
          if (k !== poprzednieM) {
            slowaM.forEach((w, i) => w.classList.toggle("on", i < k));
            poprzednieM = k;
          }
        }
      }

      if (plaszcz && plaszczOkno && szeroki) {
        const p = postep(plaszcz);
        if (p !== null) {
          const e = plynnie(ogranicz(p / 0.55));
          plaszczOkno.style.transform = `perspective(1800px) rotateY(${(-24 * (1 - e)).toFixed(2)}deg) rotateX(${(10 * (1 - e)).toFixed(2)}deg) translateX(${(14 * (1 - e)).toFixed(2)}%) scale(${(0.82 + 0.18 * e).toFixed(4)})`;
          plaszczPunkty.forEach((pt, i) => pt.classList.toggle("on", p > 0.12 + i * 0.2));
        }
      }

      if (etapy && szeroki) {
        const p = postep(etapy);
        if (p !== null) {
          const f = p * ILE_ETAPOW;
          const i = Math.min(ILE_ETAPOW - 1, Math.floor(f));
          ustawEtap(i);
          etapTaby.forEach((t, k) => {
            const em = t.querySelector<HTMLElement>("em");
            if (em) em.style.transform = `scaleX(${k < i ? 1 : k === i ? ogranicz(f - i).toFixed(3) : 0})`;
          });
        }
      }

      if (poziomo && szyna && szeroki) {
        const p = postep(poziomo);
        if (p !== null) {
          szyna.style.transform = `translate3d(${(-szynaZakres * p).toFixed(1)}px, 0, 0)`;
          if (zegarPasek) zegarPasek.style.transform = `scaleX(${p.toFixed(4)})`;
          znaczniki.forEach((z, i) => z.classList.toggle("on", p >= i / Math.max(1, znaczniki.length - 1) - 0.02));
        }
      }

      if (linia && liniaPasek) {
        r = linia.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          const p = ogranicz((vh * 0.75 - r.top) / (r.height * 0.8));
          liniaPasek.style.transform = szeroki ? `scaleX(${p.toFixed(4)})` : `scaleY(${p.toFixed(4)})`;
          wezly.forEach((w, i) => w.classList.toggle("on", p >= i / Math.max(1, wezly.length - 1) - 0.05));
        }
      }
    }
    if (RM) {
      plaszczPunkty.forEach((p) => p.classList.add("on"));
      wezly.forEach((w) => w.classList.add("on"));
    }

    nasluch(window, "scroll", () => (brudne = true), { passive: true });
    let rt = 0;
    nasluch(window, "resize", () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(mierz, 120);
    });
    nasluch(window, "load", mierz);

    let raf = 0;
    const petla = () => {
      sy = scrollY;
      const dy = sy - ssy;
      ssy += dy * 0.12;
      smx += (mx - smx) * 0.08;
      smy += (my - smy) * 0.08;
      const ruch = Math.abs(dy) > 0.3 || Math.abs(mx - smx) > 0.002 || Math.abs(my - smy) > 0.002;
      if (brudne || ruch) {
        aktualizuj();
        brudne = false;
      }
      raf = requestAnimationFrame(petla);
    };
    mierz();
    raf = requestAnimationFrame(petla);

    return () => {
      cancelAnimationFrame(raf);
      sprzatanie.forEach((f) => f());
      document.documentElement.classList.remove("ld-blok");
    };
  }, []);

  return null;
}
