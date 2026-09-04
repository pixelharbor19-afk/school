import { useQuery } from "@tanstack/react-query";

export interface IntroType {
  start_sec: number;
  end_sec: number;
  start_ms: number;
  end_ms: number;
  confidence: number;
  submission_count: number;
  updated_at: string;
}

export interface IntroTypesResponse {
  imdbId: string;

  season: number;
  episode: number;
  intro: IntroType | null;
  recap: IntroType | null;
  outro: IntroType | null;
}

interface Params {
  imdbId: string | null;
  tmdbId: string;
  season: number;
  episode: number;
  enabled: boolean;
}

export function useIntro({ imdbId, season, episode, enabled, tmdbId }: Params) {
  return useQuery<IntroTypesResponse>({
    queryKey: ["IntroTypes", imdbId, tmdbId, season, episode],
    enabled: enabled && !!imdbId,
    async queryFn() {
      const res = await fetch(
        `/backend/intro?imdbId=${imdbId}&season=${season}&episode=${episode}&tmdbId=${tmdbId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch IntroTypes");
      return res.json();
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
