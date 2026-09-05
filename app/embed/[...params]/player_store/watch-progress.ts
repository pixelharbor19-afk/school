import { create } from "zustand";
import { persist } from "zustand/middleware";

type Progress = {
  currentTime: number;
  duration: number;
  updatedAt: number;
};

type WatchProgressStore = {
  progress: Record<string, Progress>;
  saveProgress: (key: string, currentTime: number, duration: number) => void;
  getProgress: (key: string) => Progress | undefined;
  clearProgress: (key: string) => void;
};

export const useWatchProgress = create<WatchProgressStore>()(
  persist(
    (set, get) => ({
      progress: {},

      saveProgress: (key, currentTime, duration) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [key]: {
              currentTime,
              duration,
              updatedAt: Date.now(),
            },
          },
        })),

      getProgress: (key) => get().progress[key],

      clearProgress: (key) =>
        set((state) => {
          const progress = { ...state.progress };
          delete progress[key];

          return { progress };
        }),
    }),
    {
      name: "watch-progress",
    },
  ),
);
