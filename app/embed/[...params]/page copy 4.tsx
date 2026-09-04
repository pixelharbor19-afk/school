"use client";

import { useTmdbDetails } from "@/hooks/fetch-details";
import { sourceQueryOptions, QualityTrack } from "@/hooks/source";
import { useSandboxDetection } from "@/hooks/useSandboxDetection";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import * as dashjs from "dashjs";
import { useQueries } from "@tanstack/react-query";

export type SourceStatus = "queue" | "connecting" | "ready" | "failed";
export type ServerStatus = "queue" | "checking" | "available" | "failed";

const SERVERS = [
  {
    name: "Zinogre I",
    server: "zinogre",
    desc: "Movies & TV Shows - HD Support",
  },
  { name: "Valstrax I", server: "valstrax", desc: "HD Quality & Reliable" },
  {
    name: "Alatreon II",
    server: "alatreon",
    desc: "Extensive Movie & TV Library",
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

  const [activatedServers, setActivatedServers] = useState<string[]>([
    SERVERS[0].server,
  ]);
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
    dubType: dubType,
  };

  const results = useQueries({
    queries: SERVERS.map((s) =>
      sourceQueryOptions({
        ...commonParams,
        path: s.server,
        enable: metadataLoad && activatedServers.includes(s.server),
      }),
    ),
  });

  const servers = SERVERS.map((s, i) => ({ ...s, query: results[i] }));

  const server = servers[serverIndex];
  const sources: QualityTrack[] = server.query.data?.links ?? [];
  const currentSource = sources[sourceIndex];

  const srcLink = currentSource?.link;
  const srcType = currentSource?.type;

  const [playbackStatus, setPlaybackStatus] = useState<SourceStatus>("queue");
  const [failedServers, setFailedServers] = useState<string[]>([]);

  useEffect(() => {
    setSourceIndex(0);
  }, [serverIndex, sources.length]);

  const videoRef = useRef<HTMLVideoElement>(null);

  const switchToNextServer = () => {
    const availableIndex = servers.findIndex(
      (s, index) =>
        index !== serverIndex &&
        !failedServers.includes(s.server) &&
        s.query.isSuccess &&
        (s.query.data?.links?.length ?? 0) > 0,
    );

    if (availableIndex !== -1) {
      setServerIndex(availableIndex);
      setSourceIndex(0);
      return;
    }

    const queueIndex = SERVERS.findIndex(
      (s, index) =>
        index !== serverIndex &&
        !failedServers.includes(s.server) &&
        !activatedServers.includes(s.server),
    );

    if (queueIndex === -1) return;

    setActivatedServers((prev) => [...prev, SERVERS[queueIndex].server]);
    setServerIndex(queueIndex);
    setSourceIndex(0);
  };
  useEffect(() => {
    const video = videoRef.current;

    if (!video || !srcLink) return;

    setPlaybackStatus("connecting");

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

        setPlaybackStatus("failed");
        setFailedServers((prev) =>
          prev.includes(server.server) ? prev : [...prev, server.server],
        );
        switchToNextServer();
      });

      return () => hls.destroy();
    }

    if (srcType === "dash") {
      const dash = dashjs.MediaPlayer().create();
      dash.initialize(video, srcLink, true);

      dash.on(dashjs.MediaPlayer.events.ERROR, () => {
        setPlaybackStatus("failed");
        setFailedServers((prev) =>
          prev.includes(server.server) ? prev : [...prev, server.server],
        );
        switchToNextServer();
      });

      return () => dash.reset();
    }

    video.src = srcLink;

    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [srcLink, srcType]);

  useEffect(() => {
    const failed =
      server.query.isError || (server.query.isSuccess && sources.length === 0);

    if (!failed) return;

    setFailedServers((prev) =>
      prev.includes(server.server) ? prev : [...prev, server.server],
    );

    switchToNextServer();
  }, [
    server.server,
    server.query.isError,
    server.query.isSuccess,
    sources.length,
    serverIndex,
  ]);
  return (
    <div className="relative h-dvh w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        autoPlay
        onCanPlay={() => setPlaybackStatus("ready")}
        onError={() => {
          if (srcType === "mp4") {
            setPlaybackStatus("failed");
            setFailedServers((prev) =>
              prev.includes(server.server) ? prev : [...prev, server.server],
            );
            switchToNextServer();
          }
        }}
      />

      <div className="absolute bottom-6 left-1/2 w-full max-w-md -translate-x-1/2 px-4">
        <div className="rounded-xl border border-white/10 bg-black/80 p-3 backdrop-blur-md">
          <div className="mb-2 px-1 text-xs font-medium text-white/50">
            Servers
          </div>

          <div className="space-y-2">
            {servers.map((s, index) => {
              const sStatus: ServerStatus = failedServers.includes(s.server)
                ? "failed"
                : s.query.isError
                  ? "failed"
                  : s.query.isLoading
                    ? "checking"
                    : s.query.isSuccess &&
                        (s.query.data?.links?.length ?? 0) > 0
                      ? "available"
                      : "queue";

              const serverSources: QualityTrack[] = s.query.data?.links ?? [];
              const isSelectedServer = index === serverIndex;

              return (
                <div key={s.server} className="space-y-2">
                  <button
                    onClick={() => {
                      setServerIndex(index);
                      setSourceIndex(0);

                      setFailedServers((prev) =>
                        prev.filter((server) => server !== s.server),
                      );

                      setActivatedServers((prev) =>
                        prev.includes(s.server) ? prev : [...prev, s.server],
                      );

                      if (sStatus === "failed") {
                        s.query.refetch();
                      }
                    }}
                    disabled={sStatus === "checking"}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${
                      isSelectedServer
                        ? "border-white/20 bg-white/10"
                        : "border-white/5 bg-white/[0.03]"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        {s.name}
                      </div>

                      <div className="text-xs text-white/40">{s.desc}</div>
                    </div>

                    {sStatus === "queue" && (
                      <span className="text-xs text-white/40">Queue</span>
                    )}

                    {sStatus === "checking" && (
                      <span className="text-xs text-white/40">Checking</span>
                    )}

                    {sStatus === "available" && (
                      <span className="text-xs text-green-400">Available</span>
                    )}

                    {sStatus === "failed" && (
                      <span className="text-xs text-red-400">Failed</span>
                    )}
                  </button>

                  {serverSources.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pl-3">
                      {serverSources.map((source, sourceIdx) => {
                        const isActive =
                          isSelectedServer && sourceIdx === sourceIndex;

                        const sourceStatus = isActive
                          ? playbackStatus
                          : "queue";

                        return (
                          <button
                            key={`${source.type}-${source.resolution}-${sourceIdx}`}
                            onClick={() => {
                              setServerIndex(index);
                              setSourceIndex(sourceIdx);

                              setActivatedServers((prev) =>
                                prev.includes(s.server)
                                  ? prev
                                  : [...prev, s.server],
                              );
                            }}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                              isActive
                                ? "border-white/20 bg-white/10 text-white"
                                : "border-white/5 bg-white/[0.03] text-white/60"
                            }`}
                          >
                            <span>
                              {source.resolution
                                ? `${source.resolution}p`
                                : source.type}
                            </span>

                            {sourceStatus === "queue" && (
                              <span className="text-xs text-white/30">
                                Queue
                              </span>
                            )}

                            {sourceStatus === "connecting" && (
                              <span className="text-xs text-white/40">
                                Connecting
                              </span>
                            )}

                            {sourceStatus === "ready" && (
                              <span className="text-xs text-green-400">
                                Ready
                              </span>
                            )}

                            {sourceStatus === "failed" && (
                              <span className="text-xs text-red-400">
                                Failed
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
