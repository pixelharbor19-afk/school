import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Segment {
  start_sec: number;
  end_sec: number;
}

interface Props {
  canPlay: boolean;
  currentTime: number;
  intro: Segment | null | undefined;
  outro: Segment | null | undefined;
  onSkip: (time: number) => void;
  className?: string;
}

export function SkipSegment({
  canPlay,
  currentTime,
  intro,
  outro,
  onSkip,
  className,
}: Props) {
  const active =
    intro && currentTime >= intro.start_sec && currentTime < intro.end_sec
      ? { label: "Skip Intro", end: intro.end_sec }
      : outro && currentTime >= outro.start_sec && currentTime < outro.end_sec
        ? { label: "Skip Outro", end: outro.end_sec }
        : null;

  return (
    <AnimatePresence mode="wait">
      {canPlay && active && (
        <motion.button
          key={active.label}
          type="button"
          onClick={() => onSkip(active.end)}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "pointer-events-auto flex items-center gap-2",
            "rounded-lg border border-white/20",
            "bg-black/60 px-4 py-2",
            "text-sm font-medium text-white",
            "backdrop-blur-md",
            "shadow-lg shadow-black/20",
            "transition-all duration-200",
            "hover:bg-white/15 hover:border-white/30",
            "active:scale-95",
            "select-none",
            className,
          )}
        >
          <span>{active.label}</span>

          <ArrowRight className="size-4" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
