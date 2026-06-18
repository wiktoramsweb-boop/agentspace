"use client";

import { motion } from "motion/react";

type TimelineItem = {
  period: string;
  title: string;
  body: string;
};

/**
 * Animowany timeline pionowy z gradient line po lewej i kropkami.
 * Każdy item fade-in po wjechaniu w viewport.
 */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="relative">
      {/* Gradient line po lewej */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/60 via-zinc-700 to-zinc-900 md:left-[19px]" />

      <div className="space-y-10">
        {items.map((item, index) => (
          <motion.div
            key={item.period}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.6,
              delay: index * 0.08,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="relative flex gap-6 pl-12 md:gap-8 md:pl-14"
          >
            {/* Kropka na linii */}
            <div className="absolute left-0 top-1.5">
              <div className="relative flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md" />
                <div className="relative flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 md:h-4 md:w-4">
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-40" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className="mb-2 inline-block rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-medium text-emerald-300">
                {item.period}
              </p>
              <h3 className="mb-2 text-lg font-semibold text-white md:text-xl">{item.title}</h3>
              <p className="leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
