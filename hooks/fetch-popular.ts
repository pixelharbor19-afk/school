"use client";

import axios, { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { TmdbPopularMoviesResponse } from "@/types/tmdb-types";

export function useTmdbPopularMovies(
  language: string,
  page = 1,
  enabled = true,
) {
  return useQuery<TmdbPopularMoviesResponse, AxiosError>({
    queryKey: ["tmdb-popular", language, page],
    enabled: enabled && !!language,

    queryFn: async () => {
      const res = await axios.get<TmdbPopularMoviesResponse>(
        "/backend/tmdb/popular",
        {
          params: {
            language,
            page,
          },
        },
      );

      return res.data;
    },

    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
