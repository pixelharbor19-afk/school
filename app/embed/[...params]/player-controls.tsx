"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { IoMdPause } from "react-icons/io";
import { cn } from "@/hooks/utils";
import { IntroType } from "@/hooks/intro";
import SubtitleModal from "./player_components/modal-subtitle";
import { MediaOption } from "@/hooks/open-subtitle";
import ModalSettings from "./player_components/modal-settings";
import ServerModal from "./player_components/modal-server";
import { ServerTypes, SourceStatus } from "./player_types/server-types";
import { useRouter } from "next/navigation";
import EpisodesModal from "./player_components/modal-episodes";
import { Genre, SeasonsType } from "@/types/tmdb-types";
import { DubTypes } from "@/hooks/gagosauce";
import ModalDubs from "./player_components/modal-dubs";
import {
  RiVolumeUpFill,
  RiVolumeMuteFill,
  RiPlayLargeFill,
  RiReplay15Fill,
  RiForward15Fill,
  RiSkipForwardFill,
  RiExpandDiagonalLine,
} from "react-icons/ri";
import PlayerButton from "./reusable_button";
import PlayerProgress from "./player_components/progress";
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
  genres: Genre[] | undefined;
  year: string;
  season: number;
  episode: number;

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
  skipBy: (skip: number) => void;
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
  genres,
  year,
  season,
  episode,

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
  skipBy,
}: Props) {
  const router = useRouter();

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
          )}
        >
          <motion.div
            initial={{ y: -30 }}
            animate={{ y: 0 }}
            exit={{ y: -30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:px-6 px-4 md:py-8 py-6 landscape:py-2 landscape:px-2  flex items-center md:gap-8 gap-6"

            // onMouseLeave={!isMobile ? resetTimer : undefined}
          >
            <div className="flex md:gap-4 gap-3 items-center">
              {!back && (
                <PlayerButton
                  icon={ChevronLeft}
                  onClick={() => router.back()}
                  label="Back"
                  onPointerMove={lockTimer}
                  onPointerDown={lockTimer}
                />
              )}
              <span
                className="h-9 w-px rounded-full md:hidden"
                style={{ backgroundColor: color }}
              />
              <div className="md:hidden">
                <h3 className="text-xs text-muted-foreground">
                  You're Watching
                </h3>
                <h1>
                  {title} {media_type === "tv" && `S${season}E${episode}`}
                </h1>
              </div>
            </div>
            <div className="flex-1" />

            {/* <button
              className={cn(
                "flex flex-col items-center gap-1",
                "text-shadow-lg transition-opacity hover:opacity-70",
              )}
            >
              <Settings className="md:size-10 size-6" />
              <h1 className="text-sm tracking-wide text-white/80">Settings</h1>
            </button> */}
            {media_type === "tv" && (
              <EpisodesModal
                color={color}
                seasons={seasons}
                playerRef={playerRef}
                canPlay={canPlay}
                resetTimer={resetTimer}
                lockTimer={lockTimer}
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
              lockTimer={lockTimer}
            />
            {/* <PlayerButton
              icon={RiShareForwardFill}
              onClick={() => router.back()}
              label="Share"
              onPointerMove={lockTimer}
              onPointerDown={lockTimer}
            /> */}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-12 "
          >
            <PlayerButton
              icon={RiReplay15Fill}
              onClick={() => skipBy(-15)}
              label="Backward 15s"
              onPointerMove={lockTimer}
              onPointerDown={lockTimer}
              className="md:hidden"
              iconClassName="size-9 "
            />
            <PlayerButton
              icon={playing ? IoMdPause : RiPlayLargeFill}
              onClick={togglePlay}
              label={playing ? "Pause" : "Play"}
              onPointerMove={lockTimer}
              onPointerDown={lockTimer}
              iconClassName="size-12 md:hidden"
            />
            <PlayerButton
              icon={RiForward15Fill}
              onClick={() => skipBy(15)}
              label="Forward 15s"
              onPointerMove={lockTimer}
              onPointerDown={lockTimer}
              className="md:hidden"
              iconClassName="size-9"
            />
          </motion.div>
          <motion.div
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            exit={{ y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:px-6 px-4 md:py-8 py-6 landscape:py-2 landscape:px-2  flex flex-col  md:gap-5 gap-3 landscape:gap-1.5"
            onPointerMove={lockTimer}
            onPointerDown={lockTimer}
          >
            <div className="hidden md:block md:px-1">
              <span className="flex gap-3 items-center">
                <span
                  className="h-4 w-0.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h3 className="lg:text-base md:text-sm text-xs text-gray-400">
                  You're Watching
                </h3>
              </span>

              <h1 className="mt-2 text-2xl font-bold tracking-tight lg:text-4xl">
                {title} {media_type === "tv" && `S${season}E${episode}`}
              </h1>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
                  {media_type === "tv" ? "Series" : "Movie"}
                </span>

                {genres?.slice(0, 1).map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300"
                  >
                    {genre.name}
                  </span>
                ))}

                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-300">
                  {year}
                </span>
              </div>
            </div>
            {/* Progress */}
            <div className="w-full flex flex-col md:flex-row  items-center md:p-1 md:gap-3">
              <span className="text-foreground/80 hidden md:block text-sm lg:text-base tabular-nums">
                {formatTime(currentTime)}
              </span>
              <PlayerProgress
                color={color}
                bufferedProgress={bufferedProgress}
                currentTime={currentTime}
                duration={duration}
                progress={progress}
                progressRef={progressRef}
                intro={intro}
                outro={outro}
                formatTime={formatTime}
                handleSeekStart={handleSeekStart}
                handleSeekMove={handleSeekMove}
                commitSeek={commitSeek}
                lockTimer={lockTimer}
              />

              <span className="text-foreground/80 hidden md:block text-sm lg:text-base tabular-nums">
                {formatTime(duration)}
              </span>
              <div className="flex justify-between w-full px-1 md:hidden">
                <span className="text-foreground/80 text-sm md:text-base">
                  {formatTime(currentTime)}
                </span>
                <span className="text-foreground/80 text-sm md:text-base">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-6   landscape:gap-4 w-full ">
              {/* Play */}
              <PlayerButton
                icon={playing ? IoMdPause : RiPlayLargeFill}
                onClick={togglePlay}
                label={playing ? "Pause" : "Play"}
                onPointerMove={lockTimer}
                onPointerDown={lockTimer}
                className="hidden md:block"
              />
              <PlayerButton
                icon={RiReplay15Fill}
                onClick={() => skipBy(-15)}
                className="hidden md:block"
                label="Backward 15s"
                onPointerMove={lockTimer}
                onPointerDown={lockTimer}
              />

              <PlayerButton
                icon={RiForward15Fill}
                onClick={() => skipBy(15)}
                className="hidden md:block"
                label="Forward 15s"
                onPointerMove={lockTimer}
                onPointerDown={lockTimer}
              />

              {media_type === "tv" && canNext && (
                <PlayerButton
                  icon={RiSkipForwardFill}
                  onClick={onNext}
                  disabled={!canNext}
                  className="hidden md:block"
                  label="Next Episode"
                  onPointerMove={lockTimer}
                  onPointerDown={lockTimer}
                />
              )}
              {/* Volume */}
              <div className="group flex items-center gap-2">
                <PlayerButton
                  icon={
                    muted || volume === 0 ? RiVolumeMuteFill : RiVolumeUpFill
                  }
                  onClick={toggleMute}
                  label="Volume"
                  onPointerMove={lockTimer}
                  onPointerDown={lockTimer}
                />

                <div
                  className="w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:w-25 group-hover:opacity-100 hidden md:block pointer-events-auto"
                  onPointerMove={lockTimer}
                  onPointerDown={lockTimer}
                >
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step="0.01"
                    value={muted ? 0 : volume}
                    onChange={(e) => handleVolume(Number(e.target.value))}
                    className="h-1.5 w-25 cursor-pointer accent-white"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="flex-1 md:block hidden" />

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
                <Gauge className="md:size-10 size-6" />
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
                lockTimer={lockTimer}
              />
              <SubtitleModal
                playerRef={playerRef}
                subtitles={subtitles ?? []}
                openSubtitleData={openSubtitleData ?? []}
                selectedSubtitle={selectedSubtitle}
                onSubtitleChange={onSubtitleChange}
                canPlay={canPlay}
                resetTimer={resetTimer}
                lockTimer={lockTimer}
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

              {/* <QualityModal
                canPlay={canPlay}
                playerRef={playerRef}
                resetTimer={resetTimer}
                lockTimer={lockTimer}
              /> */}
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
                lockTimer={lockTimer}
              />

              <PlayerButton
                icon={RiExpandDiagonalLine}
                onClick={toggleFullscreen}
                label="Fullscreen"
                onPointerMove={lockTimer}
                onPointerDown={lockTimer}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
