import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SubtitleSettings {
  delay: number;
  fontSize: number;
  color: string;
  background: string;
  backgroundOpacity: number;

  setDelay: (value: number) => void;
  setFontSize: (value: number) => void;
  setColor: (value: string) => void;
  setBackground: (value: string) => void;
  setBackgroundOpacity: (value: number) => void;
  reset: () => void;
}

const defaults = {
  delay: 0,
  fontSize: 100,
  color: "#ffffff",
  background: "#000000",
  backgroundOpacity: 60,
};

export const useSubtitleSettings = create<SubtitleSettings>()(
  persist(
    (set) => ({
      ...defaults,

      setDelay: (value) => set({ delay: value }),
      setFontSize: (value) => set({ fontSize: value }),
      setColor: (value) => set({ color: value }),
      setBackground: (value) => set({ background: value }),
      setBackgroundOpacity: (value) => set({ backgroundOpacity: value }),

      reset: () => set(defaults),
    }),
    {
      name: "zxc-subtitle-settings",
    },
  ),
);
