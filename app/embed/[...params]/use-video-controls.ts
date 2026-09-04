"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  playerRef: React.RefObject<HTMLDivElement | null>;
  serverIndex: number;
  sourceIndex: number;
};

export function useVideoControls({
  videoRef,
  playerRef,
  serverIndex,
  sourceIndex,
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
  const [playbackRate, setPlaybackRate] = useState(1);
  const isSeekingRef = useRef(false);
  const seekTimeRef = useRef(0);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      setDuration(video.duration || 0);
      setPlaying(!video.paused);
      setMuted(video.muted);
      setVolume(video.volume);
      setPlaybackRate(video.playbackRate);
      if (!isSeekingRef.current) {
        setCurrentTime(video.currentTime);
      }
      if (video.duration && video.buffered.length) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);

        setBufferedProgress(
          Math.min(100, (bufferedEnd / video.duration) * 100),
        );
      }

      if (video.duration && video.currentTime >= video.duration - 60) {
        setEnded(true);
      }
    };

    const handleCanPlay = () => {
      setCanplay(true);
      setWaiting(false);
    };

    const handleWaiting = () => {
      setWaiting(true);
    };

    video.addEventListener("timeupdate", update);
    video.addEventListener("loadedmetadata", update);
    video.addEventListener("play", update);
    video.addEventListener("pause", update);
    video.addEventListener("volumechange", update);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("progress", update);

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
    };
  }, [videoRef]);

  useEffect(() => {
    setCanplay(false);
    setWaiting(false);
    setBufferedProgress(0);
    setEnded(false);
  }, [serverIndex, sourceIndex]);

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
        screen.orientation?.unlock?.();
      } else {
        await player.requestFullscreen();

        // Rotate phone to landscape
        await screen.orientation?.lock?.("landscape").catch(() => {});
      }
    } catch {
      // Fullscreen/orientation may not be supported
    }
  };

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

  const handlePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
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
    playbackRate,
    currentTime,
    duration,
    progress,
    progressRef,
    togglePlay,
    skipBy,
    toggleMute,
    handleVolume,
    handlePlaybackRate,
    handleSeekStart,
    handleSeekMove,
    commitSeek,
    toggleFullscreen,
    formatTime,
    skipTo,
  };
}
