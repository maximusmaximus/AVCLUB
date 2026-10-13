import { cn } from "@/lib/cn";
import type { Phase } from "@/lib/night/model";

export function PhaseBanner({
  phase,
  size = "md",
  align = "start",
}: {
  phase: Phase;
  size?: "md" | "lg";
  align?: "start" | "center";
}) {
  return (
    <div className={cn(align === "center" && "text-center")}>
      <p className={cn("leading-none", size === "lg" ? "text-5xl" : "text-3xl")} aria-hidden>
        {phase.emoji}
      </p>
      <h2
        className={cn(
          "mt-3 font-extrabold tracking-tight text-balance text-fg",
          size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl",
        )}
      >
        {phase.title}
      </h2>
    </div>
  );
}
