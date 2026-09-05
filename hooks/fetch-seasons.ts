import { SeasonTypes } from "@/types/tmdb-types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useTvSeason({
  tmdbId,
  season_number,
  media_type,
  enable,
}: {
  tmdbId: string;
  season_number?: number;
  media_type: string;
  enable: boolean;
}) {
  return useQuery<SeasonTypes>({
    queryKey: ["tv-season", tmdbId, season_number],
    enabled: media_type === "tv" && season_number !== undefined && enable,
    queryFn: async () => {
      const { data } = await axios.get(
        `/backend/tmdb/season/${tmdbId}/season/${season_number}`,
      );
      return data;
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
