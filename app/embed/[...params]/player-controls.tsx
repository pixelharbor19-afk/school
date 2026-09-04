"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Captions,
  ChevronLeft,
  Cloud,
  Gauge,
  Maximize,
  Pause,
  Play,
  SkipForward,
  SquareDimensions,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/hooks/utils";
import { Poppins } from "next/font/google";
import { IntroType } from "@/hooks/intro";
const font = Poppins({
  weight: "400",
  subsets: ["latin"],
});

type Props = {
  isMobile: boolean;
  color: string;
  playing: boolean;
  bufferedProgress: number;
  canPlay: boolean;
  waiting: boolean;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  progress: number;
  progressRef: React.RefObject<HTMLDivElement | null>;
  togglePlay: () => void;
  toggleMute: () => void;
  handleVolume: (value: number) => void;
  handleSeekStart: (e: React.PointerEvent<HTMLDivElement>) => void;
  handleSeekMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  commitSeek: () => void;
  toggleFullscreen: () => Promise<void>;
  formatTime: (time: number) => string;
  isVisible: boolean;
  resetTimer: () => void;
  lockTimer: () => void;
  playbackRate: number;
  handlePlaybackRate: (rate: number) => void;
  aspectRatio: "contain" | "cover" | "fill";
  toggleAspectRatio: () => void;
  title: string;
  setSubtitlesModal: (enabled: boolean) => void;
  showServer: boolean;
  setShowServer: React.Dispatch<React.SetStateAction<boolean>>;
  intro: IntroType | null;
  outro: IntroType | null;
  canNext: boolean;
  onNext: () => void;
};

export default function VideoControls({
  isMobile,
  color,
  playing,
  bufferedProgress,
  canPlay,
  muted,
  volume,
  currentTime,
  duration,
  progress,
  progressRef,
  togglePlay,
  toggleMute,
  handleVolume,
  handleSeekStart,
  handleSeekMove,
  commitSeek,
  toggleFullscreen,
  formatTime,
  isVisible,
  resetTimer,
  lockTimer,
  playbackRate,
  handlePlaybackRate,
  aspectRatio,
  toggleAspectRatio,
  title,
  setSubtitlesModal,
  setShowServer,
  intro,
  outro,

  canNext,
  onNext,
}: Props) {
  return (
    <AnimatePresence>
      {canPlay && isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "absolute inset-0 pointer-events-none flex flex-col justify-between",
            "bg-linear-to-t from-black/80 via-transparent to-black/40 select-none",
            "z-30",
            font.className,
          )}
        >
          <motion.div
            initial={{ y: -30 }}
            animate={{ y: 0 }}
            exit={{ y: -30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="px-6 py-8 pointer-events-auto flex items-center gap-8"
            onMouseEnter={!isMobile ? lockTimer : undefined}
            onMouseLeave={!isMobile ? resetTimer : undefined}
          >
            <button
              className={cn(
                "flex items-center md:gap-6 gap-3",
                "text-shadow-lg transition-opacity hover:opacity-70",
              )}
            >
              <ChevronLeft className="md:size-8 size-6" />
              {/* <span className="text-left">
                <h3 className="text-sm text-white/80">You're Watching</h3>
                <h1 className="md:text-xl text-sm tracking-wide font-semibold">
                  {title}
                </h1>
              </span> */}
            </button>

            <div className="flex-1" />

            {/* <button
              className={cn(
                "flex flex-col items-center gap-1",
                "text-shadow-lg transition-opacity hover:opacity-70",
              )}
            >
              <Settings className="md:size-7 size-6" />
              <h1 className="text-sm tracking-wide text-white/80">Settings</h1>
            </button> */}

            <button
              onClick={() => setShowServer(true)}
              className={cn(
                "flex flex-col items-center gap-1",
                "text-shadow-lg transition-opacity hover:opacity-70",
              )}
            >
              <Cloud className="md:size-7 size-6 fill-current" />
              {/* <h1 className="text-sm tracking-wide text-white/80 hidden md:block">
                Servers
              </h1> */}
            </button>
          </motion.div>

          {/* <div className="p-4">
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-3 transition-opacity hover:opacity-70"
            >
              <Unlock className="md:size-7 size-6" strokeWidth={2.5} />
              <h1>Tap to Lock</h1>
            </button>
          </div> */}

          <motion.div
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            exit={{ y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="px-6 py-8 pointer-events-auto"
            onMouseEnter={!isMobile ? lockTimer : undefined}
            onMouseLeave={!isMobile ? resetTimer : undefined}
          >
            {/* Progress */}
            <div className="group mb-6 flex w-full items-center gap-3 px-1">
              <div
                ref={progressRef}
                className="relative h-6 flex-1 cursor-pointer touch-none "
                onPointerDown={handleSeekStart}
                onPointerMove={handleSeekMove}
                onPointerUp={commitSeek}
                onPointerCancel={commitSeek}
              >
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
                        {/* Buffered */}
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

                        {/* Played */}
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
                        className="relative h-full rounded-[1px] bg-white/20"
                        style={{
                          width: `${((intro.end_sec - intro.start_sec) / duration) * 100}%`,
                        }}
                      >
                        {/* Buffered */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-[1px] bg-white/30"
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

                        {/* Played */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-[1px]"
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
                            backgroundColor: "orange",
                          }}
                        />
                      </div>
                    )}

                    {/* Main */}
                    <div
                      className="relative h-full rounded-[1px] bg-white/20 "
                      style={{
                        width: `${
                          (((outro?.start_sec ?? duration) -
                            (intro?.end_sec ?? 0)) /
                            duration) *
                          100
                        }%`,
                      }}
                    >
                      {/* Buffered */}
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

                      {/* Played */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-[1px]"
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
                        className="relative h-full rounded-[1px] bg-white/20"
                        style={{
                          width: `${((outro.end_sec - outro.start_sec) / duration) * 100}%`,
                        }}
                      >
                        {/* Buffered */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-white/30"
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

                        {/* Played */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-[1px]"
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
                            backgroundColor: "orange",
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
                        {/* Buffered */}
                        <div
                          className="absolute inset-y-0 left-0  rounded-full rounded-r-full bg-white/30"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                (((bufferedProgress / 100) * duration -
                                  outro.end_sec) /
                                  (duration - outro.end_sec)) *
                                  100,
                              ),
                            )}%`,
                          }}
                        />

                        {/* Played */}
                        <div
                          className="absolute inset-y-0 left-0  rounded-l-[1px] rounded-r-full"
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

                {/* Thumb */}
                <motion.div
                  className="group-hover:scale-130 transition-transform duration-150 absolute top-1/2 z-10 h-3.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-xs bg-white shadow-md"
                  animate={{ left: `${progress}%` }}
                  transition={{ duration: 0.05, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="flex items-center md:gap-8 gap-4 text-white">
              {/* Play */}
              <button
                onClick={togglePlay}
                className="transition-opacity hover:opacity-70"
              >
                {playing ? (
                  <Pause
                    className="md:size-7 size-6 fill-current"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Play
                    className="md:size-7 size-6 fill-current"
                    strokeWidth={2.5}
                  />
                )}
              </button>
              <button
                onClick={onNext}
                disabled={!canNext}
                className="transition-opacity hover:opacity-70 disabled:opacity-30"
              >
                <SkipForward className="md:size-7 size-6 fill-current" />
              </button>
              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="transition-opacity hover:opacity-70"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="md:size-7 size-6" />
                  ) : (
                    <Volume2 className="md:size-7 size-6" />
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step="0.01"
                  value={muted ? 0 : volume}
                  onChange={(e) => handleVolume(Number(e.target.value))}
                  className="h-1 w-20 cursor-pointer accent-white md:block hidden"
                />
              </div>

              <div
                className={cn(
                  "flex items-center gap-2 tabular-nums md:text-base text-xs",
                )}
              >
                <span className="text-white/80">{formatTime(currentTime)}</span>
                <span className="text-white/50">/</span>
                <span className="text-white/80">{formatTime(duration)}</span>
              </div>

              {/* Time */}
              <div className="flex-1" />

              <button
                onClick={toggleAspectRatio}
                className={cn(
                  "md:flex hidden items-center gap-2",
                  "transition-opacity hover:opacity-70",
                )}
              >
                <SquareDimensions className="md:size-7 size-6" />
                <h1 className="text-sm tracking-wide text-white/90 hidden md:block">
                  {aspectRatio === "contain"
                    ? "Fit"
                    : aspectRatio === "cover"
                      ? "Crop"
                      : "Fill"}
                </h1>
              </button>
              <button
                onClick={() => {
                  const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
                  const index = rates.indexOf(playbackRate);
                  handlePlaybackRate(rates[(index + 1) % rates.length]);
                }}
                className={cn(
                  "flex items-center gap-2",
                  "transition-opacity hover:opacity-70",
                )}
              >
                <Gauge className="md:size-7 size-6" />
                <h1 className="text-sm tracking-wide text-white/90 hidden md:block">
                  {playbackRate}x
                </h1>
              </button>

              <button
                onClick={() => setSubtitlesModal(true)}
                className={cn(
                  "flex items-center gap-2",
                  "transition-opacity hover:opacity-70",
                )}
              >
                <Captions className="md:size-7 size-6" />
                <h1 className="text-sm font-medium tracking-wide text-white/90 hidden md:block">
                  Language
                </h1>
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="transition-opacity hover:opacity-70"
              >
                <Maximize className="md:size-7 size-6" strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
