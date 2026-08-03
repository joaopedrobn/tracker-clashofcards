import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOwnProfile, saveOwnProfile } from "../repositories/profileRepository";
import { validateProfile } from "../services/profileService";
import type { ProfileInput, PublicProfile } from "../types/profile";
import { useAuth } from "./useAuth";
import i18n from "../i18n";

type ProfileLoadStatus = "idle" | "loading" | "loaded" | "error";

interface ProfileSnapshot {
  userId: string | null;
  status: ProfileLoadStatus;
  profile: PublicProfile | null;
  error: string;
}

const initialSnapshot: ProfileSnapshot = {
  userId: null,
  status: "idle",
  profile: null,
  error: "",
};

export function useProfile() {
  const { user, initialized: authLoaded } = useAuth();
  const userId = user?.id ?? null;
  const requestVersion = useRef(0);
  const [snapshot, setSnapshot] = useState<ProfileSnapshot>(initialSnapshot);

  const reload = useCallback(async () => {
    const requestedUserId = userId;
    const currentRequest = ++requestVersion.current;

    if (!authLoaded || !requestedUserId) {
      setSnapshot(initialSnapshot);
      return;
    }

    setSnapshot({ userId: requestedUserId, status: "loading", profile: null, error: "" });
    try {
      const profile = await fetchOwnProfile();
      if (requestVersion.current !== currentRequest) return;
      setSnapshot({ userId: requestedUserId, status: "loaded", profile, error: "" });
    } catch (reason) {
      if (requestVersion.current !== currentRequest) return;
      setSnapshot({
        userId: requestedUserId,
        status: "error",
        profile: null,
        error: reason instanceof Error ? reason.message : i18n.t("profileLoad", { ns: "errors" }),
      });
    }
  }, [authLoaded, userId]);

  useEffect(() => {
    void reload();
    return () => { requestVersion.current += 1; };
  }, [reload]);

  const save = useCallback(async (input: ProfileInput) => {
    const normalized = validateProfile(input);
    const saved = await saveOwnProfile(normalized);
    requestVersion.current += 1;
    setSnapshot({ userId: saved.id, status: "loaded", profile: saved, error: "" });
    return saved;
  }, []);

  const belongsToCurrentUser = Boolean(userId && snapshot.userId === userId);
  const profileLoading = Boolean(userId) && (!belongsToCurrentUser || snapshot.status === "loading");
  const profileLoaded = belongsToCurrentUser && snapshot.status === "loaded";
  const profile = belongsToCurrentUser ? snapshot.profile : null;
  const profileError = belongsToCurrentUser && snapshot.status === "error" ? snapshot.error : "";

  return {
    profile,
    profileLoading,
    profileLoaded,
    profileError,
    save,
    reload,
  };
}
