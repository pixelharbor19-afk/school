"use client";

import { useState } from "react";
import { Check, Copy, Film, Play, Tv } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PLAYER_URL = "http://localhost:3000/embed";

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
  const [type, setType] = useState<"movie" | "tv">("movie");
  const [id, setId] = useState("");
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("1");

  const [branding, setBranding] = useState("");
  const [server, setServer] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [color, setColor] = useState("");
  const [progress, setProgress] = useState("");

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
    setId("");
    setLoadedUrl("");

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
    setLoadedUrl("");
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
                href="https://discord.gg/yv7wJV97Jd"
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
                  <span className="text-sm text-green-500">
                    ● Player loaded
                  </span>
                )}
              </div>
            </div>

            {/* Main Layout */}
            <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
              {/* Left — Configuration */}
              <div className="rounded-2xl border border-white/5 bg-zinc-950/60 p-6">
                <div className="mb-7">
                  <h2 className="text-lg font-semibold">Configuration</h2>

                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Customize your player embed.
                  </p>
                </div>

                <div className="space-y-7">
                  {/* Media */}
                  <div>
                    <label className="mb-3 block text-sm font-medium">
                      Media
                    </label>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-900 p-1.5">
                      <button
                        type="button"
                        onClick={() => handleTypeChange("movie")}
                        className={cn(
                          "flex  p-2 items-center justify-center gap-2 rounded-lg text-sm font-medium transition",
                          type === "movie"
                            ? "bg-zinc-700 text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-300",
                        )}
                      >
                        <Film className="h-4 w-4" />
                        Movie
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTypeChange("tv")}
                        className={cn(
                          "flex  p-2 items-center justify-center gap-2 rounded-lg text-sm font-medium transition",
                          type === "tv"
                            ? "bg-zinc-700 text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-300",
                        )}
                      >
                        <Tv className="h-4 w-4" />
                        Series
                      </button>
                    </div>
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
                        placeholder="TMDB ID"
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

                  {/* Parameters */}
                  <div>
                    <label className="mb-3 block text-sm font-medium">
                      Parameters
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={branding}
                        onChange={(event) =>
                          handleInputChange(setBranding, event.target.value)
                        }
                        placeholder="Branding"
                        className="col-span-2"
                      />

                      <Input
                        value={server}
                        onChange={(event) =>
                          handleInputChange(setServer, event.target.value)
                        }
                        placeholder="Server"
                      />

                      <Input
                        value={subtitle}
                        onChange={(event) =>
                          handleInputChange(setSubtitle, event.target.value)
                        }
                        placeholder="Subtitle"
                      />

                      <Input
                        value={color}
                        onChange={(event) =>
                          handleInputChange(setColor, event.target.value)
                        }
                        placeholder="Color"
                      />

                      <Input
                        value={progress}
                        onChange={(event) =>
                          handleInputChange(setProgress, event.target.value)
                        }
                        placeholder="Progress"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  {/* Load */}
                  <Button
                    type="button"
                    onClick={handleLoadPlayer}
                    disabled={!id}
                    className="h-11 w-full text-sm"
                  >
                    <Play className="h-4 w-4" />
                    Load Player
                  </Button>
                </div>
              </div>

              {/* Right — Player */}
              <div className="min-w-0 space-y-4">
                <div className="flex min-w-0 items-center gap-4 rounded-xl border border-white/5 bg-zinc-950/80 px-5 py-4">
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
                <div className="overflow-hidden rounded-2xl border border-white/5 bg-black shadow-2xl shadow-black/30">
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
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
                          <Play className="h-7 w-7 text-zinc-500" />
                        </div>

                        <div>
                          <p className="text-base font-medium text-zinc-300">
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

                {/* URL */}
              </div>
            </div>

            <p className="mt-5 text-center text-sm text-zinc-600">
              Changes are applied when you click Load Player.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
