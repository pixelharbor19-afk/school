import { EpisodeTypes } from "@/types/tmdb-types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useTvEpisode({
  tmdbId,
  season_number,
  episode_number,
  media_type,
  enable,
}: {
  tmdbId: string;
  season_number?: number;
  episode_number?: number;
  media_type: string;
  enable: boolean;
}) {
  return useQuery<EpisodeTypes>({
    queryKey: ["tv-episode", tmdbId, season_number, episode_number],
    enabled:
      media_type === "tv" &&
      season_number !== undefined &&
      episode_number !== undefined &&
      enable,
    queryFn: async () => {
      const { data } = await axios.get(
        `/backend/tmdb/episode/${tmdbId}/season/${season_number}/episode/${episode_number}`,
      );
      return data;
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
