"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as dashjs from "dashjs";
import Hls from "hls.js";
import { useQueries } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";

import { useTmdbDetails } from "@/hooks/fetch-details";
import { sourceQueryOptions } from "@/hooks/angsarapmomia";
import { Button } from "@/components/ui/button";

export type SourceStatus = "queue" | "connecting" | "ready" | "failed";

export type SourceTypes = {
  type: "mp4" | "hls" | "dash";
  link: string;
  resolution: number | null;
  status: SourceStatus;
};

export type ServerStatus = "queue" | "checking" | "available" | "failed";

export type ServerTypes = {
  name: string;
  server: string;
  status: ServerStatus;
  desc: string;
  message?: string;
  sources: SourceTypes[];
};

export const SERVERS: ServerTypes[] = [
  {
    name: "Andromeda",
    status: "queue",
    server: "andromeda",
    desc: "Smooth Playback & HD",
    sources: [],
  },
  {
    name: "Centaurus",
    status: "queue",
    server: "centaurus",
    desc: "Multi Audio Support",
    sources: [],
  },
  {
    name: "Atlas",
    status: "queue",
    server: "atlas",
    desc: "Alternative",
    sources: [],
  },
  {
    name: "Milky Way",
    status: "queue",
    server: "milkyway",
    desc: "Alternative",
    sources: [],
  },
];

export default function Embed() {
  const { params } = useParams();
  const searchParams = useSearchParams();

  const media_type = String(params?.[0]);
  const tmdbId = String(params?.[1]);
  const season = Number(params?.[2]) || 1;
  const episode = Number(params?.[3]) || 1;

  /*
   * Metadata
   */
  const language = searchParams.get("language") || "en-US";
  const { data: metadata } = useTmdbDetails(media_type, tmdbId, language, true);

  const title = metadata?.title || "";
  const date = metadata?.release_date;
  const latestDate = metadata?.last_air_date;
  const year = date ? String(new Date(date).getFullYear()) : "";
  const imdbId = metadata?.imdb_id || null;
  const metadataLoad = !!tmdbId && !!metadata && !!title;

  /*
   * Server
   */
  const [serverIndex, setServerIndex] = useState(0);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [activatedServers, setActivatedServers] = useState<string[]>([
    SERVERS[0].server,
  ]);

  const [sourceStatuses, setSourceStatuses] = useState<
    Record<number, Record<number, SourceStatus>>
  >({});
  const [playingSource, setPlayingSource] = useState<{
    serverIndex: number;
    sourceIndex: number;
  } | null>(null);

  const results = useQueries({
    queries: SERVERS.map((server) =>
      sourceQueryOptions({
        media_type,
        tmdbId,
        season,
        episode,
        imdbId,
        title,
        year,
        date: String(date),
        ...(latestDate && { latestDate }),
        path: server.server,
        dubCode: "",
        dubType: "",
        enable: metadataLoad && activatedServers.includes(server.server),
      }),
    ),
  });

  const servers = useMemo(
    () =>
      SERVERS.map((server, index) => {
        const query = results[index];

        if (!metadataLoad || !activatedServers.includes(server.server)) {
          return server;
        }

        if (query.isFetching) {
          return {
            ...server,
            status: "checking",
            message: undefined,
            sources: [],
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
            sources: [],
          };
        }

        if (query.isSuccess) {
          const links = query.data?.links ?? [];

          if (!links.length) {
            return {
              ...server,
              status: "failed",
              message: "No sources available",
              sources: [],
            };
          }

          return {
            ...server,
            status: "available",
            message: undefined,
            sources: links.map((source, sourceIndex) => ({
              ...source,
              status: sourceStatuses[index]?.[sourceIndex] ?? "queue",
            })),
          };
        }

        return server;
      }),
    [results, metadataLoad, activatedServers, sourceStatuses],
  );

  /*
   * Current server
   */
  const server = servers[serverIndex];
  const sources = server?.sources ?? [];
  const source = sources[sourceIndex];

  /*
   * Source status
   */
  const setSourceStatus = (status: SourceStatus) => {
    setSourceStatuses((prev) => ({
      ...prev,
      [serverIndex]: {
        ...prev[serverIndex],
        [sourceIndex]: status,
      },
    }));
  };
  const handleSourceSelect = (index: number) => {
    if (index === sourceIndex) return;

    setSourceStatuses((prev) => {
      const status = prev[serverIndex]?.[sourceIndex];

      if (status !== "connecting") return prev;

      return {
        ...prev,
        [serverIndex]: {
          ...prev[serverIndex],
          [sourceIndex]: "queue",
        },
      };
    });

    setSourceIndex(index);
  };
  useEffect(() => {
    if (!server) return;

    // Current server failed
    if (server.status === "failed") {
      // Prefer an already available server
      const availableIndex = servers.findIndex(
        (item, index) => index !== serverIndex && item.status === "available",
      );

      if (availableIndex !== -1) {
        handleServerSelect(availableIndex);
        return;
      }

      // No available server, activate the next queued server
      const queueIndex = servers.findIndex(
        (item, index) => index !== serverIndex && item.status === "queue",
      );

      if (queueIndex !== -1) {
        handleServerSelect(queueIndex);
      }

      return;
    }

    // Current source failed
    if (source?.status === "failed") {
      const nextSourceIndex = sourceIndex + 1;

      // Try next source on the same server
      if (nextSourceIndex < sources.length) {
        setSourceIndex(nextSourceIndex);
        return;
      }

      // All sources failed, find another server
      const availableIndex = servers.findIndex(
        (item, index) => index !== serverIndex && item.status === "available",
      );

      if (availableIndex !== -1) {
        handleServerSelect(availableIndex);
        return;
      }

      // No available server, activate a queued server
      const queueIndex = servers.findIndex(
        (item, index) => index !== serverIndex && item.status === "queue",
      );

      if (queueIndex !== -1) {
        handleServerSelect(queueIndex);
      }
    }
  }, [server, source, sources.length, serverIndex, sourceIndex, servers]);

  /*
   * Server switching
   */
  const handleServerSelect = (index: number) => {
    if (index === serverIndex) return;
    const selectedServer = SERVERS[index];

    setServerIndex(index);
    setSourceIndex(0);

    setActivatedServers((prev) =>
      prev.includes(selectedServer.server)
        ? prev
        : [...prev, selectedServer.server],
    );

    if (servers[index]?.status === "failed") {
      results[index].refetch();
    }
  };

  /*
   * Video
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<dashjs.MediaPlayerClass | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !source?.link) return;

    const { link, type } = source;

    setSourceStatus("connecting");

    if (type === "hls") {
      const hls = new Hls();

      hlsRef.current = hls;

      hls.loadSource(link);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (type === "dash") {
      const dash = dashjs.MediaPlayer().create();

      dashRef.current = dash;
      dash.initialize(video, link, true);

      return () => {
        dash.reset();
        dashRef.current = null;
      };
    }

    video.src = link;

    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [source?.link, source?.type, serverIndex, sourceIndex]);

  return (
    <div className="relative flex h-dvh w-full flex-col bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        onCanPlay={() => {
          setSourceStatus("ready");
          setPlayingSource({
            serverIndex,
            sourceIndex,
          });
        }}
        onError={() => setSourceStatus("failed")}
      />

      {/* Servers */}
      <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] gap-2 overflow-x-auto rounded-xl border border-white/10 bg-black/70 p-2 backdrop-blur-md">
        {servers.map((item, index) => {
          const active = serverIndex === index;

          return (
            <Button
              key={item.server}
              variant={active ? "default" : "ghost"}
              size="sm"
              className="shrink-0"
              onClick={() => handleServerSelect(index)}
            >
              <span
                className={`mr-2 size-2 rounded-full ${
                  item.status === "available"
                    ? "bg-green-500"
                    : item.status === "checking"
                      ? "animate-pulse bg-yellow-500"
                      : item.status === "failed"
                        ? "bg-red-500"
                        : "bg-white/30"
                }`}
              />
              {item.name}
            </Button>
          );
        })}
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="absolute right-4 top-4 z-10 flex max-w-[calc(100%-2rem)] gap-2 overflow-x-auto rounded-xl border border-white/10 bg-black/70 p-2 backdrop-blur-md">
          {sources.map((item, index) => {
            const active =
              playingSource?.serverIndex === serverIndex &&
              playingSource?.sourceIndex === index;

            return (
              <Button
                key={item.link}
                variant={active ? "default" : "ghost"}
                size="sm"
                className="shrink-0"
                onClick={() => handleSourceSelect(index)}
              >
                {item.resolution ? `${item.resolution}p` : item.type}
                <span
                  className={`ml-2 size-2 rounded-full ${
                    item.status === "ready"
                      ? "bg-green-500"
                      : item.status === "connecting"
                        ? "animate-pulse bg-yellow-500"
                        : item.status === "failed"
                          ? "bg-red-500"
                          : "bg-white/30"
                  }`}
                />
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
