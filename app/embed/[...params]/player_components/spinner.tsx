import { AnimatePresence, motion } from "motion/react";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";

interface SpinnerProps {
  waiting: boolean;
  canPlay: boolean;
}

export default function Spinner({ waiting, canPlay }: SpinnerProps) {
  return (
    <AnimatePresence>
      {waiting && canPlay && (
        <motion.div
          className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.2 }}
        >
          <span className="block md:hidden">
            <Tailspin size="45" stroke="8" speed="0.9" color="white" />
          </span>

          <span className="hidden md:block">
            <Tailspin size="60" stroke="8" speed="0.9" color="white" />
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
