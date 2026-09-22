import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";

const desktopTips = [
  "Press Space or K to play or pause.",
  "Press F to enter fullscreen.",
  "Press M to mute or unmute.",
  "Use ← → keys to skip 15 seconds.",
];
const mobileTips = [
  "Tap twice on the left or right to skip 15 seconds.",
  "Swipe and tap to select a different server.",
];
const commonTips = [
  "Tap a failed server to try it again.",
  "Switch servers if the video gets stuck.",
  "Check your internet connection if buffering occurs.",
  "Change playback speed in the player settings.",
];

export default function DynamicTip() {
  const isMobile = useIsMobile();
  const tips = isMobile
    ? [...commonTips, ...mobileTips]
    : [...commonTips, ...desktopTips];
  const [currentTipIndex, setCurrentTipIndex] = useState(() =>
    Math.floor(Math.random() * tips.length),
  );
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // start fade out
      setTimeout(() => {
        setCurrentTipIndex(Math.floor(Math.random() * tips.length));
        setFade(true);
      }, 500);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`absolute lg:bottom-4 md:bottom-2 bottom-1 max-[340px]:bottom-0 left-1/2 -translate-x-1/2 z-60 text-center max-[340px]:text-[0.5rem] text-xs  md:text-base lg:text-lg transition-opacity duration-500 w-full p-4 max-[340px]:p-0.5 ${
        fade ? "opacity-100" : "opacity-0"
      }`}
    >
      {tips[currentTipIndex]}
    </div>
  );
}
