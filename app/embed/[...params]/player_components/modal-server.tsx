"use client";

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/hooks/utils";
import {
  Airplay,
  Check,
  Cloud,
  HardDrive,
  LoaderCircle,
  Minus,
  Server,
  X,
} from "lucide-react";

import type {
  ServerTypes,
  SourceStatus,
} from "@/app/embed/[...params]/player_types/server-types";
import { useState } from "react";

interface Props {
  servers: ServerTypes[];
  serverIndex: number;
  sourceIndex: number;
  sourceStatus: SourceStatus;

  handleServerSelect: (index: number) => void;
  setServerIndex: React.Dispatch<React.SetStateAction<number>>;
  setSourceIndex: React.Dispatch<React.SetStateAction<number>>;
  setSourceStatus: React.Dispatch<React.SetStateAction<SourceStatus>>;
  canPlay: boolean;
  playerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ServerModal({
  servers,
  serverIndex,
  sourceIndex,
  sourceStatus,
  handleServerSelect,
  setServerIndex,
  setSourceIndex,
  setSourceStatus,
  canPlay,
  playerRef,
}: Props) {
  const [showServer, setShowServer] = useState(false);
  if (!canPlay) return null;

  return (
    <Popover open={showServer} onOpenChange={setShowServer}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex flex-col items-center gap-1.5",
              "text-shadow-lg transition-opacity hover:opacity-70",
            )}
          >
            <Airplay
              className="md:size-7 size-6 text-shadow-md"
              strokeWidth={2.5}
            />
          </button>
        }
      />

      <PopoverContent
        container={playerRef}
        side="top"
        align="end"
        sideOffset={18}
        className="md:w-89 w-72 overflow-hidden p-1 shadow-2xl"
      >
        <PopoverHeader className=" gap-2 border-b px-4 py-3">
          <PopoverTitle className="flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground md:text-sm text-xs">
            <Cloud className="size-5 fill-current" />
            Servers
          </PopoverTitle>
        </PopoverHeader>

        <ScrollArea className="md:max-h-80 max-h-50 pr-2">
          <div className="px-2">
            <div className="space-y-2">
              {servers.map((server, index) => (
                <div key={server.server}>
                  <ServerItem
                    server={server}
                    selected={serverIndex === index}
                    onClick={() => {
                      handleServerSelect(index);
                      setShowServer(false);
                    }}
                  />

                  {server.sources?.length > 0 && (
                    <div className="ml-4 mt-1.5 space-y-0.5 border-l pl-2">
                      {server.sources.map((source, sourceIdx) => {
                        const current =
                          serverIndex === index && sourceIdx === sourceIndex;

                        const status = current ? sourceStatus : source.status;

                        return (
                          <SourceItem
                            key={`${source.link}-${sourceIdx}`}
                            source={source}
                            current={current}
                            status={status}
                            onClick={() => {
                              setServerIndex(index);
                              setSourceIndex(sourceIdx);
                              setShowServer(false);
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="border-t p-2">
          <p className="px-3 py-1 text-center text-xs text-muted-foreground">
            Choose a server or playback quality
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ServerItem({
  server,
  selected,
  onClick,
}: {
  server: ServerTypes;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected}
      className={cn(
        "group",
        "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
        "text-left md:text-base text-sm transition-colors",
        selected
          ? "bg-accent"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <div className="min-w-0">
        <span
          className={cn(
            "md:text-base text-sm font-medium",
            server.status === "failed" && "line-through opacity-50",
          )}
        >
          {server.name}
        </span>

        <p className="mt-1 truncate md:text-sm text-xs text-muted-foreground">
          {server.message || server.desc}
        </p>
      </div>

      {server.status === "available" && (
        <Check className="size-4 shrink-0 text-primary" />
      )}

      {server.status === "checking" && (
        <LoaderCircle className="size-4 shrink-0 animate-spin" />
      )}

      {server.status === "failed" && (
        <X className="size-4 shrink-0 text-red-400" />
      )}

      {server.status === "queue" && (
        <Minus className="size-4 shrink-0 opacity-40" />
      )}
    </button>
  );
}

function SourceItem({
  source,
  current,
  status,
  onClick,
}: {
  source: ServerTypes["sources"][number];
  current: boolean;
  status: SourceStatus;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={source.status === "failed"}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2",
        "text-left transition-colors",
        current
          ? "bg-accent"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        source.status === "failed" && "cursor-not-allowed opacity-40",
      )}
    >
      <span
        className={cn(
          "text-sm font-medium",
          source.status === "failed" && "line-through",
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
          status === "connecting" && "text-muted-foreground",
          status === "failed" && "text-red-400",
          status === "queue" && "opacity-40",
        )}
      >
        {status === "connecting" ? "loading..." : status}
      </span>
    </button>
  );
}
