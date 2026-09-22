import {
  Fraunces,
  Manrope,
  Cormorant_Garamond,
  Jost,
  Space_Grotesk,
  Inter_Tight,
  Sora,
  Plus_Jakarta_Sans,
  Outfit,
  Karla,
  Anton,
  DM_Sans,
  Lora,
  Nunito_Sans,
  Unbounded,
  Figtree,
} from "next/font/google";
import type { WzorSlug } from "./themes";

/**
 * Każdy wzór ma własną parę krojów. Zmienne CSS (--wf-d, --wf-b) czyta motyw,
 * więc sam arkusz wzoru nie musi wiedzieć, jak font się nazywa.
 */

const fraunces = Fraunces({ subsets: ["latin-ext"], variable: "--f-fraunces" });
const manrope = Manrope({ subsets: ["latin-ext"], variable: "--f-manrope" });
const cormorant = Cormorant_Garamond({ subsets: ["latin-ext"], weight: ["300", "400", "600"], variable: "--f-cormorant" });
const jost = Jost({ subsets: ["latin-ext"], variable: "--f-jost" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin-ext"], variable: "--f-space" });
const interTight = Inter_Tight({ subsets: ["latin-ext"], variable: "--f-inter-tight" });
const sora = Sora({ subsets: ["latin-ext"], variable: "--f-sora" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin-ext"], variable: "--f-jakarta" });
const outfit = Outfit({ subsets: ["latin-ext"], variable: "--f-outfit" });
const karla = Karla({ subsets: ["latin-ext"], variable: "--f-karla" });
const anton = Anton({ subsets: ["latin-ext"], weight: ["400"], variable: "--f-anton" });
const dmSans = DM_Sans({ subsets: ["latin-ext"], variable: "--f-dm" });
const lora = Lora({ subsets: ["latin-ext"], variable: "--f-lora" });
const nunito = Nunito_Sans({ subsets: ["latin-ext"], variable: "--f-nunito" });
const unbounded = Unbounded({ subsets: ["latin-ext"], variable: "--f-unbounded" });
const figtree = Figtree({ subsets: ["latin-ext"], variable: "--f-figtree" });

export const WZOR_FONTS: Record<WzorSlug, string> = {
  kamienica: `${fraunces.variable} ${manrope.variable}`,
  nokturn: `${cormorant.variable} ${jost.variable}`,
  siatka: `${spaceGrotesk.variable} ${interTight.variable}`,
  przystan: `${sora.variable} ${jakarta.variable}`,
  strategia: `${outfit.variable} ${karla.variable}`,
  beton: `${anton.variable} ${dmSans.variable}`,
  ogrod: `${lora.variable} ${nunito.variable}`,
  horyzont: `${unbounded.variable} ${figtree.variable}`,
};
