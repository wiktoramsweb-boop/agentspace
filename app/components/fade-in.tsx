import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";

/**
 * Wejście treści przy przewijaniu - CZYSTY CSS, bez JavaScriptu.
 *
 * DLACZEGO NIE motion/react:
 * `whileInView` ukrywa treść (opacity: 0) i odsłania ją dopiero, gdy JS się
 * zhydratuje i odpali animację. Jeśli JS nie wystartuje, karta jest wolno
 * ładowana albo przeglądarka wstrzyma rAF (np. karta w tle) - cała strona
 * poniżej hero zostaje niewidoczna. Dla strony marketingowej to niedopuszczalne.
 *
 * Tutaj animacja jest wyłącznie warstwą ozdobną: element ZAWSZE kończy
 * widoczny, bo `animation-fill-mode: both` domyka go na stanie `to`.
 * Definicja animacji: `.mk-reveal` w globals.css.
 *
 * To są komponenty serwerowe - nie dokładają ani bajta JS do przeglądarki.
 */

type FadeInProps = {
  children: ReactNode;
  /** Opóźnienie w sekundach. */
  delay?: number;
  className?: string;
};

function delayStyle(delay: number): CSSProperties | undefined {
  return delay ? ({ "--mk-delay": `${delay}s` } as CSSProperties) : undefined;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <div
      className={`mk-reveal${className ? ` ${className}` : ""}`}
      style={delayStyle(delay)}
    >
      {children}
    </div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Odstęp między kolejnymi elementami, w sekundach. */
  staggerDelay?: number;
};

/**
 * Kontener kaskady. Sam nie animuje - rozdaje opóźnienia dzieciom,
 * żeby wchodziły jedno po drugim.
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
}: StaggerProps) {
  const items = Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, i) => {
        if (!isValidElement(child)) return child;
        // Opóźnienie wstrzykujemy zmienną CSS na opakowaniu - StaggerItem
        // nie musi wiedzieć, którym jest z kolei.
        return (
          <div
            key={child.key ?? i}
            className="contents"
            style={delayStyle(i * staggerDelay)}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mk-reveal${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
