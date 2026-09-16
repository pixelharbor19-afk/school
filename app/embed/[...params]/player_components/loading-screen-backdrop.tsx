"use client";

import { LineWobble } from "ldrs/react";
import "ldrs/react/LineWobble.css";
import { AnimatePresence, motion } from "motion/react";
import { Audiowide } from "next/font/google";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { TmdbDetailsResponse } from "@/types/tmdb-types";
import { ServerTypes, SourceStatus } from "../player_types/server-types";
import { getLoadingText } from "./loading-screen-branding";
import { useState } from "react";

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
  back: boolean;
  metadata: TmdbDetailsResponse | undefined;
};

export default function BackdropLoadingScreen({
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

  const backdrop = metadata?.backdrop_paths;
  const logo = metadata?.logo_paths;
  const genres = metadata?.genres?.slice(0, 2).map((genre) => genre.name);
  const [backdropLoading, setBackdropLoading] = useState(true);
  const [logoLoading, setLogoLoading] = useState(true);
  return (
    <AnimatePresence>
      {!canPlay && (
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
                className="h-full w-full object-cover"
                src={`https://image.tmdb.org/t/p/w780/${backdrop}`}
                alt=""
                onLoad={() => setBackdropLoading(false)}
              />
            </div>

            <div className="absolute h-full w-full bg-black/60 backdrop-blur-lg" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: logoLoading ? 0 : 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute flex flex-col items-center justify-center gap-6"
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

              <div className="flex flex-col items-center justify-center md:gap-3 gap-1">
                <motion.p
                  key={text}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "text-center text-xs font-medium tracking-wide text-shadow-2xs uppercase md:text-sm md:tracking-wide",
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

                <span className="block md:hidden">
                  <LineWobble
                    size="200"
                    stroke="3"
                    bgOpacity="0.2"
                    speed="1.5"
                    color="white"
                  />
                </span>

                <span className="hidden md:block">
                  <LineWobble
                    size="300"
                    stroke="5"
                    bgOpacity="0.2"
                    speed="1.5"
                    color="white"
                  />
                </span>
                <div className="mt-1 flex items-center gap-2 tracking-wide text-sm md:text-base">
                  <span>{server?.name || "SERVER"}</span>
                  <span className="text-white/20">/</span>
                  <span>Source {String(sourceIndex + 1).padStart(2, "0")}</span>
                </div>
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
