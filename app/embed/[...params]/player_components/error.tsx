import { cn } from "@/hooks/utils";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlayerErrorProps {
  title: string;
  description: string;
  hint: string;
  back: boolean;
}

const DISCORD_URL = "https://discord.gg/bgVHdHgHCe";

export function PlayerError({
  title,
  description,
  hint,
  back,
}: PlayerErrorProps) {
  const router = useRouter();
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
          className={cn(
            "absolute top-0 left-0 md:px-6 px-4 md:py-8 py-6 landscape:py-2 landscape:px-2",
          )}
        >
          <ChevronLeft
            className="md:size-8 size-6 text-foreground/80 hover:text-foreground cursor-pointer"
            strokeWidth={3}
          />
        </button>
      )}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
        <h1 className="md:text-4xl text-lg font-semibold tracking-tight text-white text-shadow-lg">
          {title}
        </h1>

        <p className="md:mt-4 mt-2 max-w-md text-sm leading-6 text-white/45 text-shadow-md md:text-base ">
          {description}
        </p>

        <div className="md:my-8 my-4 h-px w-16 bg-white/10" />

        <p className="md:text-sm text-xs text-white/25 text-shadow-sm">
          {hint}
        </p>

        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="md:mt-6 mt-3 md:text-sm text-xs font-medium text-[#5865F2] transition-colors hover:text-[#7289DA]"
        >
          Join our Discord
        </a>
      </div>
    </div>
  );
}
