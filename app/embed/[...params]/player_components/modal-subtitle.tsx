"use client";

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MdSubtitles } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { MediaOption } from "@/hooks/open-subtitle";
import { cn } from "@/hooks/utils";
import en from "@/app/assets/en.png";
import {
  ArrowLeft,
  Captions,
  Check,
  Download,
  Settings2,
  TextInitial,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PlayerButton from "../reusable_button";
import { useSubtitleSettings } from "../player_store/subtitle-settings";

interface Props {
  subtitles: MediaOption[];
  openSubtitleData: MediaOption[];
  selectedSubtitle?: MediaOption;
  onSubtitleChange: (subtitle: MediaOption | null) => void;
  canPlay: boolean;
  playerRef: React.RefObject<HTMLDivElement | null>;
  resetTimer: () => void;
  lockTimer: () => void;
}

const TAB_TITLES = {
  main: "Subtitles",
  style: "Subtitle Style",
  delay: "Subtitle Delay",
} as const;

export default function SubtitleModal({
  subtitles,
  openSubtitleData,
  selectedSubtitle,
  onSubtitleChange,

  canPlay,
  playerRef,
  resetTimer,
  lockTimer,
}: Props) {
  const [tab, setTab] = useState<"main" | "style" | "delay">("main");
  const [subtitlesModal, setSubtitlesModal] = useState(false);
  const [customSubtitles, setCustomSubtitles] = useState<MediaOption[]>([]);

  //

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    delay,
    fontSize,
    color,
    background,
    backgroundOpacity,
    setDelay,
    setFontSize,
    setColor,
    setBackground,
    setBackgroundOpacity,
    reset,
  } = useSubtitleSettings();
  //
  const handleOpenChange = (open: boolean) => {
    setSubtitlesModal(open);

    if (!open) {
      setTab("main");
      resetTimer();
    }
  };

  if (!canPlay) return null;

  const handleSubtitleUpload = (file: File) => {
    const subtitle: MediaOption = {
      id: `local-${Date.now()}`,
      display: customSubtitles.length
        ? `Custom ${customSubtitles.length + 1}`
        : "Custom",
      file: URL.createObjectURL(file),
    };

    setCustomSubtitles((prev) => [...prev, subtitle]);
    onSubtitleChange(subtitle);
    setSubtitlesModal(false);
  };

  return (
    <Popover
      onOpenChangeComplete={(open) => {
        if (!open) {
          resetTimer();
        }
      }}
      open={subtitlesModal}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger
        render={
          <PlayerButton
            icon={MdSubtitles}
            label="Subtitle"
            onPointerMove={lockTimer}
            onPointerDown={lockTimer}
          />
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
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="text-base justify-between w-full "
                  onClick={() => inputRef.current?.click()}
                >
                  Upload subtitle
                  <Upload />
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".vtt,.srt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSubtitleUpload(file);
                      e.target.value = "";
                    }}
                  />
                </Button>
                <SubtitleItem
                  label="Off"
                  selected={!selectedSubtitle}
                  onClick={() => onSubtitleChange(null)}
                />

                {customSubtitles.map((subtitle) => (
                  <SubtitleItem
                    key={subtitle.id}
                    label={subtitle.display}
                    selected={selectedSubtitle?.id === subtitle.id}
                    onClick={() => onSubtitleChange(subtitle)}
                  />
                ))}
                {subtitles.map((subtitle) => (
                  <SubtitleItem
                    key={subtitle.id}
                    label={subtitle.display}
                    selected={selectedSubtitle?.id === subtitle.id}
                    onClick={() => onSubtitleChange(subtitle)}
                  />
                ))}
                {openSubtitleData.map((subtitle) => (
                  <SubtitleItem
                    key={subtitle.id}
                    label={subtitle.display}
                    selected={selectedSubtitle?.id === subtitle.id}
                    onClick={() => onSubtitleChange(subtitle)}
                  />
                ))}
                {!subtitles.length &&
                  !openSubtitleData.length &&
                  !customSubtitles.length && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No subtitles available
                    </p>
                  )}
              </div>
            )}

            {tab === "style" && (
              <div className="space-y-5 px-3 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Font Size</span>
                    <span className="text-xs text-muted-foreground">
                      {fontSize}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="75"
                    max="150"
                    step="5"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-sm">Text Color</span>

                  <div className="flex items-center gap-2">
                    {["#ffffff", "#ffff00", "#00ffff", "#00ff00"].map(
                      (value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setColor(value)}
                          className={cn(
                            "size-8 rounded-full border-2 transition-transform",
                            color === value
                              ? "scale-110 border-primary"
                              : "border-border",
                          )}
                          style={{ backgroundColor: value }}
                        />
                      ),
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm">Background</span>

                  <div className="flex items-center gap-2">
                    {["#000000", "#ffffff", "transparent"].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBackground(value)}
                        className={cn(
                          "size-8 rounded-md border-2 transition-transform",
                          background === value
                            ? "scale-110 border-primary"
                            : "border-border",
                        )}
                        style={{
                          backgroundColor:
                            value === "transparent" ? undefined : value,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Background Opacity</span>
                    <span className="text-xs text-muted-foreground">
                      {backgroundOpacity}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={backgroundOpacity}
                    onChange={(e) =>
                      setBackgroundOpacity(Number(e.target.value))
                    }
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            )}

            {tab === "delay" && (
              <div className="space-y-6 px-3 py-5">
                <div className="text-center">
                  <div className="text-3xl font-semibold tabular-nums">
                    {delay > 0 ? "+" : ""}
                    {delay.toFixed(1)}s
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {delay === 0
                      ? "Subtitles are synchronized"
                      : delay > 0
                        ? "Subtitles appear later"
                        : "Subtitles appear earlier"}
                  </p>
                </div>

                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  className="w-full accent-primary"
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>-10s</span>
                  <span>0s</span>
                  <span>+10s</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setDelay(0)}
                  disabled={delay === 0}
                >
                  Reset Delay
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {tab === "main" && (
          <div className="px-4 p-2 border-t flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTab("style")}
              className="flex-1"
            >
              Style <TextInitial />
            </Button>

            <div className="h-8 w-px bg-border" />

            <Button
              type="button"
              variant="ghost"
              onClick={() => setTab("delay")}
              className="flex-1"
            >
              Delay <Settings2 />
            </Button>
          </div>
        )}
        {tab === "style" && (
          <div className="p-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={reset}
              disabled={
                fontSize === 100 &&
                color === "#ffffff" &&
                background === "#000000" &&
                backgroundOpacity === 60
              }
            >
              Reset Style
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
    <Button
      type="button"
      onClick={onClick}
      variant={selected ? "secondary" : "ghost"}
      aria-current={selected}
      size="lg"
      className={cn(
        "group w-full justify-between text-base  ",
        selected ? "" : "text-muted-foreground font-normal",
      )}
    >
      <span className="truncate">{label}</span>

      {selected && <Check />}
      {!selected && label !== "Off" && (
        <Download className="size-4 opacity-0 group-hover:opacity-100" />
      )}
    </Button>
  );
}
