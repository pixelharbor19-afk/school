import { useEffect } from "react";

type Props = {
  togglePlay: () => void;
  skipBy: (seconds: number) => void;
  toggleFullscreen: () => Promise<void>;
  toggleMute: () => void;
  setSkipIndicator: (side: "back" | "forward" | null) => void;
  resetTimer: () => void;
};

export function useKeyboardControls({
  togglePlay,
  skipBy,
  toggleFullscreen,
  toggleMute,
  setSkipIndicator,
  resetTimer,
}: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          resetTimer();
          break;

        case "ArrowRight":
          e.preventDefault();
          skipBy(10);
          setSkipIndicator("forward");
          setTimeout(() => setSkipIndicator(null), 600);
          break;

        case "ArrowLeft":
          e.preventDefault();
          skipBy(-10);
          setSkipIndicator("back");
          setTimeout(() => setSkipIndicator(null), 600);
          break;

        case "f":
          toggleFullscreen();
          break;

        case "m":
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [togglePlay, skipBy, toggleFullscreen, toggleMute, setSkipIndicator]);
}
