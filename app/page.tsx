"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTmdbPopularMovies } from "@/hooks/fetch-popular";
import { cn } from "@/hooks/utils";
import { Separator } from "@/components/ui/separator";

const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

function MovieColumn({
  movies,
  reverse = false,
  className,
}: {
  movies: {
    id: number;
    title: string;
    poster_path: string | null;
  }[];
  reverse?: boolean;
  className?: string;
}) {
  const items = [...movies, ...movies];

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      <motion.div
        animate={{
          y: reverse ? ["-50%", "0%"] : ["0%", "-50%"],
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex flex-col gap-3"
      >
        {items.map((movie, index) => (
          <div
            key={`${movie.id}-${index}`}
            className="relative aspect-2/3  shrink-0 overflow-hidden rounded-xl shadow-2xl"
          >
            {movie.poster_path ? (
              <img
                src={`${TMDB_IMAGE_URL}${movie.poster_path}`}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-800 text-sm text-muted-foreground">
                No Image
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-3 pt-10">
              <p className="line-clamp-2 text-sm font-medium text-white">
                {movie.title}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { data } = useTmdbPopularMovies("en-US");

  const movies = data?.results ?? [];

  return (
    <div className="select-none">
      <div className="relative min-h-screen overflow-hidden ">
        {/* Header */}
        <div className="md:absolute top-0 inset-x-0  py-8">
          <div className="mx-auto md:max-w-[80%] max-w-[90%]">
            <nav className=" items-center gap-8 md:text-base font-medium text-shadow-2xs text-muted-foreground flex justify-between md:justify-start text-sm">
              <Link
                href="/"
                className="text-foreground transition-colors hover:text-foreground/70"
              >
                Home
              </Link>
              <Link
                href="/demo"
                className="transition-colors hover:text-foreground"
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
                className="transition-colors hover:text-foreground"
              >
                Discord
              </Link>{" "}
              {/* <Link
                href="https://discord.gg/yv7wJV97Jd"
                className="transition-colors hover:text-foreground"
              >
                Telegram
              </Link> */}
            </nav>
          </div>
        </div>
        {/* Hero */}
        <div className="mx-auto md:max-w-[80%] max-w-[90%]">
          <div
            className="flex flex-col md:flex-row gap-10 "
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 60% 40%, var(--color-zinc-900), transparent 60%)",
            }}
          >
            {/* Left content */}
            <div className="flex-1 flex flex-col justify-center">
              <Link href="https://discord.gg/s">
                <Badge variant="secondary" className="mb-1 p-3">
                  Join our Discord <ArrowRight />
                </Badge>
              </Link>
              <div className="mt-4 flex items-center gap-3">
                <h1
                  style={{
                    textShadow: "1px 1px 1px rgba(0,0,0,0.2)",
                  }}
                  className="text-5xl font-bold leading-[1.1] tracking-tighter lg:text-7xl"
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
                    @VIDSTUCK
                  </motion.span>
                </h1>
              </div>

              <p className="mt-8 max-w-2xl text-sm text-muted-foreground md:text-2xl">
                Your movies, shows & anime — all in one place. Free to use,
                stupidly easy to embed, and ready to stream.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-2xl font-bold tracking-tight">100K+</p>
                  <p className="text-sm text-muted-foreground">Movies</p>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <p className="text-2xl font-bold tracking-tight">70K+</p>
                  <p className="text-sm text-muted-foreground">Shows</p>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <p className="text-2xl font-bold tracking-tight">5K+</p>
                  <p className="text-sm text-muted-foreground">Anime</p>
                </div>

                <p className="w-full text-sm text-muted-foreground/70">
                  Estimated catalog size across 13+ sources
                </p>
              </div>
            </div>
            {/* Movie carousel */}
            <div className="flex max-w-2xl gap-3  h-120 md:h-screen">
              <MovieColumn movies={movies} className="- brightness-50" />
              <MovieColumn movies={movies} reverse className="z-30" />
              <MovieColumn movies={movies} className=" brightness-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
