"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Keyboard } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import { LineWobble } from "ldrs/react";
import "ldrs/react/LineWobble.css";
import { AnimatePresence, motion } from "motion/react";
import { Audiowide } from "next/font/google";
import { Check, ChevronLeft, LoaderCircle, Minus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { TmdbDetailsResponse } from "@/types/tmdb-types";
import { ServerTypes, SourceStatus } from "../player_types/server-types";
import { getLoadingText } from "./loading-screen-branding";
import { useEffect, useRef, useState } from "react";

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
  back: boolean;
  metadata: TmdbDetailsResponse | undefined;
};

export default function BackdropLoadingScreenPicker({
  servers,
  serverIndex,
  sourceIndex,
  sourceStatus,
  handleSourceSelect,
  handleServerSelect,
  color,
  canPlay,
  branding,
  back,
  metadata,
}: Props) {
  const server = servers[serverIndex];
  const text = getLoadingText(server, sourceStatus);
  const router = useRouter();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const backdrop = metadata?.backdrop_paths;
  const logo = metadata?.logo_paths;
  const genres = metadata?.genres?.slice(0, 2).map((genre) => genre.name);
  const [backdropLoading, setBackdropLoading] = useState(true);
  const [logoLoading, setLogoLoading] = useState(true);

  const [visualIndex, setVisualIndex] = useState(serverIndex);

  useEffect(() => {
    if (!swiperRef.current) return;

    if (swiperRef.current.activeIndex !== serverIndex) {
      swiperRef.current.slideTo(serverIndex);
    }
  }, [serverIndex]);

  const BASE_GLOW = `0 0 6px ${color}99, 0 0 16px ${color}59`;
  const FLASH_GLOW = `0 0 8px ${color}cc, 0 0 20px ${color}66, 0 0 36px ${color}33`;
  return (
    <AnimatePresence>
      {canPlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-40 overflow-hidden bg-black"
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="flex-1 overflow-hidden h-full w-full mask-[radial-gradient(circle,black_45%,transparent_75%)]">
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: backdropLoading ? 0 : 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full w-full object-cover object-bottom"
                src={`https://image.tmdb.org/t/p/original/${backdrop}`}
                alt=""
                onLoad={() => setBackdropLoading(false)}
              />
            </div>

            <div className="absolute h-full w-full bg-linear-to-t from-black to-transparent backdrop-blur-2xl md:backdrop-blur-none" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: logoLoading ? 0 : 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute flex flex-col items-center justify-center gap-6 sm:bottom-10 bottom-4 z-10"
            >
              <img
                className="w-full max-w-3xs object-contain drop-shadow-2xl md:max-h-48 md:max-w-xl max-h-32"
                src={`https://image.tmdb.org/t/p/original/${logo}`}
                alt=""
                onLoad={() => setLogoLoading(false)}
              />

              {genres?.length ? (
                <div className="flex flex-wrap items-center justify-center gap-2 md:text-xs text-[0.6rem] font-medium tracking-[0.2rem] text-muted-foreground uppercase">
                  <span>{genres.join(" / ")}</span>
                </div>
              ) : null}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed inset-0 flex  md:justify-end justify-center items-end",
                "pointer-events-none",
                "bg-linear-to-l from-black/80 to-transparent",
              )}
            >
              <div className=" h-full  pointer-events-auto ">
                <Swiper
                  modules={[Mousewheel, Keyboard]}
                  direction="vertical"
                  slidesPerView="auto"
                  centeredSlides
                  className="h-full overflow-visible!"
                  wrapperClass="md:items-end! items-center!  "
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
                  // style={
                  //   {
                  //     "--swiper-wrapper-transition-timing-function":
                  //       "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  //   } as React.CSSProperties
                  // }
                  onSwiper={(swiper: SwiperInstance) => {
                    swiperRef.current = swiper;
                    swiper.slideTo(serverIndex, 0);
                  }}
                  onSlideChange={(swiper: SwiperInstance) => {
                    setVisualIndex(swiper.activeIndex);
                  }}
                >
                  {servers.map((item, index) => {
                    const isActive = index === visualIndex;
                    const distance = Math.abs(index - visualIndex);
                    const isNear = distance === 1;
                    const isThird = distance === 2;
                    const isFailed = item.status === "failed";

                    return (
                      <SwiperSlide
                        key={item.server}
                        className={cn(
                          "h-fit! w-fit! ",

                          isActive && "",

                          isNear && "",

                          !isActive && !isNear && "",
                        )}
                        onClick={() => handleServerSelect(index)}
                      >
                        <div
                          className={cn(
                            "transition-all duration-400 origin-right",
                            "md:py-8 py-6 px-4 md:text-right text-center",

                            isActive && "scale-110 md:-translate-x-20",

                            isNear &&
                              !isActive &&
                              "opacity-30 md:-translate-x-18",

                            isThird &&
                              !isActive &&
                              "md:opacity-30 md:-translate-x-15 opacity-0",

                            distance > 2 && "md:opacity-10 opacity-0",
                          )}
                        >
                          <div>
                            {/* Server name */}
                            <p
                              className={cn(
                                "md:text-2xl text-lg font-semibold ",

                                isActive && "",

                                isNear && !isActive && "",

                                !isActive && !isNear && "",

                                isFailed && "line-through",
                              )}
                              // style={
                              //   isActive
                              //     ? {
                              //         color,
                              //         textShadow: BASE_GLOW,
                              //       }
                              //     : undefined
                              // }
                            >
                              {item.name}
                            </p>
                            {/* Description */}
                            <p
                              className={cn(
                                "mt-0.5 text-xs md:text-base text-muted-foreground",
                              )}
                            >
                              {item.message || item.desc}
                            </p>
                          </div>
                          {/* Server status */}
                          <span
                            className={cn(
                              "flex items-center md:justify-end justify-center capitalize text-sm mt-2 md:gap-3 gap-1.5",
                              isActive &&
                                item.status !== "failed" &&
                                "text-foreground",

                              item.status === "available" && "text-green-400",

                              item.status === "checking" && "text-white/70",

                              item.status === "failed" && "text-red-400",

                              item.status === "queue" && "text-white/30",
                            )}
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
                                className="size-3 hidden md:block landscape:size-2.5"
                              />
                            )}

                            {item.status === "checking" && (
                              <LoaderCircle
                                strokeWidth={3}
                                className="size-3 hidden md:block animate-spin landscape:size-2.5"
                              />
                            )}

                            {item.status === "failed" && (
                              <X
                                strokeWidth={3}
                                className="size-3 hidden md:block landscape:size-2.5"
                              />
                            )}

                            {item.status === "queue" && (
                              <Minus
                                strokeWidth={3}
                                className="size-3 hidden md:block landscape:size-2.5"
                              />
                            )}
                          </span>

                          {/* Sources */}
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            </motion.div>
          </div>

          {!back && (
            <button
              onClick={() => router.back()}
              className="absolute top-0 left-0 px-4 py-6 md:px-6 md:py-8 landscape:px-2 landscape:py-2"
            >
              <ChevronLeft
                className="size-6 cursor-pointer text-foreground/80 hover:text-foreground md:size-8"
                strokeWidth={3}
              />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
