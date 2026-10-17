"use client";

import { AiCoachMockup } from "@/app/components/mockups/ai-coach-mockup";
import {
  ShotCele,
  ShotDokumenty,
  ShotFaktury,
  ShotKalendarz,
  ShotKalkulatory,
  ShotKlient,
  ShotLeady,
  ShotOferty,
  ShotOfertowka,
  ShotPanel,
  ShotPoszukiwania,
  ShotProwizje,
  ShotRole,
} from "@/app/components/mockups/light-shots";
import { ShotAutomatyzacje, ShotCzat, ShotKoszty, ShotRemont, ShotTablica } from "@/app/components/mockups/nowe-shots";

/**
 * Makieta ekranu aplikacji dobrana do modułu.
 *
 * Moduły są danymi (lib/marketing/modules.ts), a makiety komponentami, więc
 * mapowanie musi być w jednym miejscu. Dzięki temu dopisanie modułu wymaga
 * tylko nazwy makiety w danych.
 */
const MAKIETY: Record<string, (p: { lang?: string }) => React.ReactElement> = {
  ShotKlient,
  ShotOferty,
  ShotCele,
  ShotProwizje,
  ShotPanel,
  ShotKalendarz,
  ShotDokumenty,
  ShotLeady,
  ShotPoszukiwania,
  ShotOfertowka,
  ShotKalkulatory,
  ShotFaktury,
  ShotRole,
  ShotTablica,
  ShotCzat,
  ShotKoszty,
  ShotRemont,
  ShotAutomatyzacje,
  AiCoach: () => <AiCoachMockup />,
};

export function ShotFor({ shot, lang }: { shot: string; lang: string }) {
  // Nowsze moduły pokazują prawdziwy zrzut ekranu aplikacji zamiast makiety.
  if (shot.startsWith("/")) {
    // eslint-disable-next-line @next/next/no-img-element -- zrzut skaluje się razem z ramką makiety, next/image wymagałby stałych wymiarów
    return <img src={shot} alt="" className="block h-auto w-full" loading="lazy" />;
  }
  const Makieta = MAKIETY[shot] ?? ShotPulpitFallback;
  return <Makieta lang={lang} />;
}

function ShotPulpitFallback({ lang }: { lang?: string }) {
  return <ShotPanel lang={lang} />;
}
