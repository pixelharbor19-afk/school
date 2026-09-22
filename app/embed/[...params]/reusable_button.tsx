import { cn } from "@/hooks/utils";
import type { ComponentType, PointerEventHandler } from "react";

type PlayerButtonProps = {
  icon: ComponentType<{ className?: string }>;
  label?: string;
  onClick?: () => void;
  iconClassName?: string;
  className?: string;
  disabled?: boolean;
  settings?: boolean;
  onPointerMove?: PointerEventHandler<HTMLButtonElement>;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
};

export default function PlayerButton({
  icon: Icon,
  label,
  onClick,
  onPointerMove,
  onPointerDown,
  className,
  iconClassName,
  disabled,
  settings,
}: PlayerButtonProps) {
  return (
    <button
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      type="button"
      disabled={disabled}
      aria-label={label}
      className={cn(
        "group relative cursor-pointer text-foreground brightness-80 hover:brightness-100 shadow-2xl pointer-events-auto",

        className,
      )}
    >
      <Icon
        className={cn(
          "lg:size-10 md:size-8 size-7 landscape:size-6 transition duration-300 ease-in-out",
          settings ? "hover:rotate-90" : "",
          iconClassName,
        )}
      />

      {label && (
        <span className="pointer-events-none absolute left-1/2 bottom-full z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-black/80 backdrop-blur-xl px-2 py-1 text-sm opacity-0 transition-opacity group-hover:opacity-100">
          {label}
        </span>
      )}
    </button>
  );
}
