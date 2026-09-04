"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { sourceQueryOptions, QualityTrack } from "@/hooks/source";
import { SERVERS, sourceKey, type ServerTypes } from "./server-types";

type Props = {
  commonParams: any;
  metadataLoad: boolean;
};

export function useServerSources({ commonParams, metadataLoad }: Props) {
  const [activatedServers, setActivatedServers] = useState<string[]>([
    "zinogre",
  ]);

  const [failedSources, setFailedSources] = useState<Set<string>>(new Set());

  const results = useQueries({
    queries: SERVERS.map((server) =>
      sourceQueryOptions({
        ...commonParams,
        path: server.server,
        enable: metadataLoad && activatedServers.includes(server.server),
      }),
    ),
  });

  const servers = useMemo<ServerTypes[]>(
    () =>
      SERVERS.map((server, index) => {
        const query = results[index];

        if (!activatedServers.includes(server.server)) {
          return server;
        }

        if (query.isFetching) {
          return {
            ...server,
            status: "checking",
            message: undefined,
          };
        }

        if (query.isError) {
          return {
            ...server,
            status: "failed",
            message:
              query.error instanceof Error
                ? query.error.message
                : "Server failed",
          };
        }

        if (query.isSuccess) {
          const response = query.data;

          if (response?.server !== server.server) {
            return server;
          }

          const sources = (response?.links ?? []).map(
            (source: QualityTrack) => ({
              type: source.type,
              link: source.link,
              resolution: source.resolution,
              status: failedSources.has(sourceKey(server.server, source.link))
                ? ("failed" as const)
                : ("queue" as const),
            }),
          );

          const hasUsableSources = sources.some(
            (source) => source.status !== "failed",
          );

          return {
            ...server,
            status: hasUsableSources ? "available" : "failed",
            message: hasUsableSources ? undefined : "No usable sources found",
            sources,
          };
        }

        return server;
      }),
    [results, activatedServers, failedSources],
  );

  return {
    servers,
    results,
    activatedServers,
    setActivatedServers,
    failedSources,
    setFailedSources,
  };
}
