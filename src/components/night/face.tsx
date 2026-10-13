import { useState, type ChangeEvent } from "react";
import { cn } from "@/lib/cn";
import { fileToIcon } from "@/lib/night/icon";
import { saveMyAvatar } from "@/lib/access";

export function Face({ src, name, className }: { src?: string; name: string; className?: string }) {
  const letter = (name.trim() || "?").slice(0, 1).toUpperCase();
  if (src) {
    return <img src={src} alt="" className={cn("size-12 shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span className={cn("grid size-12 shrink-0 place-items-center rounded-full bg-white/20 text-lg font-extrabold", className)}>
      {letter}
    </span>
  );
}

export function IconPick({ src, name, onSaved }: { src: string; name: string; onSaved: (next: string) => void }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setPending(true);
    try {
      const avatar = await fileToIcon(file);
      await saveMyAvatar({ data: { avatar } });
      onSaved(avatar);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save that picture.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Face src={src} name={name} className="size-16 border-4 border-surface bg-bg text-fg" />
      <label className="tap inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-surface px-3 text-sm font-semibold shadow-border">
        {pending ? "Saving" : "Upload icon"}
        <input className="sr-only" type="file" accept="image/*" onChange={onFile} />
      </label>
      {error && <p className="text-sm font-semibold text-accent">{error}</p>}
    </div>
  );
}
