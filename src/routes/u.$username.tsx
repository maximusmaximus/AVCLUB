import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { loadPublicProfile, type ProfileView } from "@/lib/access";
import { ActivityLists, BANNER_CLASS } from "@/components/night/profile-view";
import { Face } from "@/components/night/face";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/u/$username")({
  component: PublicProfile,
  head: ({ params }) => ({
    meta: [{ title: `@${params.username} — AVCLUB` }],
  }),
});

function PublicProfile() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<ProfileView | null>(null);

  useEffect(() => {
    setProfile(null);
    void loadPublicProfile({ data: { username } })
      .then(setProfile)
      .catch(() => setProfile({ status: "missing" }));
  }, [username]);

  return (
    <main className="min-h-dvh bg-bg px-4 py-8 text-fg sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="text-sm font-extrabold tracking-widest">
          AVCLUB
        </Link>
        {!profile && <p className="mt-8 text-sm text-muted">Loading profile.</p>}
        {profile?.status === "missing" && <h1 className="mt-8 text-3xl font-extrabold">No profile named @{username}</h1>}
        {profile?.status === "locked" && (
          <div className="mt-8 rounded-2xl bg-surface p-6 shadow-border">
            <h1 className="text-3xl font-extrabold">This profile is private.</h1>
            <p className="mt-2 text-muted">@{profile.username}</p>
          </div>
        )}
        {profile?.status === "open" && (
          <>
            <div className={cn("mt-6 h-32 rounded-t-2xl sm:h-40", BANNER_CLASS[profile.banner])} />
            <div className="rounded-b-2xl bg-surface px-4 pb-6 shadow-border sm:px-6">
              <div className="-mt-8">
                <Face
                  src={profile.avatar}
                  name={profile.displayName || profile.username}
                  className="size-16 border-4 border-surface bg-bg text-fg"
                />
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{profile.displayName || profile.username}</h1>
              <p className="mt-1 text-muted">
                @{profile.username}
                <span className="ml-2">{profile.isPublic ? "Public" : "Private"}</span>
              </p>
            </div>
            <ActivityLists activity={profile.activity} />
          </>
        )}
      </div>
    </main>
  );
}
