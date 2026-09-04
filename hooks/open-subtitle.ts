import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface MediaOption {
  id: string;
  display: string;
  file: string;
}

interface UseSubtitlesParams {
  imdbId: string | null;
  season?: number;
  episode?: number;
  enabled?: boolean;
}

export function useOpenSubtitle({
  imdbId,
  season,
  episode,
  enabled,
}: UseSubtitlesParams) {
  return useQuery<MediaOption[], Error>({
    queryKey: ["libreSubs", imdbId, season, episode],
    queryFn: async () => {
      if (!imdbId) return [];

      const cleanId = imdbId.replace("tt", "");
      const url =
        season && episode
          ? `https://rest.opensubtitles.org/search/episode-${episode}/imdbid-${cleanId}/season-${season}`
          : `https://rest.opensubtitles.org/search/imdbid-${cleanId}`;

      const { data } = await axios.get(url);

      const subtitles: MediaOption[] = data.map((item: any, index: number) => ({
        id: `${item.ISO639}-${index}`,
        display:
          item.SubHearingImpaired === "1"
            ? `${item.LanguageName} (HI)`
            : item.LanguageName,
        file: item.SubDownloadLink.replace("/filead/", "/file/")
          .replace("/src-api/", "/subencoding-utf8/src-api/")
          .replace(".gz", ""),
      }));

      //  Alphabetical sort by language
      const languageCount: Record<string, number> = {};
      return subtitles
        .sort((a, b) => {
          if (a.display === "English") return -1;
          if (b.display === "English") return 1;
          return a.display.localeCompare(b.display);
        })
        .map((s) => {
          languageCount[s.display] = (languageCount[s.display] ?? 0) + 1;
          const count = languageCount[s.display];
          return {
            ...s,
            display: count === 0 ? s.display : `${s.display} ${count}`,
          };
        });
    },
    enabled: !!imdbId && enabled,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnReconnect: false,
  });
}
