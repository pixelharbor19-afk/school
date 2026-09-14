"use client";

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/hooks/utils";
import { Check, Languages } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DubTypes } from "@/hooks/source";

interface Props {
  dubs: DubTypes[];
  selectedDub?: DubTypes;
  onDubChange: (dub: DubTypes) => void;
  canPlay: boolean;
  playerRef: React.RefObject<HTMLDivElement | null>;
  resetTimer: () => void;
}

export default function ModalDubs({
  dubs,
  selectedDub,
  onDubChange,
  canPlay,
  playerRef,
  resetTimer,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!canPlay || !dubs.length) return null;

  return (
    <Popover
      onOpenChangeComplete={(open) => {
        if (!open) resetTimer();
      }}
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger
        render={
          <button className={cn("cursor-pointer hidden md:block")}>
            <h1 className="text-sm landscape:text-xs font-medium  text-foreground/90 hover:text-foreground">
              {selectedDub?.lanName ?? "Audio"}
            </h1>
          </button>
        }
      />

      <PopoverContent
        container={playerRef}
        side="top"
        align="end"
        sideOffset={18}
        className="w-89 overflow-hidden p-1 shadow-2xl"
      >
        <PopoverHeader className="flex flex-row items-center gap-2 border-b px-4 py-3 text-xs">
          <PopoverTitle className="flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
            <Languages className="size-5" />
            Audio
          </PopoverTitle>
        </PopoverHeader>

        <ScrollArea className="max-h-80 pr-2">
          <div className="px-2 py-1">
            {dubs.length > 0 ? (
              <div className="space-y-0.5">
                {dubs.map((dub) => (
                  <DubItem
                    key={`${dub.lanCode}-${dub.type}`}
                    label={dub.lanName}
                    selected={
                      selectedDub?.lanCode === dub.lanCode &&
                      selectedDub?.type === dub.type
                    }
                    onClick={() => {
                      onDubChange(dub);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No audio languages available
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface DubItemProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function DubItem({ label, selected, onClick }: DubItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
        "text-left text-base transition-colors",
        selected
          ? "bg-accent"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <span className="truncate">{label}</span>

      {selected && <Check className="size-4 shrink-0 text-primary" />}
    </button>
  );
}
