import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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
      ? { label: "Skip Intro", start: intro.start_sec, end: intro.end_sec }
      : outro && currentTime >= outro.start_sec && currentTime < outro.end_sec
        ? { label: "Skip Outro", start: outro.start_sec, end: outro.end_sec }
        : null;

  const progress = active
    ? Math.min(
        100,
        Math.max(
          0,
          ((currentTime - active.start) / (active.end - active.start)) * 100,
        ),
      )
    : 0;

  return (
    <AnimatePresence mode="wait">
      {canPlay && active && (
        <motion.div
          key={active.label}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={className}
        >
          <Button
            type="button"
            onClick={() => onSkip(active.end)}
            variant="outline"
            size="lg"
            className=" pointer-events-auto relative cursor-pointer select-none overflow-hidden border-none hover:scale-105"
          >
            {/* Filling background */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-foreground/20 backdrop-blur-2xl"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />

            {/* Content */}
            <span className="relative z-10">{active.label}</span>
            <ArrowRight className="relative z-10 size-4" strokeWidth={2.5} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
