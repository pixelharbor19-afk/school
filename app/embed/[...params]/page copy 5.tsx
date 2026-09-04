"use client";

import { useTmdbDetails } from "@/hooks/fetch-details";
import { sourceQueryOptions, QualityTrack } from "@/hooks/source";
import { useSandboxDetection } from "@/hooks/useSandboxDetection";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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

  const hasSources = (links?: QualityTrack[]) =>
    links?.some((source) => source.link) ?? false;

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

  useEffect(() => {
    setSourceIndex(0);
  }, [serverIndex, sources.length]);

  const videoRef = useRef<HTMLVideoElement>(null);

  const switchToNextServer = useCallback(() => {
    const availableIndex = servers.findIndex(
      (s, index) => index !== serverIndex && hasSources(s.query.data?.links),
    );

    if (availableIndex !== -1) {
      setServerIndex(availableIndex);
      setSourceIndex(0);
      return;
    }

    const queueIndex = SERVERS.findIndex(
      (s, index) =>
        index !== serverIndex && !activatedServers.includes(s.server),
    );

    if (queueIndex === -1) return;

    setActivatedServers((prev) => [...prev, SERVERS[queueIndex].server]);
    setServerIndex(queueIndex);
    setSourceIndex(0);
  }, [servers, serverIndex, activatedServers]);
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

        if (sourceIndex < sources.length - 1) {
          setSourceIndex((prev) => prev + 1);
          return;
        }

        setPlaybackStatus("failed");
        switchToNextServer();
      });

      return () => hls.destroy();
    }

    if (srcType === "dash") {
      const dash = dashjs.MediaPlayer().create();
      dash.initialize(video, srcLink, true);

      dash.on(dashjs.MediaPlayer.events.ERROR, () => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((prev) => prev + 1);
          return;
        }

        setPlaybackStatus("failed");
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
      server.query.isError || (server.query.isSuccess && !hasSources(sources));

    if (failed) {
      switchToNextServer();
    }
  }, [
    server.query.isError,
    server.query.isSuccess,
    sources,
    switchToNextServer,
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
          if (srcType !== "mp4") return;

          if (sourceIndex < sources.length - 1) {
            setSourceIndex((prev) => prev + 1);
            return;
          }

          setPlaybackStatus("failed");
          switchToNextServer();
        }}
      />

      <div className="absolute bottom-5 left-1/2 w-full max-w-lg -translate-x-1/2 px-3">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/85 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Sources
            </span>

            <span className="text-[11px] text-white/30">
              {servers.filter((s) => hasSources(s.query.data?.links)).length}{" "}
              available
            </span>
          </div>

          <div className="divide-y divide-white/5">
            {servers.map((s, index) => {
              const sStatus: ServerStatus = s.query.isError
                ? "failed"
                : s.query.isLoading
                  ? "checking"
                  : s.query.data
                    ? hasSources(s.query.data.links)
                      ? "available"
                      : "failed"
                    : "queue";

              const serverSources =
                s.query.data?.links.filter((source) => source.link) ?? [];

              const isSelectedServer = index === serverIndex;

              return (
                <div key={s.server} className="px-3 py-3">
                  <button
                    onClick={() => {
                      setServerIndex(index);

                      if (sStatus === "failed") {
                        s.query.refetch();
                        return;
                      }

                      setActivatedServers((prev) =>
                        prev.includes(s.server) ? prev : [...prev, s.server],
                      );
                    }}
                    disabled={sStatus === "checking"}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      isSelectedServer ? "bg-white/10" : "hover:bg-white/[0.05]"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        sStatus === "available"
                          ? "bg-green-400"
                          : sStatus === "checking"
                            ? "animate-pulse bg-yellow-400"
                            : sStatus === "failed"
                              ? "bg-red-400"
                              : "bg-white/20"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white">
                        {s.name}
                      </div>

                      <div className="truncate text-[11px] text-white/35">
                        {s.desc}
                      </div>
                    </div>

                    <div className="shrink-0 text-xs">
                      {sStatus === "queue" && (
                        <span className="text-white/30">Queue</span>
                      )}

                      {sStatus === "checking" && (
                        <span className="text-yellow-400/70">Checking</span>
                      )}

                      {sStatus === "available" && (
                        <span className="text-green-400">Available</span>
                      )}

                      {sStatus === "failed" && (
                        <span className="text-xs text-red-400">
                          {s.query.error?.message || "No sources available"}
                        </span>
                      )}
                    </div>
                  </button>

                  {serverSources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-5">
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
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                              isActive
                                ? "border-white/20 bg-white/15 text-white"
                                : "border-white/5 bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
                            }`}
                          >
                            <span className="font-medium">
                              {source.resolution
                                ? `${source.resolution}p`
                                : source.type.toUpperCase()}
                            </span>

                            {sourceStatus === "connecting" && (
                              <span className="text-white/30">Connecting</span>
                            )}

                            {sourceStatus === "ready" && (
                              <span className="text-green-400">Ready</span>
                            )}

                            {sourceStatus === "failed" && (
                              <span className="text-red-400">Failed</span>
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
