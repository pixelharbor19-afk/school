"use client";

import { cn } from "@/hooks/utils";
import { useSubtitleCue } from "../player_hooks/use-subtitle-cue";
import { Poppins } from "next/font/google";

interface Props {
  subtitleUrl: string | null;
  currentTime: number;
  isVisible: boolean;
}

const font = Poppins({
  weight: "500",
  subsets: ["latin"],
});

export default function SubtitleOverlay({
  subtitleUrl,
  currentTime,
  isVisible,
}: Props) {
  const cue = useSubtitleCue(subtitleUrl, currentTime);

  if (!cue) return null;

  const html = cue.replace(/<br\s*\/?>/gi, "<br />");

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 pointer-events-none z-30",
        "flex justify-center items-center",
        "transition duration-150 ease-out",
        isVisible
          ? "md:-translate-y-35 -translate-y-20"
          : "md:-translate-y-10 -translate-y-5",
        font.className,
      )}
    >
      <div
        className={cn(
          "text-white",
          "max-w-4xl",
          "p-3 rounded-md",
          "lg:text-4xl md:text-3xl sm:text-xl text-sm text-center",
          "[text-shadow:0_3px_8px_rgba(0,0,0,0.9)]",
        )}
      >
        <h1 dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
