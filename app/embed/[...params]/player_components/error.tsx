interface PlayerErrorProps {
  title: string;
  description: string;
  hint: string;
}

export function PlayerError({ title, description, hint }: PlayerErrorProps) {
  return (
    <div
      className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-black"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 60% 40%, var(--color-zinc-900), transparent 60%)",
      }}
    >
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white text-shadow-lg md:text-4xl">
          {title}
        </h1>

        <p className="mt-4 max-w-md text-sm leading-6 text-white/45 text-shadow-md md:text-base">
          {description}
        </p>

        <div className="my-8 h-px w-16 bg-white/10" />

        <p className="text-sm text-white/25 text-shadow-sm">{hint}</p>
      </div>
    </div>
  );
}
