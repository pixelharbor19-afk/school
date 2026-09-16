"use client";

import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { AnimatePresence, motion } from "motion/react";
import { Anton, Audiowide } from "next/font/google";
import { cn } from "@/lib/utils";
import { ServerTypes, SourceStatus } from "../player_types/server-types";
import { Check, ChevronLeft, LoaderCircle, Minus, X } from "lucide-react";
import { useRouter } from "next/navigation";

const SWEEP_DURATION = 3.8;

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
});

const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
});

type Props = {
  servers: ServerTypes[];
  serverIndex: number;
  sourceIndex: number;
  sourceStatus: SourceStatus;
  //
  handleSourceSelect: (index: number) => void;
  handleServerSelect: (index: number) => void;

  //
  color: string;
  canPlay: boolean;
  branding: string;
  back: boolean;
};

export default function BrandLoadingScreen({
  servers,
  serverIndex,
  sourceIndex,
  sourceStatus,
  //
  handleSourceSelect,
  handleServerSelect,

  //
  color,
  canPlay,
  branding,
  back,
}: Props) {
  const BASE_GLOW = `0 0 6px ${color}99, 0 0 16px ${color}59`;
  const FLASH_GLOW = `0 0 8px ${color}cc, 0 0 20px ${color}66, 0 0 36px ${color}33`;
  //
  const server = servers[serverIndex];
  const text = getLoadingText(server, sourceStatus);

  const router = useRouter();
  return (
    <AnimatePresence>
      {!canPlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black z-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 60% 40%, var(--color-zinc-900), transparent 60%)",
          }}
        >
          {!back && (
            <button
              onClick={() => router.back()}
              className={cn(
                "absolute top-0 left-0 md:px-6 px-4 md:py-8 py-6 landscape:py-2 landscape:px-2",
              )}
            >
              <ChevronLeft
                className="md:size-8 size-6 text-foreground/80 hover:text-foreground cursor-pointer"
                strokeWidth={3}
              />
            </button>
          )}
          {/* Ambient glow */}

          <div className="relative flex flex-col items-center uppercase">
            {/* Logo */}
            <div
              className={cn(
                anton.className,
                "relative select-none text-[clamp(60px,10vw,120px)] leading-none tracking-widest",
                // "relative select-none lg:text-[120px] md:text-8xl sm:text-7xl text-6xl leading-none tracking-widest  ",
                // "relative select-none text-[60px] leading-none tracking-widest  md:text-[120px]  sm:text-[90px]",
              )}
            >
              {/* Base logo */}
              <span className="text-neutral-900">{branding}</span>

              {/* Color sweep */}
              <motion.span
                className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
                style={{
                  color: color,
                  textShadow: BASE_GLOW,
                }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: SWEEP_DURATION,
                  ease: "easeInOut",
                }}
              >
                {branding}
              </motion.span>

              {/* Scan line */}
              <motion.div
                className="pointer-events-none absolute top-0 h-full md:w-1 w-0.5"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 12px 4px ${color}e6`,
                }}
                initial={{ left: "0%", opacity: 1 }}
                animate={{ left: "100%", opacity: [1, 1, 0] }}
                transition={{
                  duration: SWEEP_DURATION,
                  ease: "easeInOut",
                  times: [0, 0.92, 1],
                }}
              />

              {/* Final glow flash */}
              <motion.span
                className="pointer-events-none absolute inset-0 whitespace-nowrap"
                style={{
                  color: color,
                }}
                initial={{
                  opacity: 0,
                  textShadow: BASE_GLOW,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  textShadow: [BASE_GLOW, FLASH_GLOW, BASE_GLOW],
                }}
                transition={{
                  delay: SWEEP_DURATION,
                  duration: 1.2,
                  times: [0, 0.5, 1],
                  ease: "easeOut",
                }}
              >
                {branding}
              </motion.span>
            </div>

            {/* Status */}
            <div className="md:mt-6 mt-5 md:h-4 h-2">
              <motion.p
                key={text}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "md:text-sm text-xs font-medium uppercase lg:tracking-widest md:tracking-wider tracking-wide text-neutral-500 text-center",
                  audiowide.className,
                )}
              >
                {text}
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                >
                  _
                </motion.span>
              </motion.p>
            </div>
          </div>
          {/* <span className="absolute bottom-[20%]">
            <span className="block scale-75 sm:scale-90 md:scale-100">
              <Tailspin size="42" stroke="8" speed="0.8" color={color} />
            </span>
          </span> */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "absolute bottom-0 w-full p-3 md:p-5 landscape:hidden",
            )}
          >
            <div className="mx-auto grid w-full max-w-5xl grid-cols-2 items-end gap-1.5 sm:grid-cols-4 md:gap-3">
              {servers.map((item, index) => {
                const isCurrentServer = serverIndex === index;

                return (
                  <motion.div
                    key={item.server}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.2,
                      ease: "easeOut",
                    }}
                    className="w-full"
                  >
                    {isCurrentServer && item.sources.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="mb-1 ml-1 flex flex-col gap-0.5 overflow-hidden md:mb-2 md:ml-4 md:gap-2"
                      >
                        {item.sources.map((source, sourceIdx) => {
                          const isCurrentSource =
                            isCurrentServer && sourceIndex === sourceIdx;

                          const status = isCurrentSource
                            ? sourceStatus
                            : source.status;

                          return (
                            <motion.button
                              key={`${source.link}-${sourceIdx}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                duration: 0.25,
                                delay: sourceIdx * 0.2,
                                ease: "easeOut",
                              }}
                              onClick={() => {
                                if (index !== serverIndex) {
                                  handleServerSelect(index);
                                  return;
                                }

                                handleSourceSelect(sourceIdx);
                              }}
                              disabled={source.status === "failed"}
                              style={
                                isCurrentSource
                                  ? {
                                      borderColor: color,
                                      background: `linear-gradient(to right, ${color}20, transparent)`,
                                    }
                                  : undefined
                              }
                              className={cn(
                                "w-full border-l px-2 py-1 text-left transition md:p-3",
                                !isCurrentSource && "border-white/10",
                                source.status === "failed" &&
                                  "cursor-not-allowed opacity-50",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  style={
                                    isCurrentSource
                                      ? {
                                          color,
                                          textShadow: BASE_GLOW,
                                        }
                                      : undefined
                                  }
                                  className={cn(
                                    "text-xs font-semibold md:text-base",
                                    source.status === "failed" &&
                                      "line-through",
                                  )}
                                >
                                  {source.resolution
                                    ? `${source.resolution}p`
                                    : ` Source ${sourceIdx + 1}`}
                                </span>

                                {/* Hide source status on mobile */}
                                <span
                                  className={cn(
                                    "text-xs font-medium capitalize md:block md:text-sm",
                                    status === "ready" && "text-green-400",
                                    status === "connecting" &&
                                      "animate-pulse text-white/80",
                                    status === "failed" && "text-red-400",
                                    status === "queue" && "text-white/40",
                                  )}
                                >
                                  {status}
                                  {status === "connecting" && "..."}
                                </span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}

                    <button
                      onClick={() => handleServerSelect(index)}
                      style={
                        isCurrentServer
                          ? {
                              borderColor: color,
                              background: `linear-gradient(to right, ${color}20, transparent)`,
                            }
                          : undefined
                      }
                      className={cn(
                        "flex w-full justify-between border-l-2 px-3 py-1.5 text-left transition md:p-4",
                        isCurrentServer
                          ? "opacity-100"
                          : "border-white/20 opacity-50",
                      )}
                    >
                      <div className="space-y-0.5 md:space-y-1">
                        <span
                          style={
                            isCurrentServer
                              ? {
                                  color,
                                  textShadow: BASE_GLOW,
                                }
                              : undefined
                          }
                          className={cn(
                            "text-xs font-semibold md:text-base",
                            item.status === "failed" &&
                              "line-through opacity-50",
                            audiowide.className,
                          )}
                        >
                          {item.name}
                        </span>

                        {/* Hide description on mobile */}
                        <div className="hidden text-sm text-white/50 md:mt-1 md:block">
                          {item.message || item.desc}
                        </div>
                      </div>

                      <span
                        style={
                          isCurrentServer &&
                          item.status !== "failed" &&
                          item.status !== "checking"
                            ? {
                                color,
                                filter: `drop-shadow(0 0 6px ${color})`,
                              }
                            : undefined
                        }
                        className={cn(
                          "flex items-center",
                          item.status === "available" &&
                            !isCurrentServer &&
                            "text-green-400",
                          item.status === "checking" &&
                            !isCurrentServer &&
                            "text-white/80",
                          item.status === "failed" && "text-red-400",
                          item.status === "queue" && "text-white/40",
                        )}
                      >
                        {item.status === "available" && (
                          <Check
                            className="size-4 md:size-4.5"
                            strokeWidth={3}
                          />
                        )}

                        {item.status === "checking" && (
                          <LoaderCircle
                            className="size-4 animate-spin md:size-4.5"
                            strokeWidth={3}
                          />
                        )}

                        {item.status === "failed" && (
                          <X className="size-4 md:size-4.5" strokeWidth={3} />
                        )}

                        {item.status === "queue" && (
                          <Minus
                            className="size-4 md:size-4.5"
                            strokeWidth={3}
                          />
                        )}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function getLoadingText(
  server: ServerTypes | undefined,
  sourceStatus: SourceStatus,
) {
  if (!server) {
    return "Preparing";
  }

  if (server.status === "queue") {
    return "Initializing";
  }

  if (server.status === "checking") {
    return `Checking ${server.name}`;
  }

  if (server.status === "failed") {
    return "Trying another server";
  }

  if (sourceStatus === "queue") {
    return "Preparing source";
  }

  if (sourceStatus === "connecting") {
    return `Connecting to ${server.name}`;
  }

  if (sourceStatus === "failed") {
    return "Trying another source";
  }

  return server.message || "Loading";
}
