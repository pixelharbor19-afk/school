"use client";

import { Button } from "@/components/ui/button";
import { useTvEpisode } from "@/hooks/fetch-episode-details";
import { ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function NextEpisode({
  tmdbId,
  season,
  episode,
  media_type,
  enable,
  onNext,
  duration,
  currentTime,
}: {
  tmdbId: string;
  season: number;
  episode: number;
  media_type: string;
  enable: boolean;
  onNext: () => void;
  currentTime: number;
  duration: number;
}) {
  const { data, isLoading } = useTvEpisode({
    tmdbId,
    season_number: season,
    episode_number: episode,
    media_type,
    enable,
  });

  const [loaded, setLoaded] = useState(false);
  const [closed, setClosed] = useState(false);

  const timer = Math.max(0, Math.ceil(duration - currentTime));

  return (
    <AnimatePresence>
      {enable && !closed && !isLoading && data && media_type === "tv" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute  inset-0 right-0 z-40 flex  items-end justify-center md:p-12 p-4  bg-linear-to-b from-transparent to-black cursor-default"
        >
          <motion.div
            initial={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:max-w-sm max-w-60  backdrop-blur-md  rounded-lg"
          >
            {data.still_path && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <motion.img
                  src={`https://image.tmdb.org/t/p/w500${data.still_path}`}
                  alt={data.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: loaded ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  onLoad={() => setLoaded(true)}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="md:mt-3 mt-1.5 p-2 flex items-center gap-3">
              <div className="flex-1">
                <p className="md:text-sm text-xs text-muted-foreground">
                  Next Episode · S{season} E{episode}
                </p>

                <p className="mt-1 line-clamp-1 md:text-lg text-base font-medium">
                  {data.name}
                </p>
              </div>
              <Button
                onClick={onNext}
                variant="secondary"
                className=" cursor-pointer"
              >
                <ArrowRight />
              </Button>
            </div>

            <Button
              onClick={() => setClosed(true)}
              variant="secondary"
              className="absolute top-1  right-1 cursor-pointer"
            >
              ({timer}s) <X />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
