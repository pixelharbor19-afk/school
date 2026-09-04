"use client";

import { MediaOption } from "@/hooks/open-subtitle";
import { cn } from "@/hooks/utils";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownToLine,
  ArrowLeft,
  Check,
  Settings2,
  TextInitial,
  X,
} from "lucide-react";
import { Poppins } from "next/font/google";
import { useState } from "react";

const font = Poppins({
  weight: "500",
  subsets: ["latin"],
});

interface Props {
  subtitles: MediaOption[];
  selectedSubtitle?: MediaOption;
  onSubtitleChange: (subtitle: MediaOption | null) => void;
  setSubtitlesModal: (enabled: boolean) => void;
  subtitlesModal: boolean;
  canPlay: boolean
}

const TAB_TITLES = {
  main: "Subtitles",
  style: "Subtitle Style",
  delay: "Subtitle Delay",
} as const;

export default function SubtitleModal({
  subtitles,
  selectedSubtitle,
  onSubtitleChange,
  setSubtitlesModal,
  subtitlesModal,
  canPlay,
}: Props) {
  const [tab, setTab] = useState<"main" | "style" | "delay">("main");

  const handleClose = () => {
    setSubtitlesModal(false);
    setTab("main");
  };

  return (
    <AnimatePresence>
      {subtitlesModal && canPlay && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-40 bg-black/40"
            onClick={handleClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 35,
              mass: 0.8,
            }}
            className={cn(
              "absolute inset-y-0 right-0 z-50 flex w-80 flex-col",
              "rounded-l-md bg-black/40 shadow-2xl backdrop-blur-xl",
              font.className,
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-center justify-between",
                "rounded-t-md border-b border-white/15",
                "bg-black/30 px-4 py-3.5",
              )}
            >
              <div className="flex items-center gap-2">
                {tab !== "main" && (
                  <button
                    type="button"
                    onClick={() => setTab("main")}
                    aria-label="Back"
                    className={cn(
                      "-ml-1 rounded-md p-1 text-white/60",
                      "transition-colors hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                )}

                <h2 className="text-sm font-medium tracking-wide text-white">
                  {TAB_TITLES[tab]}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close subtitles panel"
                className={cn(
                  "rounded-md p-1 text-white/50",
                  "transition-colors",
                  "hover:bg-white/10 hover:text-white",
                )}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
              {tab === "style" ? (
                <StylePanel />
              ) : tab === "delay" ? (
                <DelayPanel />
              ) : (
                <div className="space-y-0.5">
                  {/* Off */}
                  <button
                    type="button"
                    onClick={() => onSubtitleChange(null)}
                    aria-current={!selectedSubtitle}
                    className={cn(
                      "group flex w-full items-center justify-between",
                      "rounded-lg px-3 py-2.5 text-left text-sm",
                      "transition-colors",
                      !selectedSubtitle
                        ? "bg-white/15 text-white"
                        : "text-white/60 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span>Off</span>

                    {!selectedSubtitle ? (
                      <Check className="size-4 shrink-0 text-red-500" />
                    ) : (
                      <ArrowDownToLine
                        className={cn(
                          "size-4 shrink-0 opacity-0",
                          "transition-opacity group-hover:opacity-60",
                        )}
                      />
                    )}
                  </button>

                  {subtitles.map((subtitle) => {
                    const isSelected = selectedSubtitle?.id === subtitle.id;

                    return (
                      <button
                        key={subtitle.id}
                        type="button"
                        onClick={() => onSubtitleChange(subtitle)}
                        aria-current={isSelected}
                        className={cn(
                          "group flex w-full items-center justify-between",
                          "rounded-lg px-3 py-2.5 text-left text-sm",
                          "transition-colors",
                          isSelected
                            ? "bg-white/15 text-white"
                            : "text-white/60 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <span className="truncate">{subtitle.display}</span>

                        {isSelected ? (
                          <Check className="size-4 shrink-0 text-red-500" />
                        ) : (
                          <ArrowDownToLine
                            className={cn(
                              "size-4 shrink-0 opacity-0",
                              "transition-opacity group-hover:opacity-60",
                            )}
                          />
                        )}
                      </button>
                    );
                  })}

                  {subtitles.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-white/40">
                      No subtitles available
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {tab === "main" && (
              <div
                className={cn(
                  "flex items-center gap-1",
                  "rounded-b-md border-t border-white/15",
                  "bg-black/30 p-2",
                )}
              >
                <button
                  onClick={() => setTab("style")}
                  type="button"
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2",
                    "rounded-lg py-2.5 text-sm font-medium text-white/70",
                    "transition-colors",
                    "hover:bg-white/10 hover:text-white",
                  )}
                >
                  <TextInitial className="size-4" strokeWidth={2.5} />
                  Style
                </button>

                <div className="h-5 w-px bg-white/10" />

                <button
                  onClick={() => setTab("delay")}
                  type="button"
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2",
                    "rounded-lg py-2.5 text-sm font-medium text-white/70",
                    "transition-colors",
                    "hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Settings2 className="size-4" strokeWidth={2.5} />
                  Delay
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StylePanel() {
  return (
    <div className="space-y-4 px-1 py-2">
      <p className="text-center text-sm text-white/40">
        Style options coming soon
      </p>
    </div>
  );
}

function DelayPanel() {
  return (
    <div className="space-y-4 px-1 py-2">
      <p className="text-center text-sm text-white/40">
        Delay controls coming soon
      </p>
    </div>
  );
}
