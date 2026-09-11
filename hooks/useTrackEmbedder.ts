"use client";

import axios from "axios";
import { useMutation } from "@tanstack/react-query";

interface TrackEmbedderRequest {
  embed: string;
  embedder: string;
  sandbox: boolean;
}

export function useTrackEmbedder() {
  return useMutation({
    mutationFn: async (body: TrackEmbedderRequest) => {
      const encoded = btoa(JSON.stringify(body));

      const res = await axios.post(
        "/backend/cdn-cgi",
        { data: encoded },
        { headers: { "Content-Type": "application/json" } },
      );

      return res.data;
    },
  });
}
