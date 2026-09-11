"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  sourceKey,
  SourceStatus,
} from "./player_types/server-types";

import SubtitleOverlay from "./player_components/overlay-subtitle";
import Spinner from "./player_components/spinner";
import { SkipSegment } from "./player_components/skip-segment";
import Pause from "./player_components/overlay-pause";

import { usePlayerSettings } from "./player_store/settings";
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
  const language = searchParams.get("language") || "en-US";
  const back = searchParams.get("back") === "false";
  const branding = searchParams.get("branding") || "DOMAIN";
  const dubLang =
    searchParams.get("dubLang") || searchParams.get("dublang") || "";
  const dubType =
    searchParams.get("dubType") || searchParams.get("dubtype") || "0";
  const progressParam = Number(searchParams.get("progress")) || 0;
  const subtitle_param = searchParams.get("subtitle");
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
  const [sourceStatus, setSourceStatus] = useState<SourceStatus>("queue");
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set());

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

          /*
           * Build sources and include
           * sources that previously failed.
           */
          const sources = links.map((source: QualityTrack) => ({
            type: source.type,
            link: source.link,
            resolution: source.resolution,
            status: failedSources.has(sourceKey(server.server, source.link))
              ? ("failed" as SourceStatus)
              : ("queue" as SourceStatus),
          }));

          /*
           * Server is available if it still
           * has at least one usable source.
           */
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

  useEffect(() => {
    if (server?.status !== "failed") return;

    // Try an already available server first
    const availableIndex = servers.findIndex(
      (item, index) => index !== serverIndex && item.status === "available",
    );

    if (availableIndex !== -1) {
      setServerIndex(availableIndex);
      setSourceIndex(0);
      return;
    }

    // Otherwise activate the next queued server
    const queuedIndex = servers.findIndex((item) => item.status === "queue");

    if (queuedIndex !== -1) {
      setServerIndex(queuedIndex);
      setSourceIndex(0);

      setActivatedServers((prev) => [...prev, SERVERS[queuedIndex].server]);
    }
  }, [server?.status, servers, serverIndex]);

  const clearFailedSources = (server: string) => {
    setFailedSources((prev) => {
      const next = new Set(prev);

      for (const key of next) {
        if (key.startsWith(`${server}:`)) {
          next.delete(key);
        }
      }

      return next;
    });
  };
  /*
   * Selecting a server activates its query.
   */
  const handleServerSelect = (index: number) => {
    const selectedServer = SERVERS[index];
    const query = results[index];

    setServerIndex(index);
    setSourceIndex(0);
    setSourceStatus("queue");

    if (servers[index].status === "failed") {
      clearFailedSources(selectedServer.server);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("dubLang");
      params.delete("dubType");

      router.replace(`?${params.toString()}`, { scroll: false });

      query.refetch();
    }

    setActivatedServers((prev) =>
      prev.includes(selectedServer.server)
        ? prev
        : [...prev, selectedServer.server],
    );
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
  const handleSourceFailed = () => {
    if (!server || !srcLink) return;

    const currentKey = sourceKey(server.server, srcLink);

    setFailedSources((prev) => {
      const next = new Set(prev);
      next.add(currentKey);

      const nextIndex = sources.findIndex(
        (source, index) =>
          index > sourceIndex &&
          !next.has(sourceKey(server.server, source.link)),
      );

      if (nextIndex !== -1) {
        setSourceIndex(nextIndex);
        setSourceStatus("queue");
      } else {
        setSourceStatus("failed");
      }

      return next;
    });
  };
  useEffect(() => {
    const video = videoRef.current;

    if (!video || !srcLink) {
      return;
    }

    setSourceStatus("connecting");
    /*
     * HLS
     */
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

    /*
     * DASH
     */
    if (srcType === "dash") {
      const dash = dashjs.MediaPlayer().create();

      dashRef.current = dash;

      dash.initialize(video, srcLink, true);

      dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
        const representations = dash.getRepresentationsByType("video");

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

    /*
     * MP4
     */
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

  const { data: openSubtitleData } = useOpenSubtitle({
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
    subtitles?.find(
      (subtitle) =>
        subtitle.display.toLowerCase() === subtitle_param?.toLowerCase(),
    ) ??
    openSubtitleData?.find(
      (subtitle) =>
        subtitle.display.toLowerCase() === subtitle_param?.toLowerCase(),
    );

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

  if (isMetadataError) {
    return (
      <div
        className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-black"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 60% 40%, var(--color-zinc-900), transparent 60%)",
        }}
      >
        {/* Ambient background */}

        <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
          {/* Main message */}
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl text-shadow-lg">
            We couldn&apos;t find this title
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-white/45 md:text-base text-shadow-md">
            The movie or show may have been removed, or the link may no longer
            be valid.
          </p>

          {/* Divider */}
          <div className="my-8 h-px w-16 bg-white/10" />

          {/* Small hint */}
          <p className="text-sm text-white/25 text-shadow-sm">
            Check the refresh and try again.
          </p>
        </div>
      </div>
    );
  }
  if (noWorkingServers) {
    return (
      <div
        className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-black"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 60% 40%, var(--color-zinc-900), transparent 60%)",
        }}
      >
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl text-shadow-lg">
            Unable to play this title
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-white/45 md:text-base text-shadow-md">
            None of the available servers are currently working. Please try
            again later.
          </p>

          <div className="my-8 h-px w-16 bg-white/10" />

          <p className="text-sm text-white/25 text-shadow-sm">
            Refresh the page to try again.
          </p>
        </div>
      </div>
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
        sourceStatus={sourceStatus}
        handleServerSelect={handleServerSelect}
        setServerIndex={setServerIndex}
        setSourceIndex={setSourceIndex}
        setSourceStatus={setSourceStatus}
        back={back}
        seasons={seasons}
        //
        dubs={dubs}
        onDubChange={onDubChange}
        selectedDub={selectedDub}
      />

      <Spinner waiting={waiting} canPlay={canPlay} />

      {/* <ServerModal
        servers={servers}
        serverIndex={serverIndex}
        sourceIndex={sourceIndex}
        sourceStatus={sourceStatus}
        showServer={showServer}
        setShowServer={setShowServer}
        handleServerSelect={handleServerSelect}
        setServerIndex={setServerIndex}
        setSourceIndex={setSourceIndex}
        setSourceStatus={setSourceStatus}
        canPlay={canPlay}
        playerRef={playerRef}
      /> */}
      {/* 
      <SubtitleModal
        subtitles={subtitles ?? []}
        selectedSubtitle={selectedSubtitle}
        onSubtitleChange={handleSubtitleChange}
        setSubtitlesModal={setSubtitlesModal}
        subtitlesModal={subtitlesModal}
        canPlay={canPlay}
      /> */}

      <LoadingScreen
        color={color}
        canPlay={canPlay}
        branding={branding}
        servers={servers}
        serverIndex={serverIndex}
        sourceIndex={sourceIndex}
        sourceStatus={sourceStatus}
        //
        setServerIndex={setServerIndex}
        setSourceIndex={setSourceIndex}
        setSourceStatus={setSourceStatus}
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
      {/* 
      <SubtitleOverlay
        subtitleUrl={selectedSubtitle?.file || null}
        currentTime={currentTime}
        isVisible={isVisible}
      /> */}

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
        preload="metadata"
        autoPlay={autoplay}
        onCanPlay={() => setSourceStatus("ready")}
        onError={() => {
          if (srcType === "mp4") {
            handleSourceFailed();
          }
        }}
        style={{
          filter: `brightness(${brightness}%)`,
        }}
      >
        {selectedSubtitle?.file && (
          <track
            key={selectedSubtitle.file}
            kind="subtitles"
            src={`/backend/subtitle/prox?url=${encodeURIComponent(selectedSubtitle.file)}&line=-2`}
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
