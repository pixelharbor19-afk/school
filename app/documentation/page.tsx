"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Copy,
  Film,
  Tv,
  Play,
  Palette,
  Clock,
  Radio,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const PLAYER_URL = "https://vidstuck.xyz/embed";

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted/40">
      <Button
        size="icon"
        variant="ghost"
        onClick={copy}
        className="absolute right-2 top-2 h-8 w-8"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>

      <pre className="overflow-x-auto p-5 pr-14 text-sm leading-6">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        </div>

        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {children}
    </section>
  );
}

function Endpoint({
  title,
  url,
  description,
}: {
  title: string;
  url: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="font-semibold">{title}</h3>

        <Badge variant="secondary">GET</Badge>
      </div>

      <code className="block overflow-x-auto rounded-lg bg-muted px-3 py-2 text-sm">
        {url}
      </code>

      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function DocumentationPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="text-lg">@VIDSTUCK</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>

            <Link
              href="/demo"
              className="transition-colors hover:text-foreground"
            >
              Player
            </Link>

            <Link href="/documentation" className="text-foreground">
              Documentation
            </Link>

            <Link
              href="https://discord.gg/bgVHdHgHCe"
              className="transition-colors hover:text-foreground"
            >
              Discord
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-12 px-5 py-12">
        {/* Sidebar */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-28 space-y-2">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Documentation
            </p>

            {[
              ["quick-start", "Quick Start"],
              ["url-structure", "URL Structure"],
              ["customization", "Customization"],
              ["progress", "Watch Progress"],
              ["content-ids", "Content IDs"],
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 max-w-3xl flex-1 space-y-16">
          {/* Hero */}
          <div className="space-y-5">
            <Badge variant="secondary">VIDSTUCK Player</Badge>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Documentation
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Add movies, TV shows, and anime to your website with the VIDSTUCK
              player. It works through a simple iframe embed and requires almost
              no setup.
            </p>
          </div>

          <Separator />

          {/* Quick Start */}
          <Section
            id="quick-start"
            icon={Play}
            title="Quick Start"
            description="Get the VIDSTUCK player running on your website in minutes."
          >
            <div className="space-y-8">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    1
                  </div>

                  <h3 className="font-semibold">Add the Player</h3>
                </div>

                <CodeBlock>{`<iframe
  src="${PLAYER_URL}/movie/299534"
  width="100%"
  height="100%"
  frameborder="0"
  allowfullscreen
></iframe>`}</CodeBlock>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    2
                  </div>

                  <h3 className="font-semibold">Make it Responsive</h3>
                </div>

                <CodeBlock>{`<div style="position: relative; padding-bottom: 56.25%; height: 0;">
  <iframe
    src="${PLAYER_URL}/movie/299534"
    style="position: absolute; inset: 0; width: 100%; height: 100%;"
    frameborder="0"
    allowfullscreen
    allow="encrypted-media"
  ></iframe>
</div>`}</CodeBlock>

                <p className="mt-3 text-sm text-muted-foreground">
                  The 56.25% padding creates a 16:9 aspect ratio.
                </p>
              </div>
            </div>
          </Section>

          {/* URL Structure */}
          <Section
            id="url-structure"
            icon={Search}
            title="URL Structure"
            description="Use the appropriate URL depending on the type of content."
          >
            <div className="space-y-4">
              <Endpoint
                title="Movies"
                url={`${PLAYER_URL}/movie/movie_id`}
                description="Use the TMDB movie ID."
              />

              <CodeBlock>{`<!-- Avengers: Endgame -->
<iframe src="${PLAYER_URL}/movie/299534"></iframe>`}</CodeBlock>

              <Endpoint
                title="TV Shows"
                url={`${PLAYER_URL}/tv/show_id/season/episode`}
                description="Provide the TMDB show ID, season number, and episode number."
              />

              <CodeBlock>{`<!-- Game of Thrones — Season 1 Episode 1 -->
<iframe src="${PLAYER_URL}/tv/1399/1/1"></iframe>`}</CodeBlock>
            </div>
          </Section>

          {/* Customization */}
          <Section
            id="customization"
            icon={Palette}
            title="Customization"
            description="Customize the player using URL parameters."
          >
            <div>
              <h3 className="mb-2 font-semibold">Loading Screen Branding</h3>

              <p className="mb-4 text-sm text-muted-foreground">
                Customize the text displayed on the player's loading screen
                using the
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5">
                  branding
                </code>
                parameter.
              </p>

              <CodeBlock>{`<iframe
  src="${PLAYER_URL}/movie/299534?branding=vidstuck"
></iframe>`}</CodeBlock>

              <p className="mt-3 text-sm text-muted-foreground">
                Use URL encoding for spaces and special characters.
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Server Selection</h3>

              <p className="mb-4 text-sm text-muted-foreground">
                Choose which server the player should use with the
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5">
                  server
                </code>
                parameter.
              </p>

              <CodeBlock>{`<iframe
  src="${PLAYER_URL}/movie/299534?server=valstrax"
></iframe>`}</CodeBlock>

              <p className="mt-3 text-sm text-muted-foreground">
                Use the server name as the parameter value, such as{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">valstrax</code>
                .
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Subtitle Language</h3>

              <p className="mb-4 text-sm text-muted-foreground">
                Set the preferred subtitle language using the
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5">
                  subtitle
                </code>
                parameter.
              </p>

              <CodeBlock>{`<iframe
  src="${PLAYER_URL}/movie/299534?subtitle=english"
></iframe>`}</CodeBlock>

              <p className="mt-3 text-sm text-muted-foreground">
                For example, <code>subtitle=english</code> selects English
                subtitles when available.
              </p>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="mb-2 font-semibold">Color Theme</h3>

                <p className="mb-4 text-sm text-muted-foreground">
                  Set the player's accent color using a hex color without the
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5">#</code>
                  symbol.
                </p>

                <CodeBlock>{`<iframe
  src="${PLAYER_URL}/movie/299534?color=8B5CF6"
></iframe>`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Start Time</h3>

                <p className="mb-4 text-sm text-muted-foreground">
                  Start playback at a specific time in seconds.
                </p>

                <CodeBlock>{`<iframe
  src="${PLAYER_URL}/movie/299534?progress=120"
></iframe>`}</CodeBlock>

                <p className="mt-3 text-sm text-muted-foreground">
                  This example starts playback at 120 seconds.
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Next Episode</h3>

                <CodeBlock>{`<iframe
  src="${PLAYER_URL}/tv/1399/1/1?nextEpisode=true"
></iframe>`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Episode Selector</h3>

                <CodeBlock>{`<iframe
  src="${PLAYER_URL}/tv/1399/1/1?episodeSelector=true"
></iframe>`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Autoplay Next Episode</h3>

                <CodeBlock>{`<iframe
  src="${PLAYER_URL}/tv/1399/1/1?autoplayNextEpisode=true"
></iframe>`}</CodeBlock>
              </div>

              <div>
                <h3 className="mb-4 font-semibold">Available Parameters</h3>

                <div className="overflow-hidden rounded-xl border">
                  <div className="grid grid-cols-2 border-b bg-muted/40 px-4 py-3 text-sm font-medium">
                    <span>Parameter</span>
                    <span>Description</span>
                  </div>

                  {[
                    ["color", "Changes the player's accent color."],
                    [
                      "branding",
                      "Changes the text displayed on the loading screen.",
                    ],
                    ["subtitle", "Sets the preferred subtitle language."],
                    [
                      "server",
                      "Selects the preferred streaming server by name.",
                    ],
                    ["progress", "Sets the starting position in seconds."],
                    ["nextEpisode", "Shows the next episode button."],
                    [
                      "episodeSelector",
                      "Enables the season and episode selector.",
                    ],
                    [
                      "autoplayNextEpisode",
                      "Automatically plays the next episode.",
                    ],
                    ["overlay", "Enables the Netflix-style pause overlay."],
                  ].map(([name, description]) => (
                    <div
                      key={name}
                      className="grid grid-cols-2 border-b px-4 py-3 text-sm last:border-0"
                    >
                      <code>{name}</code>
                      <span className="text-muted-foreground">
                        {description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">All Features Combined</h3>

                <CodeBlock>{`<iframe
  src="${PLAYER_URL}/tv/1399/1/1?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true&color=8B5CF6&branding=VIDSTUCK&subtitle=english&server=valstrax"
></iframe>`}</CodeBlock>
              </div>
            </div>
          </Section>

          {/* Progress */}
          <Section
            id="progress"
            icon={Clock}
            title="Watch Progress"
            description="Listen for playback progress events from the embedded player."
          >
            <div className="space-y-5">
              <p className="text-muted-foreground">
                VIDSTUCK can send playback information to the parent website
                using the browser's
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-sm">
                  postMessage
                </code>
                API.
              </p>

              <CodeBlock>{`window.addEventListener("message", function (event) {
  if (typeof event.data !== "string") return;

  try {
    const data = JSON.parse(event.data);

    console.log("Progress:", data);

    // Save data to localStorage or your backend
  } catch {
    // Ignore invalid messages
  }
});`}</CodeBlock>

              <div>
                <h3 className="mb-4 font-semibold">Progress Data</h3>

                <div className="overflow-hidden rounded-xl border">
                  {[
                    ["id", "Content ID"],
                    ["type", "Content type: movie, tv, or anime"],
                    ["progress", "Watch progress percentage"],
                    ["timestamp", "Current playback position in seconds"],
                    ["duration", "Total video duration in seconds"],
                    ["season", "Season number for TV shows"],
                    ["episode", "Episode number"],
                  ].map(([name, description]) => (
                    <div
                      key={name}
                      className="grid grid-cols-2 border-b px-4 py-3 text-sm last:border-0"
                    >
                      <code>{name}</code>
                      <span className="text-muted-foreground">
                        {description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Content IDs */}
          <Section
            id="content-ids"
            icon={Film}
            title="Finding Content IDs"
            description="The player uses TMDB IDs for movies and TV shows."
          >
            <div className="space-y-5">
              <div className="rounded-xl border p-5">
                <div className="mb-3 flex items-center gap-3">
                  <Film className="h-5 w-5" />
                  <h3 className="font-semibold">TMDB</h3>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  Movie and TV show IDs can be found in the TMDB URL or through
                  the TMDB API.
                </p>

                <div className="mt-4 space-y-2">
                  <code className="block rounded-lg bg-muted px-3 py-2 text-sm">
                    themoviedb.org/movie/299534
                  </code>

                  <code className="block rounded-lg bg-muted px-3 py-2 text-sm">
                    themoviedb.org/tv/1399
                  </code>
                </div>
              </div>
            </div>
          </Section>

          {/* Footer CTA */}
          <div className="rounded-2xl border bg-muted/20 p-8 text-center">
            <Radio className="mx-auto mb-4 h-8 w-8" />

            <h2 className="text-xl font-semibold">Ready to start streaming?</h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Grab a content ID, add the iframe, and you're ready to go.
            </p>
            <Link href="/player">
              <Button className="mt-5">
                Open Player
                <ChevronRight />
              </Button>{" "}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
