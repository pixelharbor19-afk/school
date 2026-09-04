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

export type ServerTypes = {
  name: string;
  server: string;
  status: ServerStatus;
  desc: string;
  message?: string;
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
    },
    {
      name: "Valstrax I",
      server: "valstrax",
      status: "queue",
      desc: "HD Quality & Reliable",
    },
    {
      name: "Alatreon II",
      server: "alatreon",
      status: "queue",
      desc: "Extensive Movie & TV Library",
    },
  ];

  const [servers, setServers] = useState<ServerTypes[]>(initialServers);
  const [serverIndex, setServerIndex] = useState(0);

  const server = servers[serverIndex];

  const [sources, setSources] = useState<SourceTypes[]>([]);
  const [sourceIndex, setSourceIndex] = useState(0);

  const currentSource = sources[sourceIndex];
  const srcLink = currentSource?.link;
  const srcType = currentSource?.type;

  const [playing, setPlaying] = useState<{
    server: string;
    sourceIndex: number;
  } | null>(null);

  console.log(sources);

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
    path: server.server,
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
    if (!source?.links) return;

    setSources(
      source.links.map((source) => ({
        ...source,
        status: "queue",
      })),
    );
  }, [source]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !srcLink) return;

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

        handleSourceFail();
      });

      return () => hls.destroy();
    }

    if (srcType === "dash") {
      const dash = dashjs.MediaPlayer().create();

      dash.initialize(video, srcLink, true);

      dash.on(dashjs.MediaPlayer.events.ERROR, () => {
        handleSourceFail();
      });

      return () => dash.reset();
    }

    video.src = srcLink;

    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [srcLink, srcType]);

  const handleServerChecking = (checkingServer: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.server === checkingServer && server.status !== "checking"
          ? {
              ...server,
              status: "checking",
            }
          : server,
      ),
    );
  };

  const handleServerFail = (
    failedServer: string,
    message = "Unknown error",
  ) => {
    if (playing?.server === failedServer) {
      setPlaying(null);
    }

    // Don't switch servers if this is an old/concurrent request
    // from a server the user has already switched away from.
    if (server.server !== failedServer) {
      setServers((prev) =>
        prev.map((server) =>
          server.server === failedServer
            ? {
                ...server,
                status: "failed",
                message,
              }
            : server,
        ),
      );

      return;
    }

    setServers((prev) => {
      const available = prev.findIndex(
        (server) =>
          server.server !== failedServer && server.status === "available",
      );

      const nextQueue =
        available === -1
          ? prev.findIndex(
              (server) =>
                server.server !== failedServer && server.status === "queue",
            )
          : -1;

      const nextServer = available !== -1 ? available : nextQueue;

      if (nextServer !== -1) {
        setServerIndex(nextServer);
        setSources([]);
        setSourceIndex(0);
      }

      return prev.map((server) =>
        server.server === failedServer
          ? {
              ...server,
              status: "failed",
              message,
            }
          : server,
      );
    });
  };

  const handleServerAvailable = (availableServer: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.server === availableServer && server.status !== "available"
          ? {
              ...server,
              status: "available",
            }
          : server,
      ),
    );
  };

  useEffect(() => {
    if (sourceLoading) {
      handleServerChecking(server.server);
    }
  }, [sourceLoading, server.server]);
  useEffect(() => {
    if (isSourceSuccess && source?.server) {
      handleServerAvailable(source.server);
    }
  }, [isSourceSuccess, source]);

  useEffect(() => {
    if (isSourceError && sourceError?.response?.data?.server) {
      handleServerFail(
        sourceError.response.data.server,
        sourceError.response.data.error,
      );
    }
  }, [isSourceError, sourceError]);

  const handleSourceConnecting = () => {
    setSources((prev) =>
      prev.map((source, index) =>
        index === sourceIndex && source.status !== "connecting"
          ? {
              ...source,
              status: "connecting",
            }
          : source,
      ),
    );
  };

  const handleSourceAvailable = () => {
    setSources((prev) =>
      prev.map((source, index) =>
        index === sourceIndex && source.status !== "ready"
          ? {
              ...source,
              status: "ready",
            }
          : source,
      ),
    );

    setPlaying({
      server: server.server,
      sourceIndex,
    });
  };

  const handleSourceFail = () => {
    setSources((prev) =>
      prev.map((source, index) =>
        index === sourceIndex
          ? {
              ...source,
              status: "failed",
              message: "Source failed",
            }
          : source,
      ),
    );

    if (
      playing?.server === server.server &&
      playing?.sourceIndex === sourceIndex
    ) {
      setPlaying(null);
    }

    if (sourceIndex < sources.length - 1) {
      setSourceIndex((prev) => prev + 1);
    } else {
      handleServerFail(server.server, "All sources failed");
    }
  };
  useEffect(() => {
    if (srcLink) {
      handleSourceConnecting();
    }
  }, [srcLink]);

  const handleServerSelect = (index: number) => {
    if (index === serverIndex) return;

    setServers((prev) =>
      prev.map((server, i) =>
        i === index
          ? {
              ...server,
              status: "checking",
            }
          : server,
      ),
    );

    setServerIndex(index);
    setSources([]);
    setSourceIndex(0);
  };
  const handleSourceSelect = (index: number) => {
    if (index === sourceIndex) return;

    setSourceIndex(index);
  };

  return (
    <div className="relative h-dvh w-full bg-black">
      <div className="absolute top-0 left-0 w-full max-w-md p-6">
        {/* Servers */}
        <div className="space-y-2">
          {servers.map((item, index) => (
            <div
              key={item.server}
              onClick={() => handleServerSelect(index)}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {item.status === "queue" && (
                  <span className="text-zinc-500">Waiting</span>
                )}

                {item.status === "checking" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking</span>
                  </>
                )}

                {item.status === "available" && (
                  <>
                    <Check className="h-4 w-4" />
                    <span> Available</span>
                  </>
                )}
                {playing?.server === item.server && (
                  <span className="text-green-400">Playing</span>
                )}
                {item.status === "failed" && (
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <X className="h-4 w-4" />
                      <span className="text-red-400">Failed</span>
                    </div>

                    {item.message && (
                      <p className="mt-1 max-w-50 text-xs text-zinc-500">
                        {item.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Sources
            </div>

            <div className="space-y-2">
              {sources.map((item, index) => (
                <div
                  key={`${item.type}-${index}`}
                  onClick={() => handleSourceSelect(index)}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.resolution
                        ? `${item.resolution}p`
                        : item.type.toUpperCase()}
                    </p>
                    <p className="text-xs text-zinc-500 uppercase">
                      {item.type}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {item.status === "queue" && (
                      <span className="text-zinc-500">Waiting</span>
                    )}

                    {item.status === "connecting" && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Connecting</span>
                      </>
                    )}

                    {item.status === "ready" && (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Ready</span>
                      </>
                    )}
                    {playing?.server === server.server &&
                      playing?.sourceIndex === index && (
                        <span className="text-green-400">Playing</span>
                      )}
                    {item.status === "failed" && (
                      <>
                        <X className="h-4 w-4" />
                        <span className="text-red-400">Failed</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <video
        ref={videoRef}
        className="h-full w-full"
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        autoPlay
        onCanPlay={() => {
          handleSourceAvailable();
        }}
        onError={srcType === "mp4" ? handleSourceFail : undefined}
      />
    </div>
  );
}
