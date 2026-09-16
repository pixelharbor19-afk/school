"use client";

import { cn } from "@/hooks/utils";
import { Check, ChevronLeft, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PlayerErrorProps {
  title: string;
  description: string;
  hint: string;
  back: boolean;
  directUrl?: string;
}

const DISCORD_URL = "https://discord.gg/bgVHdHgHCe";

export function PlayerError({
  title,
  description,
  hint,
  back,
  directUrl,
}: PlayerErrorProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!directUrl) return;

    await navigator.clipboard.writeText(directUrl);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-black"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 60% 40%, var(--color-zinc-900), transparent 60%)",
      }}
    >
      {!back && (
        <button
          onClick={() => router.back()}
          className="absolute top-0 left-0 px-4 py-6 md:px-6 md:py-8 landscape:px-2 landscape:py-2"
        >
          <ChevronLeft
            className="size-6 cursor-pointer text-foreground/80 hover:text-foreground md:size-8"
            strokeWidth={3}
          />
        </button>
      )}

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-white text-shadow-lg md:text-4xl">
          {title}
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-white/45 text-shadow-md md:mt-4 md:text-base">
          {description}
        </p>

        <div className="my-4 w-full max-w-md md:my-8">
          {directUrl ? (
            <div className="w-full">
              <p className="mb-3 text-sm text-white/40">
                Copy the link below and paste it into your browser to open the
                player.
              </p>

              <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
                <div className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm text-white/40">
                  {directUrl}
                </div>

                <button
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/15"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto h-px w-16 bg-white/10" />
          )}
        </div>

        <p className="text-xs text-white/25 text-shadow-sm md:text-sm">
          {hint}
        </p>

        <Link
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-xs font-medium text-[#5865F2] transition-colors hover:text-[#7289DA] md:mt-6 md:text-sm"
        >
          Join our Discord
        </Link>
      </div>
    </div>
  );
}
