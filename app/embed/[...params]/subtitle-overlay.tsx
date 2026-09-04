"use client";

import { cn } from "@/hooks/utils";
import { useSubtitleCue } from "./use-subtitle-cue";
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

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 p-4",
        "flex items-center justify-center",
        "whitespace-pre-line",
        "lg:text-4xl md:text-3xl text-lg  text-center",
        "[text-shadow:-2px_-2px_0_black,2px_-2px_0_black,-2px_2px_0_black,2px_2px_0_black]",
        "transition duration-150 ease-out",
        isVisible ? "-translate-y-30" : "-translate-y-10",
        font.className,
      )}
    >
      {cue.replace(/<br\s*\/?>/gi, "\n")}
    </div>
  );
}
