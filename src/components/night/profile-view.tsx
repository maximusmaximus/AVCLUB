import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BANNERS, loadMyProfile, saveProfile, type BannerId, type ProfileView } from "@/lib/access";
import { UserButton } from "@/lib/auth/gates";
import { Button, fieldClass } from "@/components/night/ui";
import { IconPick } from "@/components/night/face";
import { cn } from "@/lib/cn";

export const BANNER_CLASS: Record<BannerId, string> = {
  amber: "bg-[linear-gradient(115deg,#3a2410,#e7a23a_58%,#1a1206)]",
  filament: "bg-[linear-gradient(160deg,#100e0c_10%,#f6f1e8_42%,#e7a23a)]",
  night: "bg-[linear-gradient(180deg,#241c16,#100e0c_70%)]",
  grain: "bg-[repeating-linear-gradient(90deg,#3a332c_0_10px,#1a1714_10px_18px)]",
  copper: "bg-[linear-gradient(135deg,#6b3a22,#e7a23a_45%,#100e0c)]",
  signal: "bg-[linear-gradient(90deg,#100e0c_0_16%,#e7a23a_16%_21%,#1a1714_21%_70%,#e7a23a_70%_74%,#100e0c_74%)]",
};

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [banner, setBanner] = useState<BannerId>("amber");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void loadMyProfile()
      .then((next) => {
        setProfile(next);
        if (next.status === "open") {
          setName(next.displayName);
          setUsername(next.username);
          setIsPublic(next.isPublic);
          setBanner(next.banner);
          setAvatar(next.avatar);
        }
      })
      .catch(() => setProfile({ status: "missing" }));
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const next = await saveProfile({ data: { displayName: name, username, isPublic, banner } });
      setProfile(next);
      if (next.status === "open") {
        setName(next.displayName);
        setUsername(next.username);
        setIsPublic(next.isPublic);
        setBanner(next.banner);
        setAvatar(next.avatar);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save that.");
    } finally {
      setPending(false);
    }
  }

  if (!profile) return <p className="text-sm text-muted">Loading your profile.</p>;
  if (profile.status !== "open") {
    return <p className="text-sm text-muted">Sign in to edit your profile.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSave}>
        <div className={cn("h-32 rounded-t-2xl sm:h-40", BANNER_CLASS[banner])} />
        <div className="rounded-b-2xl bg-surface px-4 pb-5 shadow-border sm:px-6">
          <div className="-mt-8 flex items-end justify-between gap-3">
            <IconPick src={avatar} name={name || username || "You"} onSaved={setAvatar} />
            <UserButton />
          </div>
          <label className="mt-4 block">
            <span className="text-sm font-semibold">Name</span>
            <input className={cn(fieldClass, "mt-2")} value={name} maxLength={48} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-semibold">Username</span>
            <span className="mt-2 flex items-center gap-2">
              <span className="text-muted">@</span>
              <input
                className={fieldClass}
                value={username}
                maxLength={24}
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
              />
            </span>
          </label>
          <div className="mt-4">
            <p className="text-sm font-semibold">Profile</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Choice on={isPublic} onClick={() => setIsPublic(true)} label="Public" />
              <Choice on={!isPublic} onClick={() => setIsPublic(false)} label="Private" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold">Banner</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {BANNERS.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-label={id}
                  aria-pressed={banner === id}
                  onClick={() => setBanner(id)}
                  className={cn("tap h-12 rounded-lg", BANNER_CLASS[id], banner === id && "ring-2 ring-fg")}
                />
              ))}
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm font-semibold text-accent" role="alert">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving" : "Save profile"}
            </Button>
            <Link to="/u/$username" params={{ username }} className="inline-flex min-h-11 items-center text-sm font-semibold text-muted">
              {isPublic ? "Public page" : "Only you can see this"}
            </Link>
          </div>
        </div>
      </form>
      <ActivityLists activity={profile.activity} />
    </div>
  );
}

function Choice({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "tap min-h-11 rounded-lg px-3 text-sm font-semibold",
        on ? "bg-accent text-accent-fg" : "bg-bg text-muted shadow-border",
      )}
    >
      {label}
    </button>
  );
}

export function ActivityLists({ activity }: { activity: Extract<ProfileView, { status: "open" }>["activity"] }) {
  return (
    <div className="mt-8 grid gap-8">
      <Activity title="Participations" empty="No nights yet.">
        {activity.participations.map((item) => (
          <li key={item.role} className="py-3">
            <span className="font-extrabold">{item.event}</span>
            <span className="mt-0.5 block text-sm text-muted">
              {item.role}
              {item.checkedIn ? (item.canBuild ? " · Checked in · Building" : " · Checked in · Watch only") : " · Not checked in"}
            </span>
          </li>
        ))}
      </Activity>
      <Activity title="Submissions" empty="Nothing submitted yet.">
        {activity.submissions.map((item) => (
          <li key={`${item.title}-${item.team}`} className="py-3">
            <span className="font-extrabold">{item.title}</span>
            <span className="mt-0.5 block text-sm text-muted">{item.team}</span>
          </li>
        ))}
      </Activity>
      <Activity title="People's order" empty="No sort yet.">
        {activity.vote.map((title, index) => (
          <li key={title} className="py-3">
            <span className="font-extrabold">{index + 1}. {title}</span>
          </li>
        ))}
      </Activity>
      <Activity title="Contributions" empty="No roles yet.">
        {activity.contributions.map((item) => (
          <li key={item.role} className="py-3">
            <span className="font-extrabold">{item.role}</span>
            {item.note && <span className="mt-0.5 block text-sm text-muted">{item.note}</span>}
          </li>
        ))}
      </Activity>
    </div>
  );
}

function Activity({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const list = Array.isArray(children) ? children : [children];
  const filled = list.some(Boolean);
  return (
    <section>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {filled ? <ul className="mt-2 divide-y divide-line">{children}</ul> : <p className="mt-2 text-sm text-muted">{empty}</p>}
    </section>
  );
}
