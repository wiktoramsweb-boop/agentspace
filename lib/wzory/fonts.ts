import {
  Fraunces,
  Manrope,
  Cormorant_Garamond,
  Jost,
  Space_Grotesk,
  Inter_Tight,
  Sora,
  Plus_Jakarta_Sans,
} from "next/font/google";
import type { WzorSlug } from "./themes";

/**
 * Każdy wzór ma własną parę krojów. Zmienne CSS (--wf-d, --wf-b) czyta motyw,
 * więc sam arkusz wzoru nie musi wiedzieć, jak font się nazywa.
 */

const fraunces = Fraunces({ subsets: ["latin-ext"], weight: ["300", "400", "600", "700"], variable: "--f-fraunces" });
const manrope = Manrope({ subsets: ["latin-ext"], weight: ["400", "500", "600", "700"], variable: "--f-manrope" });
const cormorant = Cormorant_Garamond({ subsets: ["latin-ext"], weight: ["300", "400", "600"], variable: "--f-cormorant" });
const jost = Jost({ subsets: ["latin-ext"], weight: ["300", "400", "500", "600"], variable: "--f-jost" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin-ext"], weight: ["400", "500", "700"], variable: "--f-space" });
const interTight = Inter_Tight({ subsets: ["latin-ext"], weight: ["400", "500", "600", "700"], variable: "--f-inter-tight" });
const sora = Sora({ subsets: ["latin-ext"], weight: ["400", "600", "700"], variable: "--f-sora" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin-ext"], weight: ["400", "500", "600", "700"], variable: "--f-jakarta" });

export const WZOR_FONTS: Record<WzorSlug, string> = {
  kamienica: `${fraunces.variable} ${manrope.variable}`,
  nokturn: `${cormorant.variable} ${jost.variable}`,
  siatka: `${spaceGrotesk.variable} ${interTight.variable}`,
  przystan: `${sora.variable} ${jakarta.variable}`,
};
