"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Silnik ruchu strony głównej: jedna pętla requestAnimationFrame dla
 * wszystkich efektów przewijania. Markup renderuje serwer, tu tylko
 * przestawiamy klasy i style, więc React nie ma czego rozjechać.
 */

const ogranicz = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const plynnie = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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

    /* Lenis tylko na komputerze: na telefonie przewijanie systemowe jest lepsze. */
    let lenis: Lenis | null = null;
    if (!RM && DOKLADNY) {
      lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    }

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
      sessionStorage.setItem("ld-intro", "1");
    } catch {}
    if (!loader || RM || widziany) {
      loader?.remove();
      requestAnimationFrame(start);
    } else {
      document.documentElement.classList.add("ld-blok");
      const t1 = window.setTimeout(() => {
        loader.classList.add("koniec");
        window.setTimeout(start, 220);
        window.setTimeout(() => loader.remove(), 1200);
      }, 1050);
      sprzatanie.push(() => window.clearTimeout(t1));
    }

    /* ── Nawigacja i menu ── */
    const nav = $("[data-nav]");
    const burger = $<HTMLButtonElement>("[data-burger]");
    const menu = $("[data-menu]");
    const ustawMenu = (otwarte: boolean) => {
      if (!menu || !burger) return;
      menu.classList.toggle("otwarte", otwarte);
      burger.setAttribute("aria-expanded", String(otwarte));
      burger.setAttribute("aria-label", (otwarte ? burger.dataset.labelZamknij : burger.dataset.labelOtworz) || "");
      document.documentElement.style.overflow = otwarte ? "hidden" : "";
      if (otwarte) lenis?.stop();
      else lenis?.start();
    };
    if (burger) nasluch(burger, "click", () => ustawMenu(!menu?.classList.contains("otwarte")));
    nasluch(window, "keydown", ((e: KeyboardEvent) => {
      if (e.key === "Escape" && menu?.classList.contains("otwarte")) ustawMenu(false);
    }) as EventListener);

    /* Kotwice: płynne przewijanie, a do przypiętych sekcji na właściwe miejsce. */
    $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
      nasluch(a, "click", ((e: MouseEvent) => {
        const id = a.getAttribute("href") || "";
        if (menu?.classList.contains("otwarte")) ustawMenu(false);
        if (id.length < 2) return;
        const cel = document.querySelector<HTMLElement>(id);
        if (!cel) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(cel, { offset: -10 });
        else cel.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
      }) as EventListener),
    );

    /* ── Skalowane sceny (stała szerokość w środku, skala do kontenera) ── */
    const skale = $$("[data-skala]");
    const skaluj = () =>
      skale.forEach((f) => {
        const W = Number(f.dataset.w), H = Number(f.dataset.h), s = f.clientWidth / W;
        (f.firstElementChild as HTMLElement).style.transform = `scale(${s})`;
        f.style.height = `${H * s}px`;
      });

    /* ── Odsłanianie jednorazowe ── */
    const io = new IntersectionObserver(
      (wpisy) =>
        wpisy.forEach((w) => {
          if (!w.isIntersecting) return;
          w.target.classList.add("widac");
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

    /* ── Historie przypięte ── */
    const historie = $$("[data-historia]").map((el) => ({
      el,
      kroki: $$(".ld-krok", el),
      ekrany: $$("[data-ekran]", el),
      kropki: $$<HTMLButtonElement>("[data-kropka]", el),
      kropka: -1,
    }));
    historie.forEach((h) =>
      h.kropki.forEach((b, i) =>
        nasluch(b, "click", () => {
          const k = h.kroki[i];
          if (!k) return;
          if (lenis) lenis.scrollTo(k, { offset: -(innerHeight / 2 - k.offsetHeight / 2) });
          else k.scrollIntoView({ behavior: "smooth", block: "center" });
        }),
      ),
    );
    const srodekKroku = (k: HTMLElement) => {
      const tresc = Array.from(k.children).filter((c) => !c.classList.contains("ld-inline")) as HTMLElement[];
      if (!tresc.length) return k.getBoundingClientRect().top + k.offsetHeight / 2;
      return (tresc[0].getBoundingClientRect().top + tresc[tresc.length - 1].getBoundingClientRect().bottom) / 2;
    };
    const historia = (h: (typeof historie)[number]) => {
      const r = h.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      if (vw < 960) return;
      const vc = vh * 0.5;
      const s = h.kroki.map(srodekKroku);
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
        const a = RM ? (Math.round(f) === k ? 1 : 0) : ogranicz(1 - (Math.abs(d) - 0.38) / 0.24);
        el.style.opacity = a.toFixed(3);
        el.style.transform = RM ? "none" : `translateY(${((1 - a) * (d > 0 ? -36 : 36)).toFixed(1)}px) scale(${(0.97 + 0.03 * a).toFixed(4)})`;
        el.classList.toggle("on", a > 0.5);
        const krok = h.kroki[k];
        if (krok) krok.style.opacity = (0.25 + 0.75 * a).toFixed(3);
      });
      const kr = Math.round(f);
      if (kr !== h.kropka) {
        h.kropka = kr;
        h.kropki.forEach((b, k) => b.classList.toggle("on", k === kr));
      }
    };

    /* ── Rozszerzające się ujęcie ── */
    const rozsz = $("[data-rozsz]");
    const rozszObraz = $("[data-rozsz-obraz]");
    const rozszIlu = rozszObraz?.querySelector<HTMLElement>(".ld-ilu");
    const rozszTekst = $("[data-rozsz-tekst]");

    /* ── Moduły ── */
    const modTor = $("[data-mod]");
    const zakladki = modTor ? $$<HTMLButtonElement>("[data-zakladka]", modTor) : [];
    const podpisy = modTor ? $$(".ld-mod__podpis > div", modTor) : [];
    const zrzuty = modTor ? $$(".ld-mod__zrzuty img", modTor) : [];
    const ILE_MOD = zakladki.length;
    let modNr = 0;
    const ustawMod = (i: number) => {
      if (i === modNr) return;
      modNr = i;
      zakladki.forEach((t, k) => {
        t.classList.toggle("on", k === i);
        t.setAttribute("aria-selected", String(k === i));
      });
      podpisy.forEach((c, k) => c.classList.toggle("on", k === i));
      zrzuty.forEach((c, k) => c.classList.toggle("on", k === i));
    };
    zakladki.forEach((t, i) =>
      nasluch(t, "click", () => {
        if (RM || !modTor) {
          ustawMod(i);
          return;
        }
        const gora = modTor.getBoundingClientRect().top + scrollY;
        const zakres = modTor.offsetHeight - innerHeight;
        const y = gora + (zakres * (i + 0.5)) / ILE_MOD;
        if (lenis) lenis.scrollTo(y);
        else scrollTo({ top: y, behavior: "smooth" });
      }),
    );

    /* ── Liczby ── */
    const dowodTor = $("[data-dowod]");
    const slajdy = dowodTor ? $$(".ld-dowod__slajd", dowodTor) : [];
    const paski = dowodTor ? $$(".ld-dowod__nav i", dowodTor) : [];
    let dowodNr = 0;
    const ustawDowod = (i: number) => {
      if (i === dowodNr) return;
      dowodNr = i;
      slajdy.forEach((s, k) => {
        s.classList.toggle("on", k === i);
        s.classList.toggle("byl", k < i);
      });
    };

    /* ── Karty nakładające się ── */
    const karty = $$(".ld-skarta");
    let kartyTop: number[] = [];

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

    /* ── Kursor i przyciski magnetyczne ── */
    const kursor = $("[data-kursor]");
    let mx = 0, my = 0, smx = 0, smy = 0, kx = -100, ky = -100, cx = -100, cy = -100;
    if (DOKLADNY && kursor) {
      nasluch(window, "mousemove", ((e: MouseEvent) => {
        cx = e.clientX;
        cy = e.clientY;
        mx = (e.clientX / innerWidth) * 2 - 1;
        my = (e.clientY / innerHeight) * 2 - 1;
        kursor.classList.add("widoczny");
      }) as EventListener, { passive: true });
      nasluch(document, "mouseover", ((e: MouseEvent) => {
        const t = e.target as Element | null;
        kursor.classList.toggle("duzy", !!t?.closest?.("a,button,input,.ld-kkarta"));
      }) as EventListener);
      nasluch(document.documentElement, "mouseleave", () => kursor.classList.remove("widoczny"));
      if (!RM)
        $$("[data-magnes]").forEach((b) => {
          nasluch(b, "mousemove", ((e: MouseEvent) => {
            const r = b.getBoundingClientRect();
            b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
          }) as EventListener);
          nasluch(b, "mouseleave", () => (b.style.transform = ""));
        });
    }

    /* ── Pozostałe elementy ── */
    const scena = $(".ld-scena");
    const pochyl = $("[data-pochyl]");
    const plywa = $$("[data-plywa]");
    const koniec = $("[data-koniec]");
    const napis = $("[data-napis]");

    let vh = innerHeight, vw = innerWidth, docH = 1, scenaTop = 0;
    let sy = scrollY, ssy = sy, brudne = true;

    function mierz() {
      vh = innerHeight;
      vw = innerWidth;
      skaluj();
      const statyczny = RM;
      if (modTor) modTor.style.height = statyczny ? "" : `${(ILE_MOD * 0.7 + 1) * vh}px`;
      if (dowodTor) dowodTor.style.height = statyczny ? "" : `${(slajdy.length * 0.8 + 1) * vh}px`;
      scenaTop = scena ? scena.getBoundingClientRect().top + scrollY : 0;
      kartyTop = karty.map((c) => parseFloat(getComputedStyle(c).top) || 0);
      docH = document.documentElement.scrollHeight;
      brudne = true;
    }

    function aktualizuj() {
      const y = sy;
      historie.forEach(historia);
      if (nav) nav.classList.toggle("przewinieta", y > 30);
      if (RM) return;
      let r: DOMRect;

      if (pochyl && y < scenaTop + vh * 1.2) {
        const e = plynnie(ogranicz(y / Math.max(1, scenaTop - vh * 0.15)));
        pochyl.style.transform = `rotateX(${((1 - e) * 20).toFixed(2)}deg) scale(${(0.93 + 0.07 * e).toFixed(4)})`;
        plywa.forEach((f) => {
          const d = Number(f.dataset.plywa);
          f.style.transform = `translate3d(${(smx * d * 16).toFixed(1)}px, ${(smy * d * 12 - ssy * d * 0.1).toFixed(1)}px, 0)`;
        });
      }

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

      if (rozsz && rozszObraz) {
        r = rozsz.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          const p = ogranicz(-r.top / (r.height - vh));
          const e = plynnie(ogranicz(p / 0.6));
          const ix = (vw < 900 ? 6 : 20) * (1 - e), iy = (vw < 900 ? 14 : 18) * (1 - e);
          rozszObraz.style.clipPath = `inset(${iy.toFixed(2)}% ${ix.toFixed(2)}% ${iy.toFixed(2)}% ${ix.toFixed(2)}% round ${(40 * (1 - e)).toFixed(1)}px)`;
          if (rozszIlu) rozszIlu.style.transform = `scale(${(1.2 - 0.2 * e).toFixed(4)})`;
          if (rozszTekst) {
            const c = ogranicz((p - 0.5) / 0.25);
            rozszTekst.style.opacity = String(c);
            rozszTekst.style.transform = `translateY(${((1 - c) * 40).toFixed(1)}px)`;
          }
        }
      }

      if (modTor) {
        r = modTor.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          const p = ogranicz(-r.top / (r.height - vh)), f = p * ILE_MOD;
          const i = Math.min(ILE_MOD - 1, Math.floor(f));
          ustawMod(i);
          zakladki.forEach((t, k) => ((t.lastElementChild as HTMLElement).style.transform = `scaleX(${k === i ? ogranicz(f - i).toFixed(3) : 0})`));
        }
      }

      if (dowodTor) {
        r = dowodTor.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          const p = ogranicz(-r.top / (r.height - vh)), f = p * slajdy.length;
          const i = Math.min(slajdy.length - 1, Math.floor(f));
          ustawDowod(i);
          paski.forEach((b, k) => (b.style.transform = `scaleY(${k < i ? 1 : k === i ? ogranicz(f - i).toFixed(3) : 0})`));
        }
      }

      for (let i = 0; i < karty.length - 1; i++) {
        const nt = karty[i + 1].getBoundingClientRect().top;
        const t = ogranicz((vh - nt) / Math.max(1, vh - kartyTop[i + 1]));
        karty[i].style.transform = `scale(${(1 - 0.05 * t).toFixed(4)})`;
        karty[i].style.setProperty("--dim", (t * 0.18).toFixed(3));
      }

      if (koniec) {
        r = koniec.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
          const t = ogranicz((vh - r.top) / (vh * 0.7));
          koniec.style.transform = `scale(${(0.94 + 0.06 * plynnie(t)).toFixed(4)})`;
        }
      }

      if (napis) {
        r = napis.getBoundingClientRect();
        if (r.top < vh) {
          const p = plynnie(ogranicz(1 - (docH - vh - y) / (vh * 0.7)));
          napis.style.transform = `translateY(${((1 - p) * 55).toFixed(1)}%)`;
        }
      }
    }

    nasluch(window, "scroll", () => (brudne = true), { passive: true });
    let rt = 0;
    nasluch(window, "resize", () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(mierz, 120);
    });
    nasluch(window, "load", mierz);

    let raf = 0;
    const petla = (czas: number) => {
      lenis?.raf(czas);
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
      if (DOKLADNY && kursor) {
        kx += (cx - kx) * 0.22;
        ky += (cy - ky) * 0.22;
        kursor.style.transform = `translate3d(${kx.toFixed(1)}px, ${ky.toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(petla);
    };
    mierz();
    raf = requestAnimationFrame(petla);

    return () => {
      cancelAnimationFrame(raf);
      sprzatanie.forEach((f) => f());
      lenis?.destroy();
      document.documentElement.classList.remove("ld-blok");
      document.documentElement.style.overflow = "";
    };
  }, []);

  return null;
}
