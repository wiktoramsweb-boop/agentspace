import type { Goal } from "./types";

export type FunnelTargets = {
  // roczne cele (liczby)
  annual: { sales: number; listings: number; meetings: number; calls: number; buyers: number };
  // cele per okres dla każdego etapu lejka
  byStage: Record<
    "cold_calls" | "meetings" | "listings" | "buyers" | "sales",
    { yearly: number; monthly: number; weekly: number; daily: number; hourly: number }
  >;
};

const WORK_HOURS_PER_DAY = 8;

export function computeFunnel(goal: Goal): FunnelTargets {
  const annualSales = goal.annual_income_pln / Math.max(1, goal.avg_commission_pln);
  const annualListings = annualSales * goal.listings_per_sale;
  const annualMeetings = annualListings * goal.meetings_per_listing;
  const annualCalls = annualMeetings * goal.calls_per_meeting;
  // kupujący: zakładamy ~1 kupujący na sprzedaż (uproszczenie) — do lejka informacyjnie
  const annualBuyers = annualSales;

  const workdaysPerYear = Math.max(1, goal.workdays_per_week) * 52;

  function periods(annual: number) {
    const daily = annual / workdaysPerYear;
    return {
      yearly: Math.ceil(annual),
      monthly: Math.ceil(annual / 12),
      weekly: Math.ceil(annual / 52),
      daily: Math.ceil(daily),
      hourly: Math.max(1, Math.round((daily / WORK_HOURS_PER_DAY) * 10) / 10) as number,
    };
  }

  return {
    annual: {
      sales: Math.ceil(annualSales),
      listings: Math.ceil(annualListings),
      meetings: Math.ceil(annualMeetings),
      calls: Math.ceil(annualCalls),
      buyers: Math.ceil(annualBuyers),
    },
    byStage: {
      cold_calls: periods(annualCalls),
      meetings: periods(annualMeetings),
      listings: periods(annualListings),
      buyers: periods(annualBuyers),
      sales: periods(annualSales),
    },
  };
}

export const DEFAULT_GOAL: Omit<Goal, "id" | "agent_id" | "agency_id" | "created_at" | "updated_at"> = {
  annual_income_pln: 120000,
  avg_commission_pln: 8000,
  workdays_per_week: 5,
  calls_per_meeting: 12,
  meetings_per_listing: 3,
  listings_per_sale: 1.6,
};
