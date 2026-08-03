import type { PublicProfile } from "../types/profile";

interface ProfileGateState {
  userId: string | null;
  authLoading: boolean;
  profileLoading: boolean;
  profileLoaded: boolean;
  profile: PublicProfile | null;
  profileError: string;
}

export function shouldRequireProfile(state: ProfileGateState): boolean {
  return Boolean(
    state.userId
    && !state.authLoading
    && !state.profileLoading
    && state.profileLoaded
    && !state.profile
    && !state.profileError,
  );
}
