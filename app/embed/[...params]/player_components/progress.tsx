"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/hooks/utils";
import type { IntroType } from "@/hooks/intro";
import { useState } from "react";

type Props = {
  color: string;
  bufferedProgress: number;
  currentTime: number;
  duration: number;
  progress: number;
  progressRef: React.RefObject<HTMLDivElement | null>;
  intro: IntroType | null;
  outro: IntroType | null;
  formatTime: (time: number) => string;
  handleSeekStart: (e: React.PointerEvent<HTMLDivElement>) => void;
  handleSeekMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  commitSeek: () => void;
  lockTimer: () => void;
};

export default function PlayerProgress({
  color,
  bufferedProgress,
  currentTime,
  duration,
  progress,
  progressRef,
  intro,
  outro,
  formatTime,
  handleSeekStart,
  handleSeekMove,
  commitSeek,
  lockTimer,
}: Props) {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  return (
    <div className="group flex items-center gap-3 px-1 w-full pointer-events-auto">
      <div
        ref={progressRef}
        className="relative h-6 flex-1 cursor-pointer touch-none"
        onPointerDown={(e) => {
          lockTimer();
          handleSeekStart(e);
        }}
        onPointerMove={(e) => {
          lockTimer();
          handleSeekMove(e);
        }}
        onPointerUp={commitSeek}
        onPointerCancel={commitSeek}
        onMouseMove={(e) => {
          if (!duration) return;

          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

          setHoverX(x);
          setHoverTime((x / rect.width) * duration);
        }}
        onMouseLeave={() => setHoverTime(null)}
      >
        <AnimatePresence>
          {hoverTime !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="pointer-events-none absolute bottom-full z-50 mb-2 -translate-x-1/2"
              style={{ left: hoverX }}
            >
              <div className="rounded-sm bg-black/50 px-2 py-1 text-sm tabular-nums text-white shadow-lg font-sans">
                {formatTime(hoverTime)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {duration > 0 && (
          <div className="absolute inset-x-0 top-1/2 flex h-1.5 -translate-y-1/2 gap-0.5 md:gap-1 group-hover:scale-y-150 transition-transform duration-150">
            {/* Before intro */}
            {intro && intro.start_sec > 0 && (
              <div
                className="relative h-full rounded-l-full rounded-r-[1px] bg-white/20"
                style={{
                  width: `${(intro.start_sec / duration) * 100}%`,
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                  style={{
                    width: `${Math.min(
                      100,
                      (bufferedProgress / 100) *
                        (duration / intro.start_sec) *
                        100,
                    )}%`,
                  }}
                />

                <div
                  className="absolute inset-y-0 left-0 rounded-l-full rounded-r-[1px]"
                  style={{
                    width: `${Math.min(
                      100,
                      (currentTime / intro.start_sec) * 100,
                    )}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            )}

            {/* Intro */}
            {intro && (
              <div
                className={cn(
                  "relative h-full bg-white/20",
                  intro.start_sec > 0
                    ? "rounded-r-[1px]"
                    : "rounded-l-full rounded-r-[1px]",
                )}
                style={{
                  width: `${((intro.end_sec - intro.start_sec) / duration) * 100}%`,
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (((bufferedProgress / 100) * duration -
                          intro.start_sec) /
                          (intro.end_sec - intro.start_sec)) *
                          100,
                      ),
                    )}%`,
                  }}
                />

                <div
                  className={cn(
                    "absolute inset-y-0 left-0",
                    intro.start_sec > 0
                      ? "rounded-r-[1px]"
                      : "rounded-l-full rounded-r-[1px]",
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        ((currentTime - intro.start_sec) /
                          (intro.end_sec - intro.start_sec)) *
                          100,
                      ),
                    )}%`,
                    backgroundColor: "#facc15",
                  }}
                />
              </div>
            )}

            {/* Main */}
            <div
              className={cn(
                "relative h-full bg-white/20",
                !intro ? "rounded-full" : "rounded-[1px]",
              )}
              style={{
                width: `${
                  (((outro?.start_sec ?? duration) - (intro?.end_sec ?? 0)) /
                    duration) *
                  100
                }%`,
              }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (((bufferedProgress / 100) * duration -
                        (intro?.end_sec ?? 0)) /
                        ((outro?.start_sec ?? duration) -
                          (intro?.end_sec ?? 0))) *
                        100,
                    ),
                  )}%`,
                }}
              />

              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-[1px]",
                  !intro ? "rounded-full" : "rounded-[1px]",
                )}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      ((currentTime - (intro?.end_sec ?? 0)) /
                        ((outro?.start_sec ?? duration) -
                          (intro?.end_sec ?? 0))) *
                        100,
                    ),
                  )}%`,
                  backgroundColor: color,
                }}
              />
            </div>

            {/* Outro */}
            {outro && (
              <div
                className={cn(
                  "relative h-full bg-white/20",
                  outro.end_sec < duration
                    ? "rounded-[1px]"
                    : "rounded-l-[1px] rounded-r-full",
                )}
                style={{
                  width: `${((outro.end_sec - outro.start_sec) / duration) * 100}%`,
                }}
              >
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-white/30",
                    outro.end_sec < duration
                      ? "rounded-full"
                      : "rounded-l-full rounded-r-full",
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (((bufferedProgress / 100) * duration -
                          outro.start_sec) /
                          (outro.end_sec - outro.start_sec)) *
                          100,
                      ),
                    )}%`,
                  }}
                />

                <div
                  className={cn(
                    "absolute inset-y-0 left-0",
                    outro.end_sec < duration
                      ? "rounded-[1px]"
                      : "rounded-l-[1px] rounded-r-full",
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        ((currentTime - outro.start_sec) /
                          (outro.end_sec - outro.start_sec)) *
                          100,
                      ),
                    )}%`,
                    backgroundColor: "#f97316",
                  }}
                />
              </div>
            )}

            {/* After outro */}
            {outro && outro.end_sec < duration && (
              <div
                className="relative h-full rounded-l-[1px] rounded-r-full bg-white/20"
                style={{
                  width: `${((duration - outro.end_sec) / duration) * 100}%`,
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full rounded-r-full bg-white/30"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (((bufferedProgress / 100) * duration - outro.end_sec) /
                          (duration - outro.end_sec)) *
                          100,
                      ),
                    )}%`,
                  }}
                />

                <div
                  className="absolute inset-y-0 left-0 rounded-l-[1px] rounded-r-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        ((currentTime - outro.end_sec) /
                          (duration - outro.end_sec)) *
                          100,
                      ),
                    )}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            )}
          </div>
        )}

        <motion.div
          className="group-hover:scale-130 transition-transform duration-150 absolute top-1/2 z-10 h-3.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-xs bg-white shadow-md"
          animate={{ left: `${progress}%` }}
          transition={{ duration: 0.05, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
