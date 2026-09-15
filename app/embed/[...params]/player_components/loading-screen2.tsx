"use client";

import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { AnimatePresence, motion } from "motion/react";
import { Anton, Audiowide } from "next/font/google";
import { cn } from "@/lib/utils";
import { ServerTypes, SourceStatus } from "../player_types/server-types";
import { Check, ChevronLeft, LoaderCircle, Minus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Keyboard } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import { useEffect, useRef } from "react";

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

  handleSourceSelect: (index: number) => void;
  handleServerSelect: (index: number) => void;

  color: string;
  canPlay: boolean;
  branding: string;
};

export default function LoadingScreen2({
  servers,
  serverIndex,
  sourceIndex,
  sourceStatus,
  handleSourceSelect,
  handleServerSelect,
  color,
  canPlay,
  branding,
}: Props) {
  const BASE_GLOW = `0 0 6px ${color}99, 0 0 16px ${color}59`;
  const FLASH_GLOW = `0 0 8px ${color}cc, 0 0 20px ${color}66, 0 0 36px ${color}33`;

  const server = servers[serverIndex];
  const text = getLoadingText(server, sourceStatus);

  const router = useRouter();

  const swiperRef = useRef<SwiperInstance | null>(null);

  useEffect(() => {
    if (!swiperRef.current) return;

    if (swiperRef.current.activeIndex !== serverIndex) {
      swiperRef.current.slideTo(serverIndex);
    }
  }, [serverIndex]);

  return (
    <AnimatePresence>
      {!canPlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 60% 40%, var(--color-zinc-900), transparent 60%)",
          }}
        >
          <button
            onClick={() => router.back()}
            className={cn(
              "absolute top-0 left-0",
              "md:px-6 px-4 md:py-8 py-6",
              "landscape:py-2 landscape:px-2",
            )}
          >
            <ChevronLeft
              className="md:size-8 size-6 cursor-pointer text-foreground/80 hover:text-foreground"
              strokeWidth={3}
            />
          </button>

          {/* Ambient glow */}

          <div className="relative flex flex-col items-center uppercase">
            {/* Logo */}
            <div
              className={cn(
                anton.className,
                "relative select-none text-[clamp(60px,10vw,120px)] leading-none tracking-widest",
              )}
            >
              {/* Base logo */}
              <span className="text-neutral-900">{branding}</span>

              {/* Color sweep */}
              <motion.span
                className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
                style={{
                  color,
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
                animate={{
                  left: "100%",
                  opacity: [1, 1, 0],
                }}
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
                  color,
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
                  "text-center font-medium uppercase text-neutral-500",
                  "md:text-sm text-xs",
                  "lg:tracking-widest md:tracking-wider tracking-wide",
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

          {/* Server picker */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "absolute inset-y-0 right-0 z-40 w-full",
              "pointer-events-none",
              "bg-linear-to-l from-black/60 lg:via-transparent to-transparent",
            )}
          >
            <Swiper
              modules={[Mousewheel, Keyboard]}
              direction="vertical"
              slidesPerView="auto"
              centeredSlides
              mousewheel={{
                sensitivity: 1,
                thresholdDelta: 10,
                forceToAxis: true,
              }}
              initialSlide={serverIndex}
              keyboard={{
                enabled: true,
                onlyInViewport: true,
              }}
              className="absolute right-0 h-full"
              style={
                {
                  "--swiper-wrapper-transition-timing-function":
                    "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                } as React.CSSProperties
              }
              onSwiper={(swiper: SwiperInstance) => {
                swiperRef.current = swiper;
                swiper.slideTo(serverIndex, 0);
              }}
              onSlideChange={(swiper: SwiperInstance) => {
                const index = swiper.activeIndex;

                if (index !== serverIndex) {
                  handleServerSelect(index);
                }
              }}
            >
              {servers.map((item, index) => {
                const isActive = index === serverIndex;
                const isNear = Math.abs(index - serverIndex) === 1;
                const isFailed = item.status === "failed";

                return (
                  <SwiperSlide
                    key={item.server}
                    className={cn(
                      "h-auto! w-fit! ml-auto",
                      "transition-all! duration-200",
                      "[text-shadow:0_2px_4px_rgba(0,0,0,0.5)]",
                      "pointer-events-auto cursor-pointer select-none",
                      "group text-end",
                      "lg:py-8 md:py-6 py-5 landscape:py-3",
                      "lg:px-8 px-2",

                      isActive &&
                        "lg:-translate-x-18 -translate-x-8 landscape:-translate-x-4",

                      isNear &&
                        "lg:-translate-x-10 -translate-x-4 landscape:-translate-x-2 opacity-80",

                      !isActive &&
                        !isNear &&
                        "lg:opacity-30 opacity-10 md:pointer-events-auto",
                    )}
                    onClick={() => handleServerSelect(index)}
                  >
                    {/* Server name */}
                    <p
                      className={cn(
                        "font-semibold transition-all duration-400",

                        isActive &&
                          "lg:text-3xl md:text-2xl text-lg landscape:text-xs",

                        isNear &&
                          !isActive &&
                          "lg:text-2xl md:text-xl text-base landscape:text-xs",

                        !isActive &&
                          !isNear &&
                          "lg:text-2xl md:text-xl text-sm landscape:text-[0.5rem]",

                        isFailed && "line-through",
                      )}
                      style={
                        isActive
                          ? {
                              color,
                              textShadow: BASE_GLOW,
                            }
                          : undefined
                      }
                    >
                      {item.name}
                    </p>

                    {/* Description */}
                    <p
                      className={cn(
                        "font-medium text-gray-300",
                        "lg:mt-1",
                        "lg:text-base text-sm landscape:text-[0.6rem]",
                      )}
                    >
                      {item.message || item.desc}
                    </p>

                    {/* Server status */}
                    <span
                      className={cn(
                        "flex items-center justify-end gap-2",
                        "capitalize font-medium",
                        "lg:text-base text-xs landscape:text-[0.6rem]",
                        "lg:mt-3 mt-1.5 landscape:mt-0.5",

                        isActive &&
                          item.status !== "failed" &&
                          "text-foreground",

                        !isActive &&
                          item.status === "available" &&
                          "text-green-400",

                        !isActive &&
                          item.status === "checking" &&
                          "text-white/70",

                        item.status === "failed" && "text-red-400",

                        item.status === "queue" && "text-white/30",
                      )}
                      style={
                        isActive && item.status !== "failed"
                          ? {
                              color,
                              textShadow: BASE_GLOW,
                            }
                          : undefined
                      }
                    >
                      <span>
                        {item.status === "available" && "available"}

                        {item.status === "checking" && "checking..."}

                        {item.status === "queue" && "queue"}

                        {item.status === "failed" && "No video found"}
                      </span>

                      {item.status === "available" && (
                        <Check
                          strokeWidth={3}
                          className="size-4 landscape:size-2.5"
                        />
                      )}

                      {item.status === "checking" && (
                        <LoaderCircle
                          strokeWidth={3}
                          className="size-4 animate-spin landscape:size-2.5"
                        />
                      )}

                      {item.status === "failed" && (
                        <X
                          strokeWidth={3}
                          className="size-4 landscape:size-2.5"
                        />
                      )}

                      {item.status === "queue" && (
                        <Minus
                          strokeWidth={3}
                          className="size-4 landscape:size-2.5"
                        />
                      )}
                    </span>

                    {/* Sources */}
                    <AnimatePresence initial={false}>
                      {isActive && item.sources.length > 0 && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0,
                            y: -10,
                          }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            height: 0,
                            y: -10,
                          }}
                          transition={{
                            duration: 0.25,
                            ease: "easeOut",
                          }}
                          className={cn(
                            "mt-3 flex flex-col items-end",
                            "gap-1.5 overflow-hidden",
                            "pointer-events-auto",
                          )}
                        >
                          {item.sources.map((source, sourceIdx) => {
                            const isCurrentSource = sourceIdx === sourceIndex;

                            const status = isCurrentSource
                              ? sourceStatus
                              : source.status;

                            const isSourceFailed = source.status === "failed";

                            return (
                              <motion.button
                                key={`${source.link}-${sourceIdx}`}
                                type="button"
                                initial={{
                                  opacity: 0,
                                  x: 10,
                                }}
                                animate={{
                                  opacity: 1,
                                  x: 0,
                                }}
                                transition={{
                                  duration: 0.2,
                                  delay: sourceIdx * 0.05,
                                }}
                                disabled={isSourceFailed}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSourceSelect(sourceIdx);
                                }}
                                className={cn(
                                  "flex items-center gap-2",
                                  "font-semibold transition",
                                  "text-sm landscape:text-[0.6rem]",
                                  "pointer-events-auto",

                                  isCurrentSource && "scale-105",

                                  isSourceFailed &&
                                    "cursor-not-allowed opacity-40 line-through",

                                  !isCurrentSource &&
                                    !isSourceFailed &&
                                    "text-white/50 hover:text-white",
                                )}
                                style={
                                  isCurrentSource && !isSourceFailed
                                    ? {
                                        color,
                                        textShadow: BASE_GLOW,
                                      }
                                    : undefined
                                }
                              >
                                <span>
                                  {source.resolution
                                    ? `${source.resolution}p`
                                    : source.type.toUpperCase()}
                                </span>

                                {status === "ready" && (
                                  <Check
                                    className="size-3.5 landscape:size-2"
                                    strokeWidth={3}
                                  />
                                )}

                                {status === "connecting" && (
                                  <LoaderCircle
                                    className="size-3.5 animate-spin landscape:size-2"
                                    strokeWidth={3}
                                  />
                                )}

                                {status === "failed" && (
                                  <X
                                    className="size-3.5 landscape:size-2"
                                    strokeWidth={3}
                                  />
                                )}

                                {status === "queue" && (
                                  <Minus
                                    className="size-3.5 landscape:size-2"
                                    strokeWidth={3}
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </motion.div>

          {/* Optional loading spinner */}
          {/* <span className="absolute bottom-[20%]">
            <span className="block scale-75 sm:scale-90 md:scale-100">
              <Tailspin size="42" stroke="8" speed="0.8" color={color} />
            </span>
          </span> */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getLoadingText(
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
