"use client";

import { motion } from "motion/react";

type Category = string;

/**
 * "Wizualne zdjęcie" dla karty bloga — animowany gradient + abstract elements
 * dobrane do kategorii artykułu. Bez prawdziwych zdjęć, czyste motion-art.
 */
export function BlogVisual({ category }: { category: Category }) {
  const variants = getVariantsForCategory(category);

  return (
    <div className="relative h-48 w-full overflow-hidden">
      {/* Tło gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: variants.background,
        }}
      />

      {/* Animowane bloby — różne pozycje per slug */}
      <motion.div
        className="absolute h-32 w-32 rounded-full blur-2xl"
        style={{ background: variants.blob1, top: "10%", left: "20%" }}
        animate={{
          x: [0, 30, -10, 0],
          y: [0, -20, 10, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-24 w-24 rounded-full blur-xl"
        style={{ background: variants.blob2, top: "50%", right: "10%" }}
        animate={{
          x: [0, -20, 15, 0],
          y: [0, 15, -10, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Ikona kategorii */}
      <div className="absolute bottom-4 right-4 opacity-30">
        {variants.icon}
      </div>

      {/* Dolna maska — fade do koloru karty */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-900/30 to-transparent" />
    </div>
  );
}

type Variant = {
  background: string;
  blob1: string;
  blob2: string;
  icon: React.ReactNode;
};

function getVariantsForCategory(category: string): Variant {
  // Domyślnie emerald
  const base: Variant = {
    background:
      "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(8, 145, 178, 0.05) 100%)",
    blob1: "rgba(16, 185, 129, 0.35)",
    blob2: "rgba(34, 211, 238, 0.25)",
    icon: <BookIcon />,
  };

  if (category.toLowerCase().includes("sprzeda")) {
    return {
      ...base,
      background:
        "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)",
      blob1: "rgba(168, 85, 247, 0.35)",
      blob2: "rgba(236, 72, 153, 0.25)",
      icon: <ChatIcon />,
    };
  }

  if (category.toLowerCase().includes("trend") || category.toLowerCase().includes("narzędzia")) {
    return {
      ...base,
      background:
        "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)",
      blob1: "rgba(245, 158, 11, 0.35)",
      blob2: "rgba(239, 68, 68, 0.2)",
      icon: <SparklesIcon />,
    };
  }

  return base;
}

function BookIcon() {
  return (
    <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

