import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "quiet";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ variant = "primary", className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "tap inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold",
        "disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "bg-accent text-accent-fg",
        variant === "ghost" && "bg-surface text-fg shadow-border",
        variant === "quiet" && "bg-transparent text-muted hover:text-fg",
        className,
      )}
      {...props}
    />
  );
});

export const fieldClass =
  "h-12 w-full rounded-lg border border-line bg-bg px-3 text-base text-fg outline-none placeholder:text-muted focus-visible:border-accent";
