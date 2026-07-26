"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  LINE_LOADING_PULSE_EASE,
  LOADING_LABEL_EXIT_S,
  LOADING_LABEL_EXIT_Y_PX,
} from "./line-loading-timing";

export function ChartLoadingLabel({
  text = "Loading",
  className,
  exiting = false
}) {
  if (!text.trim()) {
    return null;
  }

  return (
    <motion.div
      className={cn("pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-2 text-xs text-muted-foreground", className)}
      initial={{ opacity: 1, y: 0 }}
      animate={exiting ? { opacity: 0, y: LOADING_LABEL_EXIT_Y_PX } : { opacity: 1, y: 0 }}
      transition={{ duration: LOADING_LABEL_EXIT_S, ease: LINE_LOADING_PULSE_EASE }}
    >
      <span className="animate-pulse">{text}</span>
    </motion.div>
  );
}
