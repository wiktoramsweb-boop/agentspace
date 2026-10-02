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
  AiCoach: () => <AiCoachMockup />,
};

export function ShotFor({ shot, lang }: { shot: string; lang: string }) {
  const Makieta = MAKIETY[shot] ?? ShotPulpitFallback;
  return <Makieta lang={lang} />;
}

function ShotPulpitFallback({ lang }: { lang?: string }) {
  return <ShotPanel lang={lang} />;
}
