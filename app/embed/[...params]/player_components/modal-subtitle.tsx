"use client";

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MediaOption } from "@/hooks/open-subtitle";
import { cn } from "@/hooks/utils";
import {
  ArrowLeft,
  Captions,
  Check,
  Download,
  Settings2,
  TextInitial,
} from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  subtitles: MediaOption[];
  selectedSubtitle?: MediaOption;
  onSubtitleChange: (subtitle: MediaOption | null) => void;
  canPlay: boolean;
  playerRef: React.RefObject<HTMLDivElement | null>;
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

  canPlay,
  playerRef,
}: Props) {
  const [tab, setTab] = useState<"main" | "style" | "delay">("main");
  const [subtitlesModal, setSubtitlesModal] = useState(false);
  const handleOpenChange = (open: boolean) => {
    setSubtitlesModal(open);

    if (!open) {
      setTab("main");
    }
  };

  if (!canPlay) return null;

  return (
    <Popover open={subtitlesModal} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            className={cn(
              "flex items-center gap-2",
              "transition-opacity hover:opacity-70",
              "cursor-pointer",
            )}
          >
            {/* <Captions className="md:size-7 size-6" /> */}
            <h1 className="sm:text-sm text-xs font-medium tracking-wide text-white/90 ">
              {selectedSubtitle ? selectedSubtitle.display : "Language"}
            </h1>
          </button>
        }
      />

      <PopoverContent
        container={playerRef}
        side="top"
        align="end"
        sideOffset={18}
        className="w-89 overflow-hidden shadow-2xl p-1"
      >
        <PopoverHeader className="flex text-xs flex-row items-center gap-2 border-b px-4 py-3">
          {tab !== "main" && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setTab("main")}
              className="-ml-2"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}

          <PopoverTitle className="uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
            <Captions className="size-5" /> {TAB_TITLES[tab]}
          </PopoverTitle>
        </PopoverHeader>

        <ScrollArea className="max-h-80 pr-2">
          <div className="px-2">
            {tab === "main" && (
              <div className="space-y-0.5">
                <SubtitleItem
                  label="Off"
                  selected={!selectedSubtitle}
                  onClick={() => onSubtitleChange(null)}
                />

                {subtitles.map((subtitle) => (
                  <SubtitleItem
                    key={subtitle.id}
                    label={subtitle.display}
                    selected={selectedSubtitle?.id === subtitle.id}
                    onClick={() => onSubtitleChange(subtitle)}
                  />
                ))}

                {!subtitles.length && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No subtitles available
                  </p>
                )}
              </div>
            )}

            {tab === "style" && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Style options coming soon
              </p>
            )}

            {tab === "delay" && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Delay controls coming soon
              </p>
            )}
          </div>
        </ScrollArea>

        {tab === "main" && (
          <div className="flex items-center gap-1 border-t p-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTab("style")}
              className="flex-1"
            >
              <TextInitial className="size-4" />
              Style
            </Button>

            <div className="h-5 w-px bg-border" />

            <Button
              type="button"
              variant="ghost"
              onClick={() => setTab("delay")}
              className="flex-1"
            >
              <Settings2 className="size-4" />
              Delay
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface SubtitleItemProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function SubtitleItem({ label, selected, onClick }: SubtitleItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected}
      className={cn(
        "group",
        "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
        "text-left text-base transition-colors",
        selected
          ? "bg-accent"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <span className="truncate">{label}</span>

      {selected && <Check className="size-4 shrink-0 text-primary" />}
      {!selected && (
        <Download className="size-4 shrink-0 text-primary opacity-0 group-hover:opacity-100" />
      )}
    </button>
  );
}
