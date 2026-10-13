import { useEffect, useState, type FormEvent } from "react";
import { Button, fieldClass } from "@/components/night/ui";
import { IconPick } from "@/components/night/face";
import { loadMyPiece, loadMyProfile, recordMyWork } from "@/lib/access";
import { BACKGROUNDS, backgroundClass } from "@/lib/night/slides";
import { cn } from "@/lib/cn";

export function ShowCardForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState<string>(BACKGROUNDS[0].id);
  const [nothing, setNothing] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void loadMyPiece()
      .then((piece) => {
        if (!piece) return;
        setTitle(piece.title);
        setDescription(piece.description);
        setBackground(piece.background);
        setNothing(!piece.onScreen);
        setAvatar(piece.avatar);
        setName(piece.name);
      })
      .catch(() => undefined);
    void loadMyProfile()
      .then((profile) => {
        if (profile.status !== "open") return;
        setAvatar((current) => current || profile.avatar);
        setName((current) => current || profile.displayName || profile.username);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNote("");
    setPending(true);
    try {
      const saved = await recordMyWork({ data: { title, description, background, onScreen: !nothing } });
      if (!saved.ok) throw new Error("Sign in to save this.");
      setNote(nothing ? "Saved. It stays on file and stays off the big screen." : "Saved. This card is in the show-and-tell order.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save that.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6" onSubmit={onSubmit}>
      <h2 className="text-lg font-extrabold">What you'll show</h2>
      <p className="mt-1 text-sm text-muted">Title, a short description, and a background. The room sees this card.</p>
      <div className="mt-4">
        <IconPick src={avatar} name={name || "You"} onSaved={setAvatar} />
      </div>
      <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input type="checkbox" checked={nothing} onChange={(e) => setNothing(e.target.checked)} />
        Nothing to share this time
      </label>
      <p className="mt-1 text-sm text-muted">You can still write it. We keep it. It just won't go on the big screen.</p>
      <div className={cn("mt-4 rounded-2xl p-5 text-white", backgroundClass(background), nothing && "opacity-60")}>
        <p className="text-xs font-semibold tracking-widest uppercase opacity-80">Show and tell</p>
        <p className="mt-3 text-3xl font-extrabold text-balance">{title.trim() || "Untitled"}</p>
        <p className="mt-2 text-sm text-pretty opacity-90">{description.trim() || "Say what it is."}</p>
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-semibold">Title</span>
        <input className={cn(fieldClass, "mt-2")} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="mt-3 block">
        <span className="text-sm font-semibold">Description</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-lg border border-line bg-bg px-3 py-3 text-base text-fg outline-none focus-visible:border-accent"
          value={description}
          maxLength={400}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <fieldset className="mt-3">
        <legend className="text-sm font-semibold">Background</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {BACKGROUNDS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={background === item.id}
              onClick={() => setBackground(item.id)}
              className={cn(
                "tap min-h-16 rounded-lg text-xs font-semibold text-white",
                item.className,
                background === item.id && "ring-2 ring-fg ring-offset-2 ring-offset-bg",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="mt-3 text-sm font-semibold text-accent" role="alert">
          {error}
        </p>
      )}
      {note && <p className="mt-3 text-sm text-muted">{note}</p>}
      <Button type="submit" className="mt-4 w-full" disabled={pending}>
        {pending ? "Saving" : "Save the card"}
      </Button>
    </form>
  );
}
