import { TmdbDetailsResponse } from "@/types/tmdb-types";
import { AnimatePresence, motion } from "motion/react";
import { Star } from "lucide-react";
import { Lexend, Permanent_Marker } from "next/font/google";
import { cn } from "@/lib/utils";

const poppins = Lexend({
  weight: "400",
  subsets: ["latin"],
});
const font2 = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
});
export default function Pause({
  metadata,
  playing,
  isVisible,
  canPlay,
}: {
  metadata: TmdbDetailsResponse | undefined;
  playing: boolean;
  isVisible: boolean;
  canPlay: boolean;
}) {
  return (
    <AnimatePresence>
      {metadata && !playing && !isVisible && canPlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "absolute inset-0 z-20 flex items-center bg-black/70 backdrop-blur-[2px] pointer-events-none select-none",
            poppins.className,
          )}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="w-full max-w-3xl px-8 sm:px-12 lg:px-16"
          >
            {/* Paused indicator */}
            <div className="mb-5 flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-white/60">
              <span>PAUSED</span>
            </div>

            {/* Title */}
            <h1
              className={cn(
                "text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-6xl text-shadow-2xl",
                font2.className,
              )}
            >
              {metadata.title}
            </h1>

            {/* Tagline */}
            {metadata.tagline && (
              <p className="mt-2 text-base italic text-white/60 sm:text-lg">
                {metadata.tagline}
              </p>
            )}

            {/* Metadata */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
              {metadata.release_date && (
                <span>{metadata.release_date.slice(0, 4)}</span>
              )}

              {metadata.runtime > 0 && (
                <>
                  <span className="text-white/30">•</span>
                  <span>{metadata.runtime} min</span>
                </>
              )}

              {metadata.rating > 0 && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {metadata.rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>

            {/* Genres */}
            {metadata.genres?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {metadata.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre.id}
                    className={cn(
                      "rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70",
                    )}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {metadata.overview && (
              <p
                className={cn(
                  "mt-5 line-clamp-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base",
                )}
              >
                {metadata.overview}
              </p>
            )}
            <div className="h-px w-16 bg-white/40 mt-6" />
            {/* Resume hint */}
            <div className="mt-8 flex items-center gap-2 text-base text-white/50">
              <span>Press space to continue watching</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
