export const EVENT_LABEL = "AVCLUB PILOT";

export const BANNERS = ["amber", "filament", "night", "grain", "copper", "signal"] as const;
export type BannerId = (typeof BANNERS)[number];

export const CAPABILITIES = ["register", "phone", "room", "door", "floor"] as const;
export type Capability = (typeof CAPABILITIES)[number];

export type AccessSnapshot = {
  signedIn: boolean;
  staff: boolean;
  caps: Capability[];
  visibilitySet: boolean;
};

export type Activity = {
  participations: { event: string; role: string; checkedIn: boolean; canBuild: boolean }[];
  submissions: { title: string; team: string }[];
  contributions: { role: string; note: string }[];
  vote: string[];
};

export type ProfileView =
  | { status: "missing" }
  | { status: "locked"; username: string }
  | {
      status: "open";
      owner: boolean;
      displayName: string;
      username: string;
      isPublic: boolean;
      banner: BannerId;
      avatar: string;
      activity: Activity;
    };

export function isBanner(value: string): value is BannerId {
  return (BANNERS as readonly string[]).includes(value);
}

export function isCapability(value: string): value is Capability {
  return (CAPABILITIES as readonly string[]).includes(value);
}
