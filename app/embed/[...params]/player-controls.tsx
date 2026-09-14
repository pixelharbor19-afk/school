"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  Maximize,
  Pause,
  Play,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/hooks/utils";
import { Poppins } from "next/font/google";
import { IntroType } from "@/hooks/intro";
import { useState } from "react";
import SubtitleModal from "./player_components/modal-subtitle";
import { MediaOption } from "@/hooks/open-subtitle";
import ModalSettings from "./player_components/modal-settings";
import ServerModal from "./player_components/modal-server";
import { ServerTypes, SourceStatus } from "./player_types/server-types";
import { usePlayerSettings } from "./player_store/settings";
import { useRouter } from "next/navigation";
import QualityModal from "./player_components/modal-quality";
import EpisodesModal from "./player_components/modal-episodes";
import { SeasonsType } from "@/types/tmdb-types";
import { DubTypes } from "@/hooks/source";
import ModalDubs from "./player_components/modal-dubs";
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
  title: string;
  media_type: string;

  intro: IntroType | null;
  outro: IntroType | null;
  canNext: boolean;
  onNext: () => void;
  //
  playerRef: React.RefObject<HTMLDivElement | null>;
  //
  subtitles: MediaOption[];
  openSubtitleData: MediaOption[];
  selectedSubtitle?: MediaOption;
  onSubtitleChange: (subtitle: MediaOption | null) => void;
  //
  servers: ServerTypes[];
  serverIndex: number;
  sourceIndex: number;
  sourceStatus: SourceStatus;
  handleServerSelect: (index: number) => void;
  handleSourceSelect: (index: number) => void;
  setSourceStatus: (status: SourceStatus) => void;
  back: boolean;
  //
  seasons: SeasonsType[];

  dubs: DubTypes[];
  selectedDub?: DubTypes;
  onDubChange: (dub: DubTypes) => void;
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
  title,
  media_type,

  intro,
  outro,

  canNext,
  onNext,
  //
  playerRef,
  //
  subtitles,
  openSubtitleData,
  selectedSubtitle,
  onSubtitleChange,

  //
  servers,
  serverIndex,
  sourceIndex,
  sourceStatus,

  handleServerSelect,
  handleSourceSelect,
  setSourceStatus,
  //
  back,
  //
  seasons,
  //
  dubs,
  selectedDub,
  onDubChange,
}: Props) {
  const router = useRouter();
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const { aspectRatio, setAspectRatio, quality, qualities, setQuality } =
    usePlayerSettings();

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
            className="md:px-6 px-4 md:py-8 py-6 landscape:py-2 landscape:px-2 pointer-events-auto flex items-center md:gap-8 gap-6"
            onPointerMove={lockTimer}
            onPointerDown={lockTimer}
            // onMouseLeave={!isMobile ? resetTimer : undefined}
          >
            {!back && (
              <button
                onClick={() => router.back()}
                className={cn(
                  "flex items-center md:gap-6 gap-3",
                  "text-shadow-lg transition-opacity hover:opacity-70",
                )}
              >
                <ChevronLeft
                  className="md:size-8 size-6 text-foreground/80 hover:text-foreground cursor-pointer"
                  strokeWidth={3}
                />
                <span className="text-left">
                  <h1 className="tracking-wide font-medium md:text-base text-sm line-clamp-1">
                    {title}
                  </h1>
                </span>
              </button>
            )}

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
            {media_type === "tv" && (
              <EpisodesModal
                color={color}
                seasons={seasons}
                playerRef={playerRef}
                canPlay={canPlay}
                resetTimer={resetTimer}
              />
            )}

            <ServerModal
              servers={servers}
              serverIndex={serverIndex}
              sourceIndex={sourceIndex}
              sourceStatus={sourceStatus}
              handleServerSelect={handleServerSelect}
              handleSourceSelect={handleSourceSelect}
              canPlay={canPlay}
              playerRef={playerRef}
              resetTimer={resetTimer}
            />
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
            className="md:px-6 px-4 md:py-8 py-6 landscape:py-2 landscape:px-2 pointer-events-auto flex flex-col items-center md:gap-6 gap-3 landscape:gap-1.5"
            onPointerMove={lockTimer}
            onPointerDown={lockTimer}
          >
            {/* Progress */}
            <div className="w-full">
              <div className="group flex items-center gap-3 px-1 w-full">
                <div
                  ref={progressRef}
                  className="relative h-6 flex-1 cursor-pointer touch-none "
                  onPointerDown={handleSeekStart}
                  onPointerMove={handleSeekMove}
                  onPointerUp={commitSeek}
                  onPointerCancel={commitSeek}
                  onMouseMove={(e) => {
                    if (!duration) return;

                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(
                      0,
                      Math.min(e.clientX - rect.left, rect.width),
                    );
                    const time = (x / rect.width) * duration;

                    setHoverX(x);
                    setHoverTime(time);
                  }}
                  onMouseLeave={() => {
                    setHoverTime(null);
                  }}
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
                        <div className="rounded-sm bg-black/50 px-2 py-1 text-sm tabular-nums text-white shadow-lg">
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
                          className={cn(
                            "relative h-full bg-white/20",
                            intro && intro.start_sec > 0
                              ? "rounded-r-[1px]"
                              : "rounded-l-full rounded-r-[1px]",
                          )}
                          style={{
                            width: `${((intro.end_sec - intro.start_sec) / duration) * 100}%`,
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
                                    intro.start_sec) /
                                    (intro.end_sec - intro.start_sec)) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />

                          {/* Played */}
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0",
                              intro && intro.start_sec > 0
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
                          "relative h-full  bg-white/20",
                          !intro ? "rounded-full" : "rounded-[1px]",
                        )}
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
                          {/* Buffered */}
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

                          {/* Played */}
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

              <div
                className={cn(
                  "sm:hidden flex items-center gap-2 w-full justify-between tabular-nums font-medium text-xs tracking-wide p-1",
                )}
              >
                <span className="text-foreground/80">
                  {formatTime(currentTime)}
                </span>

                <span className="text-foreground/80">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-8 landscape:gap-4 w-full ">
              {/* Play */}
              <button
                onClick={togglePlay}
                className={cn(
                  "cursor-pointer text-foreground/90 hover:text-foreground shadow-2xl",
                )}
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
              {media_type === "tv" && canNext && (
                <button
                  onClick={onNext}
                  disabled={!canNext}
                  className={cn(
                    "cursor-pointer text-foreground/90 hover:text-foreground shadow-2xl",
                  )}
                >
                  <SkipForward className="md:size-7 size-6 fill-current" />
                </button>
              )}
              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={cn(
                    "cursor-pointer text-foreground/90 hover:text-foreground shadow-2xl",
                  )}
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="md:size-8 size-6" strokeWidth={2.5} />
                  ) : (
                    <Volume2 className="md:size-8 size-6" strokeWidth={2.5} />
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
                  "sm:flex hidden items-center gap-2 tabular-nums font-medium text-sm tracking-wide landscape:text-xs",
                )}
              >
                <span className="text-foreground/90">
                  {formatTime(currentTime)}
                </span>
                <span className="text-foreground/60">/</span>
                <span className="text-foreground/90">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Time */}
              <div className="flex-1 sm:block hidden" />

              {/* <button
                onClick={() => {
                  const values = ["contain", "cover", "fill"] as const;
                  const index = values.indexOf(aspectRatio);

                  setAspectRatio(values[(index + 1) % values.length]);
                }}
                className={cn(
                  "md:flex hidden items-center gap-2",
                  "transition-opacity hover:opacity-70",
                  "cursor-pointer",
                )}
              >
              
                <h1 className="text-sm font-medium tracking-wide text-white/90 hidden md:block">
                  {aspectRatio === "contain"
                    ? "Fit"
                    : aspectRatio === "cover"
                      ? "Crop"
                      : "Fill"}
                </h1>
              </button> */}

              {/* Quality */}

              {/* <button
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
              </button> */}
              <ModalDubs
                playerRef={playerRef}
                dubs={dubs ?? []}
                selectedDub={selectedDub}
                onDubChange={onDubChange}
                canPlay={canPlay}
                resetTimer={resetTimer}
              />
              <SubtitleModal
                playerRef={playerRef}
                subtitles={subtitles ?? []}
                openSubtitleData={openSubtitleData ?? []}
                selectedSubtitle={selectedSubtitle}
                onSubtitleChange={onSubtitleChange}
                canPlay={canPlay}
                resetTimer={resetTimer}
              />
              {/* <button
                onClick={() => {
                  const values: (number | "auto")[] = ["auto", ...qualities];
                  const index = values.indexOf(quality);

                  setQuality(values[(index + 1) % values.length]);
                }}
                className={cn(
                  "md:flex hidden items-center gap-2",
                  "transition-opacity hover:opacity-70",
                )}
              >
                <h1 className="text-sm tracking-wide hidden md:block">
                  {quality === "auto" ? "Auto" : `${quality}p`}
                </h1>
              </button> */}

              <QualityModal
                canPlay={canPlay}
                playerRef={playerRef}
                resetTimer={resetTimer}
              />
              {/* Fullscreen */}
              <ModalSettings
                canPlay={canPlay}
                playerRef={playerRef}
                subtitles={subtitles}
                openSubtitleData={openSubtitleData}
                selectedSubtitle={selectedSubtitle}
                onSubtitleChange={onSubtitleChange}
                dubs={dubs}
                selectedDub={selectedDub}
                onDubChange={onDubChange}
              />

              <button
                onClick={toggleFullscreen}
                type="button"
                className={cn(
                  "cursor-pointer text-foreground/90 hover:text-foreground shadow-2xl",
                )}
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
