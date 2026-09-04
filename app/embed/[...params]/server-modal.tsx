"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, LoaderCircle, Minus, X } from "lucide-react";
import { cn } from "@/hooks/utils";
import { Poppins } from "next/font/google";
import type {
  ServerTypes,
  SourceStatus,
} from "@/app/embed/[...params]/server-types";

const font = Poppins({
  weight: "500",
  subsets: ["latin"],
});

interface Props {
  servers: ServerTypes[];
  serverIndex: number;
  sourceIndex: number;
  sourceStatus: SourceStatus;
  showServer: boolean;
  setShowServer: (enabled: boolean) => void;
  handleServerSelect: (index: number) => void;
  setServerIndex: React.Dispatch<React.SetStateAction<number>>;
  setSourceIndex: React.Dispatch<React.SetStateAction<number>>;
  setSourceStatus: React.Dispatch<React.SetStateAction<SourceStatus>>;
  color: string;
  canPlay: boolean;
}

export default function ServerModal({
  servers,
  serverIndex,
  sourceIndex,
  sourceStatus,
  showServer,
  setShowServer,
  handleServerSelect,
  setServerIndex,
  setSourceIndex,
  setSourceStatus,
  color,
  canPlay,
}: Props) {
  const glow = `0 0 6px ${color}99, 0 0 16px ${color}59`;

  return (
    <AnimatePresence>
      {showServer && canPlay && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/40"
            onClick={() => setShowServer(false)}
          />

          {/* Modal */}
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
            <div className="flex items-center justify-between border-b border-white/15 bg-black/30 px-4 py-3.5">
              <h2 className="text-sm font-medium tracking-wide text-white">
                Servers
              </h2>

              <button
                type="button"
                onClick={() => setShowServer(false)}
                className="rounded-md p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Servers */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {servers.map((server, index) => {
                  const selected = serverIndex === index;

                  return (
                    <div key={server.server}>
                      {/* Server */}
                      <motion.button
                        type="button"
                        onClick={() => handleServerSelect(index)}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: index * 0.05,
                        }}
                        style={
                          selected
                            ? {
                                borderColor: color,
                                background: `linear-gradient(to right, ${color}20, transparent)`,
                              }
                            : undefined
                        }
                        className={cn(
                          "flex w-full items-center justify-between",
                          "rounded-md border-l border-transparent px-3 py-3",
                          "text-left transition-colors",
                          !selected &&
                            "text-white/60 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <div className="min-w-0">
                          <div
                            style={
                              selected
                                ? {
                                    color,
                                    textShadow: glow,
                                  }
                                : undefined
                            }
                            className={cn(
                              "text-sm font-semibold",
                              server.status === "failed" &&
                                "line-through opacity-50",
                            )}
                          >
                            {server.name}
                          </div>

                          <p className="mt-1 truncate text-xs text-white/40">
                            {server.message || server.desc}
                          </p>
                        </div>

                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          {server.status === "available" && (
                            <Check
                              className="size-4"
                              style={
                                selected
                                  ? {
                                      color,
                                      filter: `drop-shadow(0 0 6px ${color})`,
                                    }
                                  : undefined
                              }
                              strokeWidth={2.5}
                            />
                          )}

                          {server.status === "checking" && (
                            <LoaderCircle className="size-4 animate-spin text-white/70" />
                          )}

                          {server.status === "failed" && (
                            <X className="size-4 text-red-400" />
                          )}

                          {server.status === "queue" && (
                            <Minus className="size-4 text-white/30" />
                          )}

                          {server.sources?.length > 0 && (
                            <ChevronDown
                              className={cn(
                                "size-4 text-white/30 transition-transform",
                                selected && "rotate-180",
                              )}
                            />
                          )}
                        </div>
                      </motion.button>

                      {/* Sources */}
                      <AnimatePresence initial={false}>
                        {selected && server.sources?.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-2">
                              {server.sources.map((source, sourceIdx) => {
                                const current = sourceIdx === sourceIndex;
                                const status = current
                                  ? sourceStatus
                                  : source.status;

                                return (
                                  <motion.button
                                    key={`${source.link}-${sourceIdx}`}
                                    type="button"
                                    disabled={source.status === "failed"}
                                    onClick={() => {
                                      setServerIndex(index);
                                      setSourceIndex(sourceIdx);
                                      setSourceStatus("queue");
                                    }}
                                    className={cn(
                                      "flex w-full items-center justify-between rounded-md px-3 py-2",
                                      "text-left transition-colors",
                                      current
                                        ? "text-white"
                                        : "text-white/50 hover:bg-white/5 hover:text-white/80",
                                      source.status === "failed" &&
                                        "cursor-not-allowed opacity-40",
                                    )}
                                    style={
                                      current
                                        ? {
                                            color,
                                            background: `linear-gradient(to right, ${color}18, transparent)`,
                                          }
                                        : undefined
                                    }
                                  >
                                    <span
                                      className={cn(
                                        "text-sm font-medium",
                                        source.status === "failed" &&
                                          "line-through",
                                      )}
                                    >
                                      {source.resolution
                                        ? `${source.resolution}p`
                                        : source.type.toUpperCase()}
                                    </span>

                                    <span
                                      className={cn(
                                        "text-xs capitalize",
                                        status === "ready" && "text-green-400",
                                        status === "connecting" &&
                                          "text-white/70",
                                        status === "failed" && "text-red-400",
                                        status === "queue" && "text-white/30",
                                      )}
                                    >
                                      {status === "connecting"
                                        ? "loading..."
                                        : status}
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/15 bg-black/30 px-4 py-3">
              <p className="text-center text-xs text-white/30">
                Choose a server or playback quality
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
