import { useCallback, useEffect, useState } from "react";
import { loadAccess, type AccessSnapshot } from "@/lib/access";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { Surface } from "@/lib/night/model";

const EMPTY: AccessSnapshot = { signedIn: false, staff: false, caps: [], visibilitySet: true };

export function notifyAccess() {
  window.dispatchEvent(new Event("avclub-access"));
}

export function useNightAccess() {
  const { user, isPending } = useCurrentUserState();
  const [access, setAccess] = useState<AccessSnapshot | null>(null);

  const reload = useCallback(() => {
    return loadAccess()
      .then(setAccess)
      .catch(() => setAccess(EMPTY));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, user?.id, isPending]);

  useEffect(() => {
    const onChange = () => {
      void reload();
    };
    window.addEventListener("avclub-access", onChange);
    return () => window.removeEventListener("avclub-access", onChange);
  }, [reload]);

  return { user, isPending, access, ready: access !== null && !isPending };
}

export function canSee(surface: Surface, access: AccessSnapshot | null, signedIn: boolean): boolean {
  if (surface === "event") return true;
  if (!access) return false;
  if (surface === "profile") return signedIn;
  return access.caps.includes(surface === "join" ? "register" : surface);
}

export function canOpen(surface: Surface, access: AccessSnapshot | null, signedIn: boolean): boolean {
  if (surface === "join" || surface === "event") return true;
  return canSee(surface, access, signedIn);
}
