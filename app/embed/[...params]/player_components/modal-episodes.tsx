"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  GalleryVertical,
  GalleryVerticalEnd,
  ListVideo,
  VideoOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { useTvSeason } from "@/hooks/fetch-seasons";
import { SeasonsType } from "@/types/tmdb-types";
import { cn } from "@/lib/utils";

export default function EpisodesModal({
  seasons,
  color,
  playerRef,
  canPlay,
  resetTimer,
}: {
  seasons: SeasonsType[];
  color: string;
  playerRef: React.RefObject<HTMLDivElement | null>;
  canPlay: boolean;
  resetTimer: () => void;
}) {
  const { params } = useParams();
  const tmdbId = String(params?.[1]);
  const season = Number(params?.[2]) || 1;
  const episode = Number(params?.[3]) || 1;
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(season);
  const [expanded, setExpanded] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const episodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const { data, isLoading } = useTvSeason({
    tmdbId,
    season_number: selectedSeason,
    media_type: "tv",
    enable: open && canPlay,
  });

  const episodes = data?.episodes ?? [];
  const visibleEpisodes = expanded ? episodes : episodes.slice(0, 6);

  const currentIndex =
    selectedSeason === season
      ? Math.max(
          0,
          episodes.findIndex((e) => e.episode_number === episode),
        )
      : 0;

  useEffect(() => {
    if (!open || !episodes.length) return;

    const currentEpisode = episodes[currentIndex];

    if (!currentEpisode) return;

    requestAnimationFrame(() => {
      episodeRefs.current[currentEpisode.id]?.scrollIntoView({
        behavior: "instant",
        block: "center",
      });
    });
  }, [open, selectedSeason, currentIndex, episodes]);

  const closeDrawer = () => {
    setOpen(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (value) {
          setSelectedSeason(season);
          setExpanded(false);
        }
      }}
      swipeDirection="down"
      onOpenChangeComplete={(value) => {
        if (!value) {
          resetTimer();
        }
      }}
    >
      <DrawerTrigger
        render={
          <button
            type="button"
            className={cn(
              "cursor-pointer text-foreground/90 hover:text-foreground shadow-2xl",
            )}
          >
            <ListVideo className="md:size-7 size-6 " strokeWidth={2.5} />
          </button>
        }
      />

      <DrawerContent className="max-w-5xl mx-auto pr-1" container={playerRef}>
        <DrawerHeader className="">
          <div className="flex justify-center items-center">
            <div className="flex items-center gap-3">
              <GalleryVerticalEnd />
              <div className=" text-left">
                <DrawerTitle className="text-lg">Episodes</DrawerTitle>
                <DrawerDescription>
                  Select an episode to watch.
                </DrawerDescription>
              </div>
            </div>
            <div className="flex-1"></div>
            <Popover>
              <PopoverTrigger
                render={<Button variant="secondary" className="w-32" />}
              >
                <GalleryVertical /> Season {selectedSeason}
              </PopoverTrigger>
              <PopoverContent className="w-32 p-1" portal={false}>
                <div className="flex flex-col">
                  {seasons.map((item) => (
                    <Button
                      key={item.season_number}
                      variant="ghost"
                      className="justify-start cursor-pointer"
                      onClick={() => {
                        setSelectedSeason(item.season_number);
                        setExpanded(false);
                      }}
                    >
                      Season {item.season_number}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </DrawerHeader>

        <ScrollArea className="max-h-[80vh] flex-1 pr-2">
          <div className="px-4 pb-6 pt-4">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 ">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-video w-full rounded" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : episodes.length === 0 ? (
              <div className="flex min-h-60 flex-col items-center justify-center text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                  <VideoOff className="size-7 text-muted-foreground" />
                </div>

                <h2 className="text-lg font-semibold">No Episodes Found</h2>

                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  This season doesn't have any available episodes yet.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 ">
                  {visibleEpisodes.map((e) => {
                    const isActive =
                      selectedSeason === season && e.episode_number === episode;

                    return (
                      <div
                        key={e.id}
                        ref={(element) => {
                          episodeRefs.current[e.id] = element;
                        }}
                      >
                        <Link
                          href={`/embed/tv/${tmdbId}/${selectedSeason}/${e.episode_number}${
                            searchParams.toString()
                              ? `?${searchParams.toString()}`
                              : ""
                          }`}
                          replace
                          onClick={closeDrawer}
                          className="group block"
                        >
                          <div
                            className={cn(
                              "relative mb-3 aspect-video overflow-hidden rounded-md bg-neutral-900",
                              "transition-all duration-300",
                              "group-hover:brightness-75",
                              isActive && "border-2",
                            )}
                            style={
                              isActive
                                ? {
                                    outlineColor: color,
                                    borderColor: color,
                                  }
                                : undefined
                            }
                          >
                            {e.still_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w780${e.still_path}`}
                                alt={e.name}
                                loading="lazy"
                                className={cn(
                                  "h-full w-full object-cover",
                                  "transition-opacity duration-500",
                                  loadedImages[e.id]
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                                onLoad={() =>
                                  setLoadedImages((prev) => ({
                                    ...prev,
                                    [e.id]: true,
                                  }))
                                }
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="text-5xl font-bold text-neutral-800">
                                  {e.episode_number}
                                </span>
                              </div>
                            )}
                          </div>

                          <div>
                            <h3
                              className={cn(
                                "mb-1 line-clamp-2 font-semibold text-base",
                                "transition-colors group-hover:text-neutral-300",
                              )}
                            >
                              {e.episode_number}. {e.name}
                            </h3>

                            <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500 lg:text-sm">
                              {e.air_date && (
                                <span>
                                  {new Date(e.air_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              )}

                              {e.air_date && e.runtime && <span>•</span>}

                              {e.runtime && <span>{e.runtime} min</span>}
                            </div>

                            {e.overview && (
                              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground lg:line-clamp-3">
                                {e.overview}
                              </p>
                            )}
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {episodes.length > 6 && (
                  <div className="mt-6 flex items-center justify-center">
                    <Button
                      variant="link"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? "Show Less" : "Show More"}

                      <ChevronDown
                        className={cn(
                          "transition-transform",
                          expanded && "rotate-180",
                        )}
                      />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
