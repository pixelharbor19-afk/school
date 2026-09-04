"use client";

import { useTmdbDetails } from "@/hooks/fetch-details";
import useSource from "@/hooks/source";
import { useSandboxDetection } from "@/hooks/useSandboxDetection";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import * as dashjs from "dashjs";
import LoadingScreen from "@/app/load/page";
import { Check, Loader2, X } from "lucide-react";

export type SourceStatus = "queue" | "connecting" | "ready" | "failed";

export type SourceTypes = {
  type: "mp4" | "hls" | "dash";
  link: string;
  resolution?: number;
  status: SourceStatus;
  message?: string;
};

export type ServerStatus = "queue" | "checking" | "available" | "failed";

type ServerTypes = {
  name: string;
  server: string;
  status: ServerStatus;
  desc: string;
  message?: string;
  sources: SourceTypes[];
};

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

  const {
    data: metadata,
    isError: isMetadataError,
    error: metadataError,
    refetch: refetchTmdb,
  } = useTmdbDetails(
    media_type,
    tmdbId,
    language,
    !isLoading && !(!isWhitelisted && isSandboxed),
  );

  const title = metadata?.title || "";
  const date = metadata?.release_date;
  const latestDate = metadata?.last_air_date;
  const year = date ? String(new Date(date).getFullYear()) : "";
  const genre = metadata?.genres?.[0]?.name ?? "N/A";
  const seasons = metadata?.seasons ?? [];
  const logo = metadata?.logo_paths?.[0] ?? null;
  const imdbId = metadata?.imdb_id || null;

  const metadataLoad = !!tmdbId && !!metadata && !!title;

  const initialServers: ServerTypes[] = [
    {
      name: "Zinogre I",
      server: "zinogre",
      status: "queue",
      desc: "Movies & TV Shows - HD Support",
      sources: [],
    },
    {
      name: "Valstrax I",
      server: "valstrax",
      status: "queue",
      desc: "HD Quality & Reliable",
      sources: [],
    },
    {
      name: "Alatreon II",
      server: "alatreon",
      status: "queue",
      desc: "Extensive Movie & TV Library",
      sources: [],
    },
  ];

  const [servers, setServers] = useState<ServerTypes[]>(initialServers);
  const [serverIndex, setServerIndex] = useState(0);
  console.log(servers);
  const server = servers[serverIndex];

  const [sources, setSources] = useState<SourceTypes[]>([]);
  const [sourceIndex, setSourceIndex] = useState(0);

  const currentSource = sources[sourceIndex];
  const srcLink = currentSource?.link;
  const srcType = currentSource?.type;

  const [playing, setPlaying] = useState<{
    serverIndex: number;
    sourceIndex: number;
  } | null>(null);

  console.log(sources);

  const path = server.server;
  const {
    data: source,
    isError: isSourceError,
    isSuccess: isSourceSuccess,
    isLoading: sourceLoading,
    error: sourceError,
    refetch: refetchSource,
  } = useSource({
    media_type,
    tmdbId,
    season,
    episode,
    path,
    imdbId,
    title,
    year,
    date: String(date),
    ...(latestDate && { latestDate }),
    enable: metadataLoad,
    dubCode: dubLang,
    dubType: dubType,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;

    if (!video || !srcLink) return;

    handleSourceConnecting(sourceIndex);

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

        handleSourceFailed here
      });

      return () => hls.destroy();
    }

    if (srcType === "dash") {
      const dash = dashjs.MediaPlayer().create();

      dash.initialize(video, srcLink, true);

      dash.on(dashjs.MediaPlayer.events.ERROR, () => {
        handleSourceFailed(sourceIndex);
      });

      return () => dash.reset();
    }

    video.src = srcLink;

    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [srcLink, srcType]);

  // Mark the current server as available after its sources are fetched successfully
  const handleServerAvailable = (serverName: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.server === serverName
          ? {
              ...server,
              status: "available",
            }
          : server,
      ),
    );
  };
  // Mark the current server as checking while its sources are being fetched
  const handleServerChecking = (serverName: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.server === serverName && server.status !== "checking"
          ? {
              ...server,
              status: "checking",
            }
          : server,
      ),
    );
  };
  //
  const handleServerFailed = (serverName: string, message: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.server === serverName
          ? {
              ...server,
              status: "failed",
              message,
            }
          : server,
      ),
    );
  };
  //
  useEffect(() => {
    if (sourceLoading && path) {
      handleServerChecking(path);
    }
  }, [sourceLoading, path]);

  useEffect(() => {
    if (isSourceError && sourceError?.response?.data?.server) {
      handleServerFailed(
        sourceError.response.data.server,
        sourceError.response.data.error,
      );
    }
  }, [isSourceError, sourceError]);

  useEffect(() => {
    if (isSourceSuccess && source?.server) {
      handleServerAvailable(source.server);

      setSources(
        source.links.map((link) => ({
          ...link,
          status: "queue",
        })),
      );
      setSourceIndex(0);
    }
  }, [isSourceSuccess, source]);

  //sources effects
  const handleSourceConnecting = (sourceIndex: number) => {
    setSources((prev) =>
      prev.map((source, index) =>
        index === sourceIndex
          ? {
              ...source,
              status: "connecting",
            }
          : source,
      ),
    );
  };

  const handleSourceReady = (sourceIndex: number) => {
    setSources((prev) =>
      prev.map((source, index) =>
        index === sourceIndex
          ? {
              ...source,
              status: "ready",
            }
          : source,
      ),
    );
  };

  const handleSourceFailed = (sourceIndex: number) => {
    setSources((prev) =>
      prev.map((source, index) =>
        index === sourceIndex
          ? {
              ...source,
              status: "failed",
            }
          : source,
      ),
    );
  };

  return (
    <div className="relative h-dvh w-full bg-black">
      <div className="absolute bottom-6 left-1/2 w-full max-w-md -translate-x-1/2 px-4">
        <div className="rounded-xl border border-white/10 bg-black/80 p-3 backdrop-blur-md">
          <div className="mb-2 px-1 text-xs font-medium text-white/50">
            Servers
          </div>

          <div className="space-y-2">
            {servers.map((server, index) => (
              <button
                key={server.server}
                onClick={() => setServerIndex(index)}
                disabled={server.status === "checking"}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${
                  index === serverIndex
                    ? "border-white/20 bg-white/10"
                    : "border-white/5 bg-white/[0.03]"
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-white">
                    {server.name}
                  </div>
                </div>

                {server.status === "queue" && (
                  <span className="text-xs text-white/40">Queue</span>
                )}

                {server.status === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                )}

                {server.status === "available" && (
                  <Check className="h-4 w-4 text-green-400" />
                )}

                {server.status === "failed" && (
                  <X className="h-4 w-4 text-red-400" />
                )}
              </button>
            ))}
          </div>

          {sources.length > 0 && (
            <>
              <div className="mb-2 mt-4 px-1 text-xs font-medium text-white/50">
                Sources
              </div>

              <div className="grid grid-cols-2 gap-2">
                {sources.map((source, index) => (
                  <button
                    key={`${source.type}-${source.resolution}-${index}`}
                    onClick={() => setSourceIndex(index)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                      index === sourceIndex
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/5 bg-white/[0.03] text-white/60"
                    }`}
                  >
                    <span>
                      {source.resolution
                        ? `${source.resolution}p`
                        : source.type}
                    </span>

                    {source.status === "queue" && (
                      <span className="text-xs text-white/30">Queue</span>
                    )}

                    {source.status === "connecting" && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {source.status === "ready" && (
                      <Check className="h-4 w-4 text-green-400" />
                    )}

                    {source.status === "failed" && (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <video
        ref={videoRef}
        className="h-full w-full"
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        autoPlay
        onCanPlay={() => handleSourceReady(sourceIndex)}
        onError={() => {
          if (srcType === "mp4") {
            handleSourceFailed(sourceIndex);
          }
        }}
      />
    </div>
  );
}
