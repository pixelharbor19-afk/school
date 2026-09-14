"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/hooks/utils";
import {
  ArrowLeft,
  AudioLines,
  Captions,
  Check,
  ChevronRight,
  Download,
  Gauge,
  Hd,
  Image,
  Languages,
  Maximize,
  PictureInPicture,
  Play,
  Repeat,
  RotateCcw,
  Settings,
  Settings2,
  SquareCenterlineDashedHorizontal,
  SquareDimensions,
  Tv,
} from "lucide-react";
import { useState } from "react";
import { usePlayerSettings } from "../player_store/settings";
import { MediaOption } from "@/hooks/open-subtitle";
import { DubTypes } from "@/hooks/source";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  canPlay: boolean;
  playerRef: React.RefObject<HTMLDivElement | null>;
  subtitles: MediaOption[];
  openSubtitleData: MediaOption[];
  selectedSubtitle?: MediaOption;
  onSubtitleChange: (subtitle: MediaOption | null) => void;
  dubs: DubTypes[];
  selectedDub?: DubTypes;
  onDubChange: (dub: DubTypes) => void;
}

const TAB_TITLES = {
  main: "Player Settings",
  "source-quality": "Source Quality",
  download: "Download",
  quality: "Video Quality",
  subtitles: "Subtitles",
  audio: "Audio",
  "aspect-ratio": "Aspect Ratio",
  brightness: "Brightness",
  mirror: "Mirror",
  "picture-in-picture": "Picture-in-Picture",
  "audio-track": "Audio Track",
  "playback-speed": "Playback Speed",
  loop: "Loop",
  autoplay: "Autoplay",
} as const;

export default function ModalSettings({
  canPlay,
  playerRef,
  subtitles,
  openSubtitleData,
  selectedSubtitle,
  onSubtitleChange,
  dubs,
  selectedDub,
  onDubChange,
}: Props) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<
    | "main"
    | "source-quality"
    | "download"
    | "quality"
    | "aspect-ratio"
    | "brightness"
    | "mirror"
    | "picture-in-picture"
    | "audio-track"
    | "playback-speed"
    | "loop"
    | "autoplay"
    | "subtitles"
    | "audio"
  >("main");

  const {
    aspectRatio,
    brightness,
    mirror,
    pictureInPicture,
    playbackSpeed,
    loop,
    autoplay,
    quality,
    qualities,
    setAspectRatio,
    setBrightness,
    setMirror,
    setPictureInPicture,
    setPlaybackSpeed,
    setLoop,
    setAutoplay,
    setQuality,
  } = usePlayerSettings();

  if (!canPlay) return null;

  return (
    <Drawer
      swipeDirection={isMobile ? "down" : "right"}
      showSwipeHandle={true}
      onOpenChange={(open) => {
        if (!open) setTab("main");
      }}
    >
      <DrawerTrigger
        render={
          <button
            type="button"
            className={cn(
              "cursor-pointer text-foreground/90 hover:text-foreground shadow-2xl",
            )}
          >
            <Settings className="md:size-7 size-6" />
          </button>
        }
      >
        Settings
      </DrawerTrigger>

      <DrawerContent container={playerRef} className="mx-auto max-w-xl">
        <DrawerHeader className="flex flex-row items-center gap-2">
          {tab !== "main" && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setTab("main")}
              className="-ml-2"
            >
              <ArrowLeft className="size-5" />
            </Button>
          )}

          <div>
            <DrawerTitle className="flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground md:text-base text-sm">
              {TAB_TITLES[tab]}
            </DrawerTitle>

            {tab === "main" && (
              <DrawerDescription>
                Customize your playback experience.
              </DrawerDescription>
            )}
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "main" && (
            <div className="space-y-5">
              <SettingsCategory title="Source">
                <SettingsItem
                  label="Quality"
                  icon={<Hd className="size-5" />}
                  value={quality === "auto" ? "Auto" : `${quality}p`}
                  onClick={() => setTab("quality")}
                />
                <SettingsItem
                  label="Audio"
                  icon={<Languages className="size-5" />}
                  value={selectedDub?.lanName ?? "Original"}
                  onClick={() => setTab("audio")}
                />
                <SettingsItem
                  label="Subtitles"
                  icon={<Captions className="size-5" />}
                  value={selectedSubtitle?.display ?? "Off"}
                  onClick={() => setTab("subtitles")}
                />
              </SettingsCategory>

              <Separator className="my-4" />

              <SettingsCategory title="Media">
                <SettingsItem
                  label="Aspect Ratio"
                  icon={<SquareDimensions className="size-5" />}
                  value={
                    aspectRatio === "contain"
                      ? "Fit"
                      : aspectRatio === "cover"
                        ? "Crop"
                        : "Fill"
                  }
                  onClick={() => setTab("aspect-ratio")}
                />

                <SettingsItem
                  label="Brightness"
                  icon={<Image className="size-5" />}
                  value={`${brightness}%`}
                  onClick={() => setTab("brightness")}
                />

                <SettingsItem
                  label="Mirror"
                  icon={<SquareCenterlineDashedHorizontal className="size-5" />}
                  value={mirror ? "On" : "Off"}
                  onClick={() => setTab("mirror")}
                />

                <SettingsItem
                  label="Picture-in-Picture"
                  icon={<PictureInPicture className="size-5" />}
                  value={pictureInPicture ? "On" : "Off"}
                  onClick={() => setTab("picture-in-picture")}
                />
              </SettingsCategory>

              <Separator className="my-4" />

              <SettingsCategory title="Playback">
                <SettingsItem
                  label="Playback Speed"
                  icon={<Gauge className="size-5" />}
                  value={`${playbackSpeed}x`}
                  onClick={() => setTab("playback-speed")}
                />

                <SettingsItem
                  label="Loop"
                  icon={<Repeat className="size-5" />}
                  value={loop ? "On" : "Off"}
                  onClick={() => setTab("loop")}
                />

                <SettingsItem
                  label="Autoplay"
                  icon={<Play className="size-5" />}
                  value={autoplay ? "On" : "Off"}
                  onClick={() => setTab("autoplay")}
                />
              </SettingsCategory>
            </div>
          )}

          {tab === "source-quality" && (
            <SettingsPlaceholder text="Source quality options coming soon" />
          )}

          {tab === "download" && (
            <SettingsPlaceholder text="Download options coming soon" />
          )}

          {tab === "quality" && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setQuality("auto")}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
                  "text-left text-base transition-colors",
                  quality === "auto"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span>Auto</span>

                {quality === "auto" && (
                  <Check className="size-4 text-primary" strokeWidth={2.5} />
                )}
              </button>

              {qualities.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuality(value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
                    "text-left md:text-base text-sm transition-colors",
                    quality === value
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span>{value}p</span>

                  {quality === value && (
                    <Check className="size-4 text-primary" strokeWidth={2.5} />
                  )}
                </button>
              ))}
            </div>
          )}
          {tab === "audio" && (
            <div className="space-y-0.5">
              {dubs.map((dub) => (
                <button
                  key={`${dub.lanCode}-${dub.type}`}
                  type="button"
                  onClick={() => {
                    onDubChange(dub);
                    setTab("main");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
                    "text-left md:text-base text-sm transition-colors",
                    selectedDub?.lanCode === dub.lanCode &&
                      selectedDub?.type === dub.type
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span>{dub.lanName}</span>

                  {selectedDub?.lanCode === dub.lanCode &&
                    selectedDub?.type === dub.type && (
                      <Check
                        className="size-4 text-primary"
                        strokeWidth={2.5}
                      />
                    )}
                </button>
              ))}

              {!dubs.length && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No audio languages available
                </p>
              )}
            </div>
          )}
          {tab === "subtitles" && (
            <div className="space-y-0.5">
              <SubtitleItem
                label="Off"
                selected={!selectedSubtitle}
                onClick={() => {
                  onSubtitleChange(null);
                  setTab("main");
                }}
              />

              {subtitles.map((subtitle) => (
                <SubtitleItem
                  key={subtitle.id}
                  label={subtitle.display}
                  selected={selectedSubtitle?.id === subtitle.id}
                  onClick={() => {
                    onSubtitleChange(subtitle);
                    setTab("main");
                  }}
                />
              ))}

              {openSubtitleData.map((subtitle) => (
                <SubtitleItem
                  key={subtitle.id}
                  label={subtitle.display}
                  selected={selectedSubtitle?.id === subtitle.id}
                  onClick={() => {
                    onSubtitleChange(subtitle);
                    setTab("main");
                  }}
                />
              ))}

              {!subtitles.length && !openSubtitleData.length && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No subtitles available
                </p>
              )}
            </div>
          )}
          {tab === "aspect-ratio" && (
            <div className="space-y-1">
              {(["contain", "cover", "fill"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAspectRatio(value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
                    "md:text-base text-sm transition-colors",
                    "hover:bg-accent",
                    aspectRatio === value && "bg-accent",
                  )}
                >
                  <span>
                    {value === "contain"
                      ? "Fit"
                      : value === "cover"
                        ? "Crop"
                        : "Fill"}
                  </span>

                  {aspectRatio === value && <span>✓</span>}
                </button>
              ))}
            </div>
          )}

          {tab === "brightness" && (
            <div className="space-y-1">
              {[50, 75, 100, 125, 150].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setBrightness(value);
                    setTab("main");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
                    "text-left md:text-base text-sm transition-colors",
                    brightness === value
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span>{value}%</span>

                  {brightness === value && (
                    <Check className="size-4 text-primary" strokeWidth={2.5} />
                  )}
                </button>
              ))}
            </div>
          )}
          {tab === "mirror" && (
            <SwitchSettings
              label="Mirror"
              value={mirror}
              onChange={(value) => {
                setMirror(value);
                setTab("main");
              }}
            />
          )}

          {tab === "picture-in-picture" && (
            <SwitchSettings
              label="Picture-in-Picture"
              value={pictureInPicture}
              onChange={(value) => {
                setPictureInPicture(value);
                setTab("main");
              }}
            />
          )}

          {tab === "audio-track" && (
            <SettingsPlaceholder text="Audio track options coming soon" />
          )}

          {tab === "playback-speed" && (
            <PlaybackSpeedSettings
              value={playbackSpeed}
              onChange={(value) => {
                setPlaybackSpeed(value);
                setTab("main");
              }}
            />
          )}

          {tab === "loop" && (
            <SwitchSettings
              label="Loop"
              value={loop}
              onChange={(value) => {
                setLoop(value);
                setTab("main");
              }}
            />
          )}

          {tab === "autoplay" && (
            <SwitchSettings
              label="Autoplay"
              value={autoplay}
              onChange={(value) => {
                setAutoplay(value);
                setTab("main");
              }}
            />
          )}
        </div>

        <DrawerFooter>
          <DrawerClose
            className="w-full"
            render={<Button variant="secondary" />}
          >
            Close
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function SettingsCategory({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>

      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

interface SettingsItemProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onClick: () => void;
}

function SettingsItem({ label, icon, value, onClick }: SettingsItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-2 py-2",
        "text-left transition-colors md:text-base text-sm",
        "hover:bg-accent/70",
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:text-foreground">
        {icon}
      </span>

      <span className="min-w-0 flex-1 truncate  font-medium text-foreground">
        {label}
      </span>

      <span className="shrink-0  text-muted-foreground">{value}</span>

      <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
    </button>
  );
}

function SettingsPlaceholder({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>
  );
}
function PlaybackSpeedSettings({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="space-y-1">
      {speeds.map((speed) => (
        <button
          key={speed}
          type="button"
          onClick={() => onChange(speed)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
            "text-left md:text-base text-sm transition-colors",
            value === speed
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <span>{speed}x</span>

          {value === speed && (
            <Check className="size-4 text-primary" strokeWidth={2.5} />
          )}
        </button>
      ))}
    </div>
  );
}
function SwitchSettings({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2.5",
        "md:text-base text-sm transition-colors",
        "hover:bg-accent",
      )}
    >
      <span>{label}</span>

      <span className="text-sm text-muted-foreground">
        {value ? "On" : "Off"}
      </span>
    </button>
  );
}
function SubtitleItem({
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
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span className="truncate">{label}</span>

      {selected && (
        <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} />
      )}
    </button>
  );
}
