import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FIELD_MAP } from "@/lib/field-map";

interface UseThumbnailParams {
  title: string;
  media_type: string;
  year: string;
  season?: number;
  episode?: number;
  enable: boolean;
}
export default function useThumbnail({
  title,
  media_type,
  year,
  season,
  episode,
  enable,
}: UseThumbnailParams) {
  return useQuery<string>({
    queryKey: ["get-thumbnail", title, media_type, year, season, episode],
    enabled: enable,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    queryFn: async () => {
      const search = new URLSearchParams({
        [FIELD_MAP.title]: title,
        [FIELD_MAP.mediaType]: media_type,
        [FIELD_MAP.year]: year,
      });

      if (media_type === "tv") {
        if (season !== undefined) search.set(FIELD_MAP.season, String(season));
        if (episode !== undefined)
          search.set(FIELD_MAP.episode, String(episode));
      }

      const { data } = await axios.get(
        `/backend/thumbnail?${search.toString()}`,
        {
          responseType: "text",
        },
      );

      return data;
    },
  });
}
