"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/hooks/utils";
import type { IntroType } from "@/hooks/intro";
import { useMemo, useState } from "react";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
type ThumbnailCue = {
  start: number;
  end: number;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function parseVttTime(time: string) {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function parseThumbnailVtt(vtt: string): ThumbnailCue[] {
  const lines = vtt.split(/\r?\n/);
  const cues: ThumbnailCue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const timing = lines[i]?.match(
      /^(\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}\.\d{3})$/,
    );

    if (!timing) continue;

    const image = lines[i + 1]?.trim();

    const match = image?.match(/^(.*?)#xywh=(\d+),(\d+),(\d+),(\d+)$/);

    if (!match) continue;

    cues.push({
      start: parseVttTime(timing[1]),
      end: parseVttTime(timing[2]),
      url: match[1],
      x: Number(match[2]),
      y: Number(match[3]),
      width: Number(match[4]),
      height: Number(match[5]),
    });
  }

  return cues;
}

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

  //
  thumbnailVtt?: string;
  thumbnailLoading: boolean;
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
  //
  thumbnailVtt,
  thumbnailLoading,
}: Props) {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const thumbnailCues = useMemo(
    () => (thumbnailVtt ? parseThumbnailVtt(thumbnailVtt) : []),
    [thumbnailVtt],
  );

  const thumbnail = useMemo(() => {
    if (hoverTime === null) return null;

    return (
      thumbnailCues.find(
        (cue) => hoverTime >= cue.start && hoverTime < cue.end,
      ) ?? null
    );
  }, [hoverTime, thumbnailCues]);
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
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 1 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute bottom-full z-50 mb-2 -translate-x-1/2"
              style={{ left: hoverX }}
            >
              <div className="flex flex-col items-center gap-1">
                {thumbnail && (
                  <div
                    className="relative hidden overflow-hidden rounded-sm bg-black shadow-lg md:block"
                    style={{
                      width: thumbnail.width,
                      height: thumbnail.height,
                    }}
                  >
                    {(!imageLoaded || thumbnailLoading) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Tailspin
                          size="40"
                          stroke="6"
                          speed="0.9"
                          color="white"
                        />
                      </div>
                    )}

                    <img
                      src={thumbnail.url}
                      alt=""
                      draggable={false}
                      onLoad={() => setImageLoaded(true)}
                      className={cn(
                        "absolute max-w-none",
                        !imageLoaded && "invisible",
                      )}
                      style={{
                        left: -thumbnail.x,
                        top: -thumbnail.y,
                      }}
                    />
                  </div>
                )}

                <div className="rounded-sm bg-black/70 px-2 py-1 text-sm tabular-nums text-white shadow-lg">
                  {formatTime(hoverTime)}
                </div>
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
