"use client";

import { useState } from "react";
import { Check, Copy, Film, Play, Tv } from "lucide-react";
import Link from "next/link";

import { SERVERS } from "@/app/embed/[...params]/player_types/server-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const PLAYER_URL = "https://vidstuck.xyz/embed";

function useCopy() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  return { copied, copy };
}

export default function PlayerPage() {
  const [type, setType] = useState<"movie" | "tv">("tv");
  const [id, setId] = useState("94605");
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("1");

  const [branding, setBranding] = useState("StreameX");
  const [loadingScreen, setLoadingScreen] = useState("1"); // and 2
  const [server, setServer] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [color, setColor] = useState("");
  const [progress, setProgress] = useState("");
  const [back, setBack] = useState(true);

  const [loadedUrl, setLoadedUrl] = useState("");

  const { copied, copy } = useCopy();

  const buildPlayerUrl = () => {
    if (!id) return "";

    const contentPath =
      type === "tv" ? `/tv/${id}/${season}/${episode}` : `/movie/${id}`;

    const params = new URLSearchParams();

    if (branding) params.set("branding", branding);
    if (server) params.set("server", server);
    if (subtitle) params.set("subtitle", subtitle);
    if (color) params.set("color", color.replace("#", ""));
    if (progress) params.set("progress", progress);
    if (loadingScreen) params.set("loading", loadingScreen);
    params.set("back", String(back));

    const query = params.toString();

    return `${PLAYER_URL}${contentPath}${query ? `?${query}` : ""}`;
  };

  const handleLoadPlayer = () => {
    const url = buildPlayerUrl();

    if (!url) return;

    setLoadedUrl(url);
  };

  const handleTypeChange = (newType: "movie" | "tv") => {
    setType(newType);
    setId(newType === "movie" ? "1339713" : "94605");

    if (newType === "tv") {
      setSeason("1");
      setEpisode("1");
    }
  };

  const handleInputChange = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);
  };

  const currentUrl = buildPlayerUrl();

  return (
    <div className="select-none">
      <div className="relative min-h-screen overflow-hidden">
        {/* Header */}
        <header className="relative z-50 py-8 md:absolute md:inset-x-0 md:top-0">
          <div className="mx-auto max-w-[90%] md:max-w-[80%]">
            <nav className="flex items-center gap-8 text-sm font-medium text-muted-foreground md:text-base">
              <Link
                href="/"
                className="transition-colors hover:text-foreground"
              >
                Home
              </Link>

              <Link
                href="/demo"
                className="text-foreground transition-colors hover:text-foreground/70"
              >
                Demo
              </Link>

              <Link
                href="/documentation"
                className="transition-colors hover:text-foreground"
              >
                Documentation
              </Link>

              <Link
                href="https://discord.gg/bgVHdHgHCe"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Discord
              </Link>
            </nav>
          </div>
        </header>

        <main
          className="relative min-h-screen overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at 50% 15%, var(--color-zinc-900), transparent 55%)",
          }}
        >
          <section className="relative z-10 mx-auto w-full max-w-[90%] pb-20 pt-8 md:max-w-[80%] md:pt-32">
            {/* Heading */}
            <div className="mb-8">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Test your player
                  </h1>

                  <p className="mt-2 text-base text-muted-foreground">
                    Configure your embed and preview it below.
                  </p>
                </div>

                {loadedUrl && (
                  <span className="text-sm text-green-500 ">Player loaded</span>
                )}
              </div>
            </div>

            {/* Left / Right */}
            <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
              {/* Configuration */}
              <div className="rounded-xl bg-zinc-950/60 p-6">
                <div className="mb-7">
                  <h2 className="text-lg font-semibold">Configuration</h2>

                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Customize your player embed.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Media */}
                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">
                      Media Type
                    </label>

                    <Select
                      value={type}
                      onValueChange={(value) => {
                        if (value === "movie" || value === "tv") {
                          handleTypeChange(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {type === "movie" ? "Movie" : "TV Series"}
                        </SelectValue>
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="tv">TV Series</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="mb-3 block text-sm font-medium">
                      Content
                    </label>

                    <div className="space-y-3">
                      <Input
                        value={id}
                        onChange={(event) =>
                          handleInputChange(setId, event.target.value)
                        }
                        placeholder="Tmdb ID"
                        inputMode="numeric"
                      />

                      {type === "tv" && (
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={season}
                            onChange={(event) =>
                              handleInputChange(setSeason, event.target.value)
                            }
                            placeholder="Season"
                            inputMode="numeric"
                          />

                          <Input
                            value={episode}
                            onChange={(event) =>
                              handleInputChange(setEpisode, event.target.value)
                            }
                            placeholder="Episode"
                            inputMode="numeric"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                  {/* Parameters */}
                  <div>
                    <label className="mb-3 block text-sm font-medium">
                      Parameters
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Branding */}
                      <div className="col-span-2">
                        <label className="mb-2 block text-sm text-muted-foreground">
                          Branding
                        </label>

                        <Input
                          value={branding}
                          onChange={(event) =>
                            handleInputChange(setBranding, event.target.value)
                          }
                          placeholder="Your brand name"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-2 block text-sm text-muted-foreground">
                          Loading Screen
                        </label>

                        <Select
                          value={loadingScreen}
                          onValueChange={(value) => {
                            if (value) {
                              setLoadingScreen(value);
                            }
                          }}
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="1">Loading Screen 1</SelectItem>
                            <SelectItem value="2">Loading Screen 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Server */}
                      <div className="col-span-2">
                        <label className="mb-2 block text-sm text-muted-foreground">
                          Server
                        </label>

                        <Select
                          value={server}
                          onValueChange={(value) => {
                            if (value) {
                              setServer(value);
                            }
                          }}
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue>
                              {SERVERS.find((item) => item.server === server)
                                ?.name ?? "Select server"}
                            </SelectValue>
                          </SelectTrigger>

                          <SelectContent>
                            {SERVERS.map((item) => (
                              <SelectItem key={item.server} value={item.server}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Back */}
                      <div>
                        <label className="mb-2 block text-sm text-muted-foreground">
                          Back Button
                        </label>

                        <Select
                          value={String(back)}
                          onValueChange={(value) => {
                            if (value) {
                              setBack(value === "true");
                            }
                          }}
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue>{back ? "True" : "False"}</SelectValue>
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="false">False</SelectItem>
                            <SelectItem value="true">True</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subtitle */}
                      <div>
                        <label className="mb-2 block text-sm text-muted-foreground">
                          Subtitles
                        </label>

                        <Input
                          value={subtitle}
                          onChange={(event) =>
                            handleInputChange(setSubtitle, event.target.value)
                          }
                          placeholder="English"
                        />
                      </div>

                      {/* Color */}
                      <div className="col-span-2">
                        <label className="mb-2 block text-sm text-muted-foreground">
                          Player Color
                        </label>

                        <Input
                          value={color}
                          onChange={(event) =>
                            handleInputChange(setColor, event.target.value)
                          }
                          placeholder="e.g. FFFFFF"
                        />
                      </div>

                      {/* Progress */}
                    </div>
                  </div>

                  {/* Load */}
                  <Button
                    type="button"
                    onClick={handleLoadPlayer}
                    disabled={!id}
                    variant="secondary"
                    className="h-11 w-full text-sm"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Load Player
                  </Button>
                </div>
              </div>

              {/* Player */}
              <div className="min-w-0">
                {/* URL */}
                <div className="mb-4 flex min-w-0 items-center gap-4 rounded-xl bg-zinc-950/80 px-5 py-4">
                  <span className="shrink-0 text-sm font-medium text-zinc-500">
                    Player URL
                  </span>

                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-400">
                    {currentUrl || `${PLAYER_URL}/movie/...`}
                  </span>

                  <button
                    type="button"
                    disabled={!currentUrl}
                    onClick={() => copy(currentUrl)}
                    className="shrink-0 text-zinc-500 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Copy player URL"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-400" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Player */}
                <div className="overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/30">
                  <div className="aspect-video w-full">
                    {loadedUrl ? (
                      <iframe
                        key={loadedUrl}
                        src={loadedUrl}
                        title="VIDSTUCK Player Preview"
                        className="h-full w-full border-0"
                        allow="autoplay; fullscreen; encrypted-media"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-zinc-950 px-6 text-center">
                        <div>
                          <p className="text-lg font-medium text-zinc-300">
                            Player preview
                          </p>

                          <p className="mt-1.5 text-sm text-zinc-600">
                            Configure the player and click Load Player
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-sm text-zinc-600">
                  Changes are applied when you click Load Player.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
