"use client";

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/hooks/utils";
import { Check, Hd, Settings2 } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerSettings } from "../player_store/settings";

interface Props {
  canPlay: boolean;
  playerRef: React.RefObject<HTMLDivElement | null>;
  resetTimer: () => void;
}

export default function QualityModal({
  canPlay,
  playerRef,
  resetTimer,
}: Props) {
  const [open, setOpen] = useState(false);

  const { quality, qualities, setQuality } = usePlayerSettings();

  if (!canPlay) return null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(open) => {
        if (!open) {
          resetTimer();
        }
      }}
    >
      <PopoverTrigger
        render={
          <button className={cn("cursor-pointer hidden md:block")}>
            <h1 className="text-sm lg:text-base landscape:text-xs font-medium  text-foreground/90 hover:text-foreground tracking-wide">
              {quality === "auto" ? "Auto" : `${quality}p`}
            </h1>
          </button>
        }
      />

      <PopoverContent
        container={playerRef}
        // side="top"
        // align="end"
        sideOffset={18}
        className="w-64 overflow-hidden p-1 shadow-2xl"
      >
        <PopoverHeader className="flex items-start gap-2 border-b px-4 py-3">
          <PopoverTitle className="flex text-xs items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
            <Hd className="size-5" />
            Video Quality
          </PopoverTitle>
        </PopoverHeader>
        <ScrollArea className="max-h-80">
          <div className="space-y-0.5 p-2">
            <QualityItem
              label="Auto"
              selected={quality === "auto"}
              onClick={() => {
                setQuality("auto");
                setOpen(false);
              }}
            />

            {qualities.map((value) => (
              <QualityItem
                key={value}
                label={`${value}p`}
                selected={quality === value}
                onClick={() => {
                  setQuality(value);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function QualityItem({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
        "text-left md:text-base text-sm transition-colors",
        selected
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <span>{label}</span>

      {selected && (
        <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />
      )}
    </button>
  );
}
