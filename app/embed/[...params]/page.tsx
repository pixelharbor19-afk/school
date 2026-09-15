"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDomain, getDomainWithoutSuffix } from "tldts";
import * as dashjs from "dashjs";
import Hls from "hls.js";
import { useQueries } from "@tanstack/react-query";
import { useDoubleTap } from "use-double-tap";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { useTmdbDetails } from "@/hooks/fetch-details";
import { useIntro } from "@/hooks/intro";
import { MediaOption, useOpenSubtitle } from "@/hooks/open-subtitle";
import { useSandboxDetection } from "@/hooks/useSandboxDetection";
import useSubtitle from "@/hooks/subs";
import { sourceQueryOptions, QualityTrack, DubTypes } from "@/hooks/source";
import { cn } from "@/hooks/utils";

import LoadingScreen from "@/app/embed/[...params]/player_components/loading-screen";

import VideoControls from "./player-controls";

import { useVideoControls } from "./player_hooks/use-video-controls";
import { useHiddenOverlay } from "./player_hooks/use-overlay";
import { useKeyboardControls } from "./player_hooks/use-keyboard";
import { useMobile } from "./player_hooks/use-mobile";

import {
  SERVERS,
  ServerTypes,
  SourceStatus,
} from "./player_types/server-types";

import SubtitleOverlay from "./player_components/overlay-subtitle";
import Spinner from "./player_components/spinner";
import { SkipSegment } from "./player_components/skip-segment";
import Pause from "./player_components/overlay-pause";

import { usePlayerSettings } from "./player_store/settings";
import { useTrackEmbedder } from "@/hooks/useTrackEmbedder";
import { PlayerError } from "./player_components/error";
export default function Embed() {
  const { params } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  //
  const media_type = String(params?.[0]);
  const tmdbId = String(params?.[1]);
  const season = Number(params?.[2]) || 1;
  const episode = Number(params?.[3]) || 1;
  const isMobile = useMobile();
  const requestedServer = searchParams.get("server");
  const FIRST_SERVER = SERVERS.some(
    (server) => server.server === requestedServer,
  )
    ? requestedServer!
    : "andromeda";
  const color = `#${searchParams.get("color") || "dc2626"}`;
  const autoplayParam = searchParams.get("autoplay") === "true";
  const language = searchParams.get("language") || "en-US";
  const back = searchParams.get("back") === "false";
  const brandingParam = searchParams.get("branding");
  const branding =
    brandingParam ||
    getDomainWithoutSuffix(window.location.hostname) ||
    "DOMAIN";
  const dubLang =
    searchParams.get("dubLang") || searchParams.get("dublang") || "";
  const dubType =
    searchParams.get("dubType") || searchParams.get("dubtype") || "0";
  const progressParam = Number(searchParams.get("progress")) || 0;
  const subtitle_param = searchParams.get("subtitle");
  const { mutate: trackEmbedder } = useTrackEmbedder();
  const { isSandboxed, isLoading } = useSandboxDetection();
  const [tracked, setTracked] = useState(false);
  const isIPhone =
    typeof navigator !== "undefined" &&
    /iPhone|iPod/i.test(navigator.userAgent);
  const whitelistSites = ["zxcstream"];

  const isWhitelisted =
    window.self === window.top ||
    whitelistSites.some((site) => document.referrer.includes(site));

  const {
    data: metadata,
    isError: isMetadataError,
    error: metadataError,
  } = useTmdbDetails(
    media_type,
    tmdbId,
    language,
    !isLoading && !(!isWhitelisted && isSandboxed),
  );

  const isRateLimited = metadataError?.response?.status === 429;
  const isMetadataForbidden = metadataError?.response?.status === 403;

  const title = metadata?.title || "";
  const date = metadata?.release_date;
  const latestDate = metadata?.last_air_date;

  const year = date ? String(new Date(date).getFullYear()) : "";

  const imdbId = metadata?.imdb_id || null;

  const metadataLoad = !!tmdbId && !!metadata && !!title;

  //
  const loop = usePlayerSettings((state) => state.loop);
  const autoplay = usePlayerSettings((state) => state.autoplay);
  const mirror = usePlayerSettings((state) => state.mirror);
  const brightness = usePlayerSettings((state) => state.brightness);
  const aspectRatio = usePlayerSettings((state) => state.aspectRatio);
  const quality = usePlayerSettings((state) => state.quality);

  /*
   * Only stores which servers have been activated.
   *
   * Initially only Zinogre fetches.
   */
  const [activatedServers, setActivatedServers] = useState<string[]>([
    FIRST_SERVER,
  ]);
  /*
   * Which server the user is currently viewing.
   */
  const [serverIndex, setServerIndex] = useState(
    SERVERS.findIndex((server) => server.server === FIRST_SERVER),
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  const [sourceStatuses, setSourceStatuses] = useState<
    Record<number, Record<number, SourceStatus>>
  >({});
  const [playingSource, setPlayingSource] = useState<{
    serverIndex: number;
    sourceIndex: number;
  } | null>(null);
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
        dubCode: server.dubSupport ? dubLang : "",
        dubType: server.dubSupport ? dubType : "",
        enable: metadataLoad && activatedServers.includes(server.server),
      }),
    ),
  });

  const isSourceRateLimited =
    results.length > 0 &&
    results.every((result) => result.error?.response?.status === 429);
  const isSourceForbidden =
    results.length > 0 &&
    results.every((result) => result.error?.response?.status === 403);

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

          const sources = links.map((source: QualityTrack, sourceIndex) => ({
            type: source.type,
            link: source.link,
            resolution: source.resolution,
            status: sourceStatuses[index]?.[sourceIndex] ?? "queue",
          }));

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
    [results, metadataLoad, activatedServers, sourceStatuses],
  );

  const noWorkingServers = servers.every(
    (server) => server.status === "failed",
  );

  /*
   * Current server.
   */
  const server = servers[serverIndex];
  const dubs = results[serverIndex]?.data?.dubs ?? [];

  const selectedDub =
    dubs.find(
      (dub) => dub.lanCode === dubLang && String(dub.type) === dubType,
    ) ??
    dubs.find((dub) => dub.original) ??
    dubs[0];

  const onDubChange = (dub: DubTypes) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("dubLang", dub.lanCode);
    params.set("dubType", String(dub.type));

    router.replace(`?${params.toString()}`, { scroll: false });
  };
  /*
   * Sources belong to the current server.
   */
  const sources = server?.sources ?? [];

  const currentSource = sources[sourceIndex];

  const srcLink = currentSource?.link;

  const srcType = currentSource?.type;

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
      setSourceStatuses((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });

      results[index].refetch();
    }
  };
  useEffect(() => {
    if (!server) return;

    if (server.status === "failed") {
      console.log("[PLAYER] Server failed", {
        server: server.server,
        serverIndex,
      });

      if (server.dubSupport && dubLang) {
        const params = new URLSearchParams(searchParams.toString());

        params.delete("dubLang");
        params.delete("dubType");

        router.replace(`?${params.toString()}`, { scroll: false });
        return;
      }

      const availableIndex = servers.findIndex(
        (item, index) => index !== serverIndex && item.status === "available",
      );

      if (availableIndex !== -1) {
        console.log("[PLAYER] Switching server", {
          from: server.server,
          to: servers[availableIndex].server,
        });

        handleServerSelect(availableIndex);
        return;
      }

      const queueIndex = servers.findIndex(
        (item, index) => index !== serverIndex && item.status === "queue",
      );

      if (queueIndex !== -1) {
        console.log("[PLAYER] Switching queued server", {
          from: server.server,
          to: servers[queueIndex].server,
        });

        handleServerSelect(queueIndex);
      }

      return;
    }

    if (currentSource?.status === "failed") {
      const nextSourceIndex = sourceIndex + 1;

      if (nextSourceIndex < sources.length) {
        console.log("[PLAYER] Switching source", {
          server: server.server,
          from: sourceIndex,
          to: nextSourceIndex,
        });

        setSourceIndex(nextSourceIndex);
        return;
      }

      console.log("[PLAYER] No more sources", {
        server: server.server,
        sourceIndex,
        totalSources: sources.length,
      });

      const availableIndex = servers.findIndex(
        (item, index) => index !== serverIndex && item.status === "available",
      );

      if (availableIndex !== -1) {
        console.log("[PLAYER] No more sources → switching server", {
          from: server.server,
          to: servers[availableIndex].server,
        });

        handleServerSelect(availableIndex);
        return;
      }

      const queueIndex = servers.findIndex(
        (item, index) => index !== serverIndex && item.status === "queue",
      );

      if (queueIndex !== -1) {
        console.log("[PLAYER] No more sources → switching queued server", {
          from: server.server,
          to: servers[queueIndex].server,
        });

        handleServerSelect(queueIndex);
      }
    }
  }, [
    server,
    currentSource,
    sources.length,
    serverIndex,
    sourceIndex,
    servers,
    dubLang,
    searchParams,
    router,
  ]);

  /*
   * Selecting a server activates its query.
   */

  const handleSourceFailed = () => {
    console.log("[PLAYER] Source failed", {
      server: servers[serverIndex]?.server,
      source: sourceIndex,
      type: currentSource?.type,
    });

    setSourceStatus("failed");
  };
  /*
   * Video player.
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<dashjs.MediaPlayerClass | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const progressKey =
    media_type === "tv"
      ? `tv:${tmdbId}:s${season}:e${episode}`
      : `movie:${tmdbId}`;
  const {
    playing,
    ended,
    canPlay,
    bufferedProgress,
    waiting,
    muted,
    volume,
    currentTime,
    duration,
    progress,
    progressRef,
    togglePlay,
    skipBy,
    toggleMute,
    handleVolume,
    handleSeekStart,
    handleSeekMove,
    commitSeek,
    toggleFullscreen,
    formatTime,
    skipTo,
  } = useVideoControls({
    videoRef,
    playerRef,
    serverIndex,
    sourceIndex,
    progressKey,
    dubLang,
    dubType,
    progressParam,
    tmdbId,
    media_type,
    season,
    episode,
  });

  useEffect(() => {
    if (canPlay) {
      resetTimer();
    }
  }, [canPlay]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !srcLink) return;

    setSourceStatus("connecting");

    if (srcType === "hls") {
      const hls = new Hls();

      hlsRef.current = hls;

      hls.loadSource(srcLink);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const qualities = hls.levels
          .map((level) => level.height)
          .filter((height): height is number => !!height);

        usePlayerSettings
          .getState()
          .setQualities([...new Set(qualities)].sort((a, b) => b - a));

        if (quality !== "auto") {
          const levelIndex = hls.levels.findIndex(
            (level) => level.height === quality,
          );

          if (levelIndex !== -1) {
            hls.currentLevel = levelIndex;
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        handleSourceFailed();
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (srcType === "dash") {
      const dash = dashjs.MediaPlayer().create();

      dashRef.current = dash;

      dash.initialize(video, srcLink, true);

      dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
        const representations = dash.getRepresentationsByType("video");

        if (!representations.length) {
          handleSourceFailed();
          return;
        }

        const qualities = representations
          .map((representation) => representation.height)
          .filter((height): height is number => !!height);

        usePlayerSettings
          .getState()
          .setQualities([...new Set(qualities)].sort((a, b) => b - a));
      });

      dash.on(dashjs.MediaPlayer.events.ERROR, () => {
        handleSourceFailed();
      });

      return () => {
        dash.reset();
        dashRef.current = null;
      };
    }

    video.src = srcLink;

    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [srcLink, srcType]);

  useEffect(() => {
    if (quality === "auto") {
      if (srcType === "hls" && hlsRef.current) {
        hlsRef.current.currentLevel = -1;
      }

      if (srcType === "dash" && dashRef.current) {
        dashRef.current.updateSettings({
          streaming: {
            abr: {
              autoSwitchBitrate: {
                video: true,
              },
            },
          },
        });
      }

      return;
    }

    if (srcType === "hls" && hlsRef.current) {
      const hls = hlsRef.current;

      const levelIndex = hls.levels.findIndex(
        (level) => level.height === quality,
      );

      if (levelIndex !== -1) {
        hls.currentLevel = levelIndex;
      }
    }

    if (srcType === "dash" && dashRef.current) {
      const dash = dashRef.current;

      const representations = dash.getRepresentationsByType("video");

      const qualityIndex = representations.findIndex(
        (representation) => representation.height === quality,
      );

      if (qualityIndex !== -1) {
        dash.updateSettings({
          streaming: {
            abr: {
              autoSwitchBitrate: {
                video: false,
              },
            },
          },
        });

        dash.setRepresentationForTypeByIndex("video", qualityIndex, true);
      }
    }
  }, [quality, srcType]);

  useEffect(() => {
    usePlayerSettings.getState().setQuality("auto");
    usePlayerSettings.getState().setQualities([]);
  }, [media_type, tmdbId, season, episode, serverIndex, sourceIndex]);

  const { isVisible, hideOverlay, resetTimer, lockTimer, setIsVisible } =
    useHiddenOverlay();
  const [uploadedSubtitle, setUploadedSubtitle] = useState<MediaOption | null>(
    null,
  );

  const { data: openSubtitleData, isLoading: openSubtitleLoading } =
    useOpenSubtitle({
      imdbId,
      season: media_type === "tv" ? season : undefined,
      episode: media_type === "tv" ? episode : undefined,
      enabled: metadataLoad && canPlay,
    });
  const { data: subtitles, isLoading: subtitlesLoading } = useSubtitle({
    tmdbId,
    media_type,
    season,
    episode,
    title,
    year,
    date: String(date),
    enable: metadataLoad && canPlay,
  });

  useEffect(() => {
    if (subtitlesLoading || !subtitles) return;

    if (subtitles.length > 0) {
      toast.add({
        title: "Subtitles loaded",
        description: `${subtitles.length} subtitle${
          subtitles.length === 1 ? "" : "s"
        } available`,
        type: "success",
      });
    }
  }, [subtitles, subtitlesLoading]);

  const selectedSubtitle =
    uploadedSubtitle ??
    (subtitle_param
      ? (subtitles?.find((subtitle) =>
          subtitle.display.toLowerCase().includes(subtitle_param.toLowerCase()),
        ) ??
        openSubtitleData?.find((subtitle) =>
          subtitle.display.toLowerCase().includes(subtitle_param.toLowerCase()),
        ))
      : undefined);

  const onSubtitleChange = (subtitle: MediaOption | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (subtitle?.id.startsWith("local-")) {
      setUploadedSubtitle(subtitle);
      params.delete("subtitle");
      router.replace(`?${params.toString()}`, { scroll: false });
      return;
    }

    setUploadedSubtitle(null);

    if (subtitle) {
      params.set("subtitle", subtitle.display.toLowerCase());
    } else {
      params.delete("subtitle");
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const { data: introData } = useIntro({
    imdbId,
    tmdbId,
    season,
    episode,
    enabled: media_type === "tv" && metadataLoad && canPlay,
  });

  const [skipIndicator, setSkipIndicator] = useState<"back" | "forward" | null>(
    null,
  );

  useEffect(() => {
    if (!skipIndicator) return;

    const timer = setTimeout(() => {
      setSkipIndicator(null);
    }, 600);

    return () => clearTimeout(timer);
  }, [skipIndicator]);
  const handleDoubleTap = useDoubleTap(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = x / rect.width;

      if (position < 0.33) {
        skipBy(-15);
        setSkipIndicator("back");
      } else if (position > 0.67) {
        skipBy(15);
        setSkipIndicator("forward");
      } else {
        toggleFullscreen();
      }
    },
    250,
    {
      onSingleTap: () => {
        if (isMobile) {
          setIsVisible((prev) => !prev);
        } else {
          togglePlay();
          resetTimer();
        }
      },
    },
  );

  // ─── Next Episode ────────────────────────────────────────────────────────────
  const seasons = metadata?.seasons ?? [];
  const allSeason = metadata?.seasons?.length ?? 0;
  const activeSeason = metadata?.seasons?.find(
    (s) => s.season_number === season,
  );
  const episodeCount = activeSeason?.episode_count ?? 0;

  let nextSeason = season;
  let nextEpisode = episode;
  let canNext = true;

  if (episode < episodeCount) {
    nextEpisode = episode + 1;
  } else if (season < allSeason) {
    nextSeason = season + 1;
    nextEpisode = 1;
  } else {
    canNext = false;
  }

  useEffect(() => {
    if (!canNext || !ended) return;

    const query = searchParams.toString();

    router.replace(
      `/embed/tv/${tmdbId}/${nextSeason}/${nextEpisode}${query ? `?${query}` : ""}`,
    );
  }, [canNext, ended]);

  useKeyboardControls({
    togglePlay,
    skipBy,
    toggleFullscreen,
    toggleMute,
    setSkipIndicator,
    resetTimer,
  });

  useEffect(() => {
    if (isLoading || isSandboxed || !playing || tracked) return;

    let embedder = "Direct";

    if (window.self !== window.top) {
      const referrer = document.referrer;

      if (referrer) {
        const hostname = new URL(referrer).hostname;
        embedder = getDomain(hostname) || hostname;
      } else {
        embedder = "Hidden";
      }
    }

    trackEmbedder({
      embed: getDomain(window.location.hostname) || window.location.hostname,
      embedder,
      sandbox: false,
    });

    setTracked(true);
  }, [isLoading, isSandboxed, playing, tracked]);

  if (isSandboxed) {
    return (
      <PlayerError
        title="Sandbox Detected"
        description="This player is running inside an unsupported sandbox environment."
        hint="Please contact the website owner to fix the embed configuration."
      />
    );
  }

  if (isRateLimited || isSourceRateLimited) {
    return (
      <PlayerError
        title="Too Many Requests"
        description="Too many requests have been made. Please try again later."
        hint="Wait a moment, then refresh the page to try again."
      />
    );
  }
  if (isMetadataForbidden || isSourceForbidden) {
    return (
      <PlayerError
        title="VPN Detected"
        description="Please disable your VPN or proxy connection to continue watching."
        hint="Turn off your VPN and refresh the page to try again."
      />
    );
  }
  if (isMetadataError) {
    return (
      <PlayerError
        title="We couldn't find this title"
        description="The movie or show may have been removed, or the link may no longer be valid."
        hint="This title may no longer be available."
      />
    );
  }

  if (noWorkingServers) {
    return (
      <PlayerError
        title="Unable to play this title"
        description="None of the available servers are currently working. Please try again later."
        hint="Please try again later or refresh the page."
      />
    );
  }
  return (
    <div
      ref={playerRef}
      className={cn(
        "relative h-dvh w-full overflow-hidden bg-black",
        !isVisible && canPlay && "cursor-none",
      )}
    >
      <VideoControls
        isMobile={isMobile}
        color={color}
        playing={playing}
        bufferedProgress={bufferedProgress}
        canPlay={canPlay}
        waiting={waiting}
        muted={muted}
        volume={volume}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        progressRef={progressRef}
        togglePlay={togglePlay}
        toggleMute={toggleMute}
        handleVolume={handleVolume}
        handleSeekStart={handleSeekStart}
        handleSeekMove={handleSeekMove}
        commitSeek={commitSeek}
        toggleFullscreen={toggleFullscreen}
        formatTime={formatTime}
        isVisible={isVisible}
        resetTimer={resetTimer}
        lockTimer={lockTimer}
        // toggleAspectRatio={toggleAspectRatio}
        title={title}
        media_type={media_type}
        intro={introData?.intro ?? null}
        outro={introData?.outro ?? null}
        canNext={canNext}
        onNext={() => {
          const query = searchParams.toString();
          const url = `/embed/tv/${tmdbId}/${nextSeason}/${nextEpisode}`;

          router.replace(query ? `${url}?${query}` : url);
        }}
        playerRef={playerRef}
        subtitles={subtitles ?? []}
        openSubtitleData={openSubtitleData ?? []}
        selectedSubtitle={selectedSubtitle}
        onSubtitleChange={onSubtitleChange}
        servers={servers}
        serverIndex={serverIndex}
        sourceIndex={sourceIndex}
        sourceStatus={currentSource?.status ?? "queue"}
        handleServerSelect={handleServerSelect}
        handleSourceSelect={handleSourceSelect}
        setSourceStatus={setSourceStatus}
        back={back}
        seasons={seasons}
        //
        dubs={dubs}
        onDubChange={onDubChange}
        selectedDub={selectedDub}
      />

      <Spinner waiting={waiting} canPlay={canPlay} />

      <LoadingScreen
        color={color}
        canPlay={canPlay}
        branding={branding}
        servers={servers}
        serverIndex={serverIndex}
        sourceIndex={sourceIndex}
        sourceStatus={currentSource?.status ?? "queue"}
        handleSourceSelect={handleSourceSelect}
        handleServerSelect={handleServerSelect}
      />

      <SkipSegment
        className="absolute bottom-27 right-3 z-60 md:bottom-23 md:right-5 lg:bottom-32 lg:right-7 landscape:bottom-20"
        canPlay={canPlay}
        currentTime={currentTime}
        intro={introData?.intro}
        outro={introData?.outro}
        onSkip={skipTo}
      />

      {!isIPhone && (
        <SubtitleOverlay
          subtitleUrl={selectedSubtitle?.file || null}
          currentTime={currentTime}
          isVisible={isVisible}
        />
      )}

      <AnimatePresence>
        {skipIndicator && canPlay && (
          <motion.div
            key={skipIndicator}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "pointer-events-none absolute top-1/2 z-20 -translate-y-1/2",
              "flex h-20 w-20 flex-col items-center justify-center",
              "rounded-full bg-black/50 text-white backdrop-blur-sm",
              skipIndicator === "back" ? "left-[15%]" : "right-[15%]",
            )}
          >
            <span className="text-lg font-semibold">
              {skipIndicator === "back" ? "−15" : "+15"}
            </span>

            <span className="text-[10px] text-white/60">seconds</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Pause
        metadata={metadata}
        playing={playing}
        isVisible={isVisible}
        canPlay={canPlay}
      />

      <video
        ref={videoRef}
        className={cn(
          "h-full w-full",
          aspectRatio === "contain" && "object-contain",
          aspectRatio === "cover" && "object-cover",
          aspectRatio === "fill" && "object-fill",
          mirror && "-scale-x-100",
        )}
        loop={loop}
        playsInline
        webkit-playsinline="true"
        muted={autoplayParam}
        preload="metadata"
        autoPlay={autoplay || autoplayParam}
        onCanPlay={() => {
          setSourceStatus("ready");
          setPlayingSource({
            serverIndex,
            sourceIndex,
          });
        }}
        onError={() => {
          if (srcType === "mp4") {
            handleSourceFailed();
          }
        }}
        style={{
          filter: `brightness(${brightness}%)`,
        }}
      >
        {isIPhone && selectedSubtitle?.file && (
          <track
            key={selectedSubtitle.file}
            kind="subtitles"
            src={`/backend/subtitle/prox?url=${encodeURIComponent(selectedSubtitle.file)}`}
            srcLang={selectedSubtitle.display}
            label={selectedSubtitle.display}
            default
          />
        )}
      </video>
      {canPlay && (
        <div
          className="absolute inset-0 "
          {...handleDoubleTap}
          onMouseMove={!isMobile ? resetTimer : undefined}
        />
      )}
    </div>
  );
}
