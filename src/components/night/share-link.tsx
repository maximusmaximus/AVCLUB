import { useState } from "react";
import { Button } from "@/components/night/ui";

export function ShareLink({ slug, title }: { slug: string; title: string }) {
  const [note, setNote] = useState("");

  async function share() {
    const url = `${window.location.origin}/e/${slug}`;
    const text = `${title} — follow this part of the night.`;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await navigator.clipboard.writeText(url);
        setNote("Link copied.");
      }
    } catch {
      setNote("Couldn't share that.");
    }
  }

  return (
    <div className="mt-6">
      <Button variant="ghost" onClick={() => void share()}>
        Share this view
      </Button>
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}
    </div>
  );
}
