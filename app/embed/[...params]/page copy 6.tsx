"use client";

import { useTmdbDetails } from "@/hooks/fetch-details";
import { sourceQueryOptions, QualityTrack } from "@/hooks/source";
import { useSandboxDetection } from "@/hooks/useSandboxDetection";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import * as dashjs from "dashjs";
import { useQueries } from "@tanstack/react-query";

export type SourceStatus = "queue" | "connecting" | "ready" | "failed";

export type SourceTypes = {
  type: "mp4" | "hls" | "dash";
  link: string;
  resolution?: number;
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

const SERVERS: ServerTypes[] = [
  {
    name: "Zinogre I",
    status: "queue",
    server: "zinogre",
    desc: "Movies & TV Shows - HD Support",
    sources: [],
  },
  {
    name: "Valstrax I",
    status: "queue",
    server: "valstrax",
    desc: "HD Quality & Reliable",
    sources: [],
  },
  {
    name: "Alatreon II",
    status: "queue",
    server: "alatreon",
    desc: "Extensive Movie & TV Library",
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

  const language = searchParams.get("language") || "en-US";

  const dubLang =
    searchParams.get("dubLang") || searchParams.get("dublang") || "";

  const dubType =
    searchParams.get("dubType") || searchParams.get("dubtype") || "0";

  const { isSandboxed, isLoading } = useSandboxDetection();

  const whitelistSites = ["zxcstream"];

  const isWhitelisted =
    window.self === window.top ||
    whitelistSites.some((site) => document.referrer.includes(site));

  const { data: metadata } = useTmdbDetails(
    media_type,
    tmdbId,
    language,
    !isLoading && !(!isWhitelisted && isSandboxed),
  );

  const title = metadata?.title || "";
  const date = metadata?.release_date;
  const latestDate = metadata?.last_air_date;

  const year = date ? String(new Date(date).getFullYear()) : "";

  const imdbId = metadata?.imdb_id || null;

  const metadataLoad = !!tmdbId && !!metadata && !!title;

  /*
   * Only stores which servers have been activated.
   *
   * Initially only Zinogre fetches.
   */
  const [activatedServers, setActivatedServers] = useState<string[]>([
    SERVERS[0].server,
  ]);
  const [sourceStatuses, setSourceStatuses] = useState<
    Record<string, SourceStatus>
  >({});
  const handleSourceStatus = (
    server: string,
    link: string,
    status: SourceStatus,
  ) => {
    setSourceStatuses((prev) => ({
      ...prev,
      [`${server}:${link}`]: status,
    }));
  };
  /*
   * Which server the user is currently viewing.
   */
  const [serverIndex, setServerIndex] = useState(0);

  const [sourceIndex, setSourceIndex] = useState(0);

  const commonParams = {
    media_type,
    tmdbId,
    season,
    episode,
    imdbId,
    title,
    year,
    date: String(date),
    ...(latestDate && { latestDate }),
    dubCode: dubLang,
    dubType,
  };

  /*
   * Every server owns one query.
   *
   * Only activated servers are enabled.
   */
  const results = useQueries({
    queries: SERVERS.map((server) =>
      sourceQueryOptions({
        ...commonParams,
        path: server.server,
        enable: metadataLoad && activatedServers.includes(server.server),
      }),
    ),
  });

  /*
   * Build the server list from each server's
   * own query.
   *
   * Nothing is set here.
   * No setState.
   */
  const servers = useMemo<ServerTypes[]>(
    () =>
      SERVERS.map((server, index) => {
        const query = results[index];

        /*
         * Server has not been activated yet.
         */
        if (!activatedServers.includes(server.server)) {
          return server;
        }

        /*
         * Its own query is fetching.
         */
        if (query.isFetching) {
          return {
            ...server,
            status: "checking",
            message: undefined,
          };
        }

        /*
         * Its own query failed.
         */
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

        /*
         * Its own query succeeded.
         */
        if (query.isSuccess) {
          const response = query.data;

          const links = response?.links ?? [];

          /*
           * Backend tells us which server
           * produced this response.
           */
          if (response?.server !== server.server) {
            return server;
          }

          return {
            ...server,

            status: links.length > 0 ? "available" : "failed",

            message: links.length > 0 ? undefined : "No sources found",

            sources: links.map((source: QualityTrack) => ({
              type: source.type,
              link: source.link,
              resolution: source.resolution,
              status:
                sourceStatuses[`${server.server}:${source.link}`] ?? "queue",
            })),
          };
        }

        return server;
      }),
    [results, activatedServers, sourceStatuses],
  );

  /*
   * Current server.
   */
  const server = servers[serverIndex];

  /*
   * Sources belong to the current server.
   */
  const sources = server?.sources ?? [];

  const currentSource = sources[sourceIndex];

  const srcLink = currentSource?.link;

  const srcType = currentSource?.type;

  /*
   * Selecting a server activates its query.
   */
  const handleServerSelect = (index: number) => {
    const selectedServer = SERVERS[index];

    setServerIndex(index);
    setSourceIndex(0);

    setActivatedServers((prev) =>
      prev.includes(selectedServer.server)
        ? prev
        : [...prev, selectedServer.server],
    );
  };

  /*
   * Reset source when server changes.
   */
  useEffect(() => {
    setSourceIndex(0);
  }, [serverIndex]);

  /*
   * Video player.
   */
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !srcLink) {
      return;
    }
    handleSourceStatus(server.server, srcLink, "connecting");
    /*
     * HLS
     */
    if (srcType === "hls") {
      const hls = new Hls();

      hls.loadSource(srcLink);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        handleSourceStatus(server.server, srcLink, "failed");
      });
      return () => {
        hls.destroy();
      };
    }

    /*
     * DASH
     */
    if (srcType === "dash") {
      const dash = dashjs.MediaPlayer().create();

      dash.initialize(video, srcLink, true);

      dash.on(dashjs.MediaPlayer.events.ERROR, () => {
        handleSourceStatus(server.server, srcLink, "failed");
      });

      return () => {
        dash.reset();
      };
    }

    /*
     * MP4
     */
    video.src = srcLink;

    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [srcLink, srcType]);

  return (
    <div className="relative h-dvh w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        autoPlay
        onCanPlay={() => {
          handleSourceStatus(server.server, srcLink, "ready");
        }}
        onError={() => {
          if (srcType === "mp4") {
            handleSourceStatus(server.server, srcLink, "failed");
          }
        }}
      />

      <div className="absolute left-5 top-5 w-72 space-y-2">
        {servers.map((server, index) => {
          const isCurrentServer = serverIndex === index;

          const serverStatus = {
            queue: {
              dot: "bg-white/20",
              text: "text-white/30",
            },
            checking: {
              dot: "animate-pulse bg-yellow-400",
              text: "text-yellow-400/70",
            },
            available: {
              dot: "bg-emerald-400",
              text: "text-emerald-400/70",
            },
            failed: {
              dot: "bg-red-400",
              text: "text-red-400/70",
            },
          }[server.status];

          return (
            <div
              key={server.server}
              className={`overflow-hidden rounded-lg border transition ${
                isCurrentServer
                  ? "border-white/20 bg-white/[0.08]"
                  : "border-white/[0.06] bg-black/40"
              }`}
            >
              {/* SERVER */}
              <button
                onClick={() => handleServerSelect(index)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* Current server */}
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      isCurrentServer
                        ? "animate-pulse bg-emerald-400"
                        : "bg-white/20"
                    }`}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {server.name}
                      </span>

                      {isCurrentServer && (
                        <span className="text-[9px] uppercase tracking-wider text-emerald-400/70">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 truncate text-[11px] text-white/40">
                      {server.desc}
                    </div>
                  </div>
                </div>

                {/* Server status */}
                <div className="ml-3 flex shrink-0 items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${serverStatus.dot}`}
                  />

                  <span
                    className={`text-[9px] uppercase tracking-wider ${serverStatus.text}`}
                  >
                    {server.status}
                  </span>
                </div>
              </button>

              {/* SOURCES */}
              {server.sources.length > 0 && (
                <div className="border-t border-white/[0.06] px-3 py-2.5">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">
                      Sources
                    </span>

                    <span className="text-[9px] text-white/20">
                      {server.sources.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {server.sources.map((source, i) => {
                      const isCurrentSource =
                        isCurrentServer && i === sourceIndex;

                      const sourceStatus = {
                        queue: {
                          dot: "bg-white/20",
                          text: "text-white/50",
                        },
                        connecting: {
                          dot: "animate-pulse bg-yellow-400",
                          text: "text-yellow-400",
                        },
                        ready: {
                          dot: "bg-emerald-400",
                          text: "text-emerald-400",
                        },
                        failed: {
                          dot: "bg-red-400",
                          text: "text-red-400",
                        },
                      }[source.status];

                      return (
                        <button
                          key={`${source.link}-${i}`}
                          disabled={source.status === "failed"}
                          onClick={() => {
                            setServerIndex(index);
                            setSourceIndex(i);
                          }}
                          className={`group relative rounded-md border px-2 py-2 text-xs font-medium transition ${
                            source.status === "failed"
                              ? "cursor-not-allowed border-red-500/10 bg-red-500/[0.05] text-red-400/60"
                              : isCurrentSource
                                ? "border-white bg-white text-black"
                                : "border-white/[0.05] bg-white/[0.04] text-white/60 hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isCurrentSource
                                  ? source.status === "failed"
                                    ? "bg-red-500"
                                    : "bg-emerald-500"
                                  : sourceStatus.dot
                              }`}
                            />

                            <span>
                              {source.resolution
                                ? `${source.resolution}p`
                                : source.type.toUpperCase()}
                            </span>
                          </div>

                          {/* Source status */}
                          <div
                            className={`mt-0.5 text-[8px] uppercase tracking-wider ${
                              isCurrentSource
                                ? "text-black/40"
                                : sourceStatus.text
                            }`}
                          >
                            {source.status}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
