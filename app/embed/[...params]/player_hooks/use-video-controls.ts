"use client";

import { useEffect, useRef, useState } from "react";
import { useWatchProgress } from "../player_store/watch-progress";
import { usePlayerSettings } from "../player_store/settings";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  playerRef: React.RefObject<HTMLDivElement | null>;
  serverIndex: number;
  sourceIndex: number;
  progressKey: string;
  dubLang: string;
  dubType: string;
  progressParam: number;
};

export function useVideoControls({
  videoRef,
  playerRef,
  serverIndex,
  sourceIndex,
  progressKey,
  dubLang,
  dubType,
  progressParam,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanplay] = useState(false);
  const [ended, setEnded] = useState(false);
  const [bufferedProgress, setBufferedProgress] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isSeekingRef = useRef(false);
  const seekTimeRef = useRef(0);
  const progressRef = useRef<HTMLDivElement>(null);
  //
  const hasRestoredRef = useRef(false);
  const lastSaveRef = useRef(0);

  // settings store state
  const playbackSpeed = usePlayerSettings((state) => state.playbackSpeed);
  const pictureInPicture = usePlayerSettings((state) => state.pictureInPicture);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    //old - without progress saving
    // const update = () => {
    //   setDuration(video.duration || 0);
    //   setPlaying(!video.paused);
    //   setMuted(video.muted);
    //   setVolume(video.volume);
    //   setPlaybackRate(video.playbackRate);
    //   if (!isSeekingRef.current) {
    //     setCurrentTime(video.currentTime);
    //   }
    //   if (video.duration && video.buffered.length) {
    //     const bufferedEnd = video.buffered.end(video.buffered.length - 1);

    //     setBufferedProgress(
    //       Math.min(100, (bufferedEnd / video.duration) * 100),
    //     );
    //   }

    //   if (video.duration && video.currentTime >= video.duration - 60) {
    //     setEnded(true);
    //   }
    // };

    const update = () => {
      setDuration(video.duration || 0);
      setPlaying(!video.paused);
      setMuted(video.muted);
      setVolume(video.volume);

      if (!isSeekingRef.current) {
        setCurrentTime(video.currentTime);
      }

      if (video.duration && video.buffered.length) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);

        setBufferedProgress(
          Math.min(100, (bufferedEnd / video.duration) * 100),
        );
      }

      if (hasRestoredRef.current && video.duration > 0) {
        const now = Date.now();

        if (now - lastSaveRef.current >= 1000) {
          lastSaveRef.current = now;

          useWatchProgress
            .getState()
            .saveProgress(progressKey, video.currentTime, video.duration);
        }
      }
    };
    // const handleCanPlay = () => {
    //   setCanplay(true);
    //   setWaiting(false);

    //   if (!hasRestoredRef.current) {
    //     const saved = useWatchProgress.getState().getProgress(progressKey);

    //     if (
    //       saved &&
    //       saved.currentTime > 5 &&
    //       saved.currentTime < video.duration
    //     ) {
    //       video.currentTime = saved.currentTime;
    //       setCurrentTime(saved.currentTime);
    //     }

    //     hasRestoredRef.current = true;
    //   }
    // };

    //progress params
    const handleCanPlay = () => {
      setCanplay(true);
      setWaiting(false);

      if (!hasRestoredRef.current) {
        const saved = useWatchProgress.getState().getProgress(progressKey);

        const startTime =
          progressParam > 0
            ? progressParam
            : saved && saved.currentTime > 5
              ? saved.currentTime
              : 0;

        if (startTime > 0 && startTime < video.duration) {
          video.currentTime = startTime;
          setCurrentTime(startTime);
        }

        hasRestoredRef.current = true;
      }
    };
    const handleWaiting = () => {
      setWaiting(true);
    };

    const handleEnded = () => {
      setEnded(true);
      setPlaying(false);
      useWatchProgress.getState().clearProgress(progressKey);
    };
    video.addEventListener("timeupdate", update);
    video.addEventListener("loadedmetadata", update);
    video.addEventListener("play", update);
    video.addEventListener("pause", update);
    video.addEventListener("volumechange", update);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("progress", update);
    video.addEventListener("ended", handleEnded);

    update();

    return () => {
      video.removeEventListener("timeupdate", update);
      video.removeEventListener("loadedmetadata", update);
      video.removeEventListener("play", update);
      video.removeEventListener("pause", update);
      video.removeEventListener("volumechange", update);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("progress", update);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoRef, progressKey]);

  useEffect(() => {
    hasRestoredRef.current = false;
    lastSaveRef.current = 0;

    setCanplay(false);
    setWaiting(false);
    setBufferedProgress(0);
    setEnded(false);
    setCurrentTime(0);
    setDuration(0);
  }, [serverIndex, sourceIndex, progressKey, dubLang, dubType]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackSpeed;
  }, [videoRef, playbackSpeed]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (pictureInPicture) {
      video.requestPictureInPicture().catch(() => {
        usePlayerSettings.getState().setPictureInPicture(false);
      });
    } else if (document.pictureInPictureElement === video) {
      document.exitPictureInPicture().catch(() => {});
    }
  }, [pictureInPicture, videoRef]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLeave = () => {
      usePlayerSettings.getState().setPictureInPicture(false);
    };

    video.addEventListener("leavepictureinpicture", handleLeave);

    return () => {
      video.removeEventListener("leavepictureinpicture", handleLeave);
    };
  }, [videoRef]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };
  const skipBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(
      0,
      Math.min(video.duration || Infinity, video.currentTime + seconds),
    );

    setCurrentTime(video.currentTime);
  };
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const handleVolume = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    video.muted = value === 0;
  };

  const getSeekTime = (clientX: number) => {
    const progress = progressRef.current;
    if (!progress || !duration) return 0;

    const rect = progress.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width),
    );

    return percent * duration;
  };

  const handleSeekStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    isSeekingRef.current = true;

    const time = getSeekTime(e.clientX);

    seekTimeRef.current = time;
    setCurrentTime(time);
  };

  const handleSeekMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSeekingRef.current) return;

    const time = getSeekTime(e.clientX);

    seekTimeRef.current = time;
    setCurrentTime(time);
  };

  const commitSeek = () => {
    if (!isSeekingRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = seekTimeRef.current;

    setCurrentTime(seekTimeRef.current);
    isSeekingRef.current = false;
  };
  const toggleFullscreen = async () => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        (screen.orientation as any).unlock?.();
      } else {
        await player.requestFullscreen();
        await (screen.orientation as any).lock?.("landscape").catch(() => {});
      }
    } catch {
      // Fullscreen/orientation may not be supported
    }
  };
  // const toggleFullscreen = async () => {
  //   const player = playerRef.current;
  //   if (!player) return;

  //   try {
  //     if (document.fullscreenElement) {
  //       await document.exitFullscreen();
  //       screen.orientation?.unlock?.();
  //     } else {
  //       await player.requestFullscreen();

  //       // Rotate phone to landscape
  //       await screen.orientation?.lock?.("landscape").catch(() => {});
  //     }
  //   } catch {
  //     // Fullscreen/orientation may not be supported
  //   }
  // };

  // const toggleFullscreen = async () => {
  //   const player = playerRef.current;
  //   if (!player) return;

  //   if (document.fullscreenElement) {
  //     await document.exitFullscreen();
  //   } else {
  //     await player.requestFullscreen();
  //   }
  // };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return "00:00";

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        seconds,
      ).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const skipTo = (time: number) => {
    const video = videoRef.current;

    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  };
  return {
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
  };
}
