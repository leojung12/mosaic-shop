"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

// 아래에서 살짝 떠오르며 나타나기. order로 순서대로 시간차를 준다.
export default function Reveal({
  children,
  order = 0,
  className,
}: {
  children: ReactNode;
  order?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + order * 0.06, duration: 0.8, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
