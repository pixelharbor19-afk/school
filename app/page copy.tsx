"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Sliders,
  Tv,
  Film,
  ArrowRight,
  Eclipse,
  ArrowRightIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Lamp from "@/components/ui/lamp";
import { Badge } from "@/components/ui/badge";

const DEFAULT_PARAMS = [
  {
    key: "server",
    label: "server",
    desc: "Set your favorite server as default.",
    example: "e.g 1",
  },
  {
    key: "domainAd",
    label: "domainAd",
    desc: "Displays a domain intro splash before the player loads.",
    example: "e.g zxcstream.icu",
  },
  {
    key: "color",
    label: "color",
    desc: "Changes the accent color of the player UI. Pass a hex code without the #.",
    example: "e.g fafafa",
  },
  {
    key: "autoplay",
    label: "autoplay",
    desc: "Automatically plays the movie but muted.",
    example: "e.g true",
  },
  {
    key: "back",
    label: "back",
    desc: "Shows a back button inside the player for navigation.",
    example: "e.g true",
  },
];

const DEFAULT_IDS = {
  movie: "",
  tv: "",
};

function useCopy() {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return { copied, copy };
}

function IdInputs({
  type,
  id,
  setId,
  season,
  setSeason,
  episode,
  setEpisode,
}: {
  type: string;
  id: string;
  setId: (value: string) => void;
  season: string;
  setSeason: (value: string) => void;
  episode: string;
  setEpisode: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        "grid mx-auto",
        type === "tv" ? "grid-cols-3 gap-3 max-w-md" : "grid-cols-1 max-w-xs",
      )}
    >
      <Input
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="ID"
        className="text-center bg-zinc-800 border-zinc-700 placeholder:text-muted-foreground"
      />

      {type === "tv" && (
        <>
          <Input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="S"
            className="bg-zinc-800 border-zinc-700 placeholder:text-muted-foreground"
          />

          <Input
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
            placeholder="EP"
            className="bg-zinc-800 border-zinc-700 placeholder:text-muted-foreground"
          />
        </>
      )}
    </div>
  );
}

function CopyBar({
  url,
  onCopy,
  copied,
}: {
  url: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="mt-6 flex items-center gap-2 px-3 py-2 bg-card rounded-md">
      <span className="text-sm text-muted-foreground truncate flex-1 font-mono text-center">
        {url}
      </span>

      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

function Player({
  type,
  id,
  setId,
  season,
  setSeason,
  episode,
  setEpisode,
}: {
  type: string;
  id: string;
  setId: (value: string) => void;
  season: string;
  setSeason: (value: string) => void;
  episode: string;
  setEpisode: (value: string) => void;
}) {
  const { copied, copy } = useCopy();

  const isReady = type === "tv" ? !!id && !!season && !!episode : !!id;

  const playerPath =
    type === "tv"
      ? `/player/tv/${id}/${season}/${episode}`
      : `/player/movie/${id}`;

  const fullUrl = `https://zxcstream.xyz${playerPath}`;

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6">
      <div className="w-full">
        <p className="text-sm text-zinc-500 uppercase tracking-widest mb-1.5 font-medium text-center">
          {type === "tv" ? "TMDB ID / SS / EP" : "TMDB ID"}
        </p>

        <IdInputs
          type={type}
          id={id}
          setId={setId}
          season={season}
          setSeason={setSeason}
          episode={episode}
          setEpisode={setEpisode}
        />

        <CopyBar url={fullUrl} onCopy={() => copy(fullUrl)} copied={copied} />
      </div>

      <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/60">
        {isReady ? (
          <iframe
            key={playerPath}
            className="h-full w-full"
            src={playerPath}
            allowFullScreen
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-muted-foreground lg:text-base text-sm">
            Enter an ID to load the player
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [type, setType] = useState("movie");
  const [id, setId] = useState(DEFAULT_IDS.movie);
  const [season, setSeason] = useState("1");
  const [episode, setEpisode] = useState("1");
  const [open, setOpen] = useState(true);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setId(DEFAULT_IDS[newType as keyof typeof DEFAULT_IDS]);
  };

  return (
    <>
      <div>
        <div
          className="relative min-h-screen  bg-slate-700 overflow-hidden"
          style={{
            background:
              "linear-gradient(to bottom,rgba(16, 29, 43,0.5), var(--background) 40%, var(--background))",
          }}
        >
          {/* <Lamp /> */}

          <div className="flex gap-3 min-h-screen max-w-[80%] mx-auto ">
            <div className="flex-1 flex justify-center  flex-col">
              <Link href="https://discord.gg/yv7wJV97Jd">
                <Badge variant="secondary" className="mb-1">
                  Join our Discord <ArrowRight />
                </Badge>
              </Link>
              <div className="flex items-center gap-3 mt-4">
                <h1
                  style={{
                    textShadow: "1px 1px 1px rgba(0,0,0,0.2)",
                  }}
                  className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tighter"
                >
                  <motion.span
                    className="bg-linear-to-r from-[rgb(237,236,233)] via-[rgb(94,84,72)] to-[rgb(172,149,119)] bg-clip-text text-transparent"
                    style={{ backgroundSize: "200% 200%" }}
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    VIDSUCK
                  </motion.span>
                </h1>
              </div>

              <p className="text-muted-foreground text-sm md:text-2xl max-w-2xl mt-8">
                Dive into endless hours of free streaming of Movies & TV Shows.
                A free, easy-to-embed player you can drop into any website
              </p>
            </div>
            <div className="flex-1 flex justify-center items-center "></div>
          </div>

          {/* <div className="">
            <div>
              <p className="text-sm text-zinc-500 uppercase tracking-widest mb-1.5 font-medium text-center">
                MEDIA TYPE
              </p>

              <div className="flex items-center justify-center mx-auto gap-1 p-0.5 bg-zinc-900 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => handleTypeChange("movie")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    type === "movie"
                      ? "bg-blue-900 shadow-md"
                      : "text-zinc-400",
                  )}
                >
                  <Film className="w-4 h-4" />
                  Movie Player
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("tv")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    type === "tv" ? "bg-blue-900 shadow-md" : "text-zinc-400",
                  )}
                >
                  <Tv className="w-4 h-4" />
                  Series Player
                </button>
              </div>
            </div>

            <Player
              type={type}
              id={id}
              setId={setId}
              season={season}
              setSeason={setSeason}
              episode={episode}
              setEpisode={setEpisode}
            />
          </div> */}
        </div>
      </div>
    </>
  );
}
