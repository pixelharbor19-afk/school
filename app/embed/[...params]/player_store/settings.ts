// player_store/settings.ts
import { create } from "zustand";

type AspectRatio = "contain" | "cover" | "fill";

interface PlayerSettings {
  aspectRatio: AspectRatio;
  brightness: number;
  mirror: boolean;
  pictureInPicture: boolean;
  playbackSpeed: number;
  loop: boolean;
  autoplay: boolean;
  quality: "auto" | number;
  qualities: number[];

  setAspectRatio: (value: AspectRatio) => void;
  setBrightness: (value: number) => void;
  setMirror: (value: boolean) => void;
  setPictureInPicture: (value: boolean) => void;
  setPlaybackSpeed: (value: number) => void;
  setLoop: (value: boolean) => void;
  setAutoplay: (value: boolean) => void;
  setQuality: (value: "auto" | number) => void;
  setQualities: (value: number[]) => void;
  reset: () => void;
}

const defaults = {
  aspectRatio: "contain" as AspectRatio,
  brightness: 100,
  mirror: false,
  pictureInPicture: false,
  playbackSpeed: 1,
  loop: false,
  autoplay: true,
  quality: "auto" as const,
  qualities: [],
};

export const usePlayerSettings = create<PlayerSettings>((set) => ({
  ...defaults,

  setAspectRatio: (value) => set({ aspectRatio: value }),
  setBrightness: (value) => set({ brightness: value }),
  setMirror: (value) => set({ mirror: value }),
  setPictureInPicture: (value) => set({ pictureInPicture: value }),
  setPlaybackSpeed: (value) => set({ playbackSpeed: value }),
  setLoop: (value) => set({ loop: value }),
  setAutoplay: (value) => set({ autoplay: value }),
  setQuality: (value) => set({ quality: value }),
  setQualities: (value) => set({ qualities: value }),
  reset: () => set(defaults),
}));
