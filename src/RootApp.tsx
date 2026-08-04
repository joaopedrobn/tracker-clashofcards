import { TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import CollectionPage from "./App";
import { AuthModal } from "./components/auth/AuthModal";
import { Header } from "./components/layout/Header";
import { ProfileFormModal } from "./components/profile/ProfileFormModal";
import { ClashAccountFormModal } from "./components/profile/ClashAccountFormModal";
import { MergeCollectionModal } from "./components/sync/MergeCollectionModal";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { useClashAccounts } from "./hooks/useClashAccounts";
import { useSyncedCollection } from "./hooks/useSyncedCollection";
import { CommunityPage } from "./pages/CommunityPage";
import { PublicPlayerPage } from "./pages/PublicPlayerPage";
import { ClashAccountsPage } from "./pages/ClashAccountsPage";
import { shouldRequireProfile } from "./services/profileGate";

export default function RootApp() {
  const { t } = useTranslation(["common", "profile"]);
  const navigate = useNavigate();
  const auth = useAuth();
  const profileState = useProfile();
  const accountsState = useClashAccounts(auth.user?.id ?? null, Boolean(profileState.profile));
  const tracker = useSyncedCollection(auth.user?.id ?? null, accountsState.activeClashAccountId, Boolean(profileState.profile && accountsState.activeAccount), accountsState.activeAccount?.clashNickname ?? "");
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [guestNotice, setGuestNotice] = useState(() => sessionStorage.getItem("cct-guest-notice-dismissed") !== "1");
  const profileRequired = auth.initialized && shouldRequireProfile({ userId: auth.user?.id ?? null, authLoading: auth.authLoading, profileLoading: profileState.profileLoading, profileLoaded: profileState.profileLoaded, profile: profileState.profile, profileError: profileState.profileError });

  useEffect(() => { if (auth.recoveryMode) setAuthOpen(true); }, [auth.recoveryMode]);
  useEffect(() => { if (!auth.user) { setProfileOpen(false); return; } if (profileRequired) setProfileOpen(true); }, [auth.user, profileRequired]);
  useEffect(() => { if (!auth.user) { setAccountFormOpen(false); return; } if (accountsState.accountRequired) setAccountFormOpen(true); }, [accountsState.accountRequired, auth.user]);
  const resolve = async (choice: "local" | "remote" | "merge") => { setMergeBusy(true); try { await tracker.resolveConflict(choice); } finally { setMergeBusy(false); } };
  const dismissGuestNotice = () => { sessionStorage.setItem("cct-guest-notice-dismissed", "1"); setGuestNotice(false); };

  return <div className="min-h-screen">
    <Header collected={tracker.summary.collected} total={tracker.summary.total} percentage={tracker.summary.percentage} accountEnabled={auth.enabled} userEmail={auth.user?.email ?? null} profileName={profileState.profile?.displayName ?? null} profileNickname={accountsState.activeAccount?.clashNickname ?? null} avatarUrl={profileState.profile?.avatarUrl ?? null} syncStatus={tracker.syncStatus} onRetrySync={() => void tracker.retrySync()} onOpenAuth={() => setAuthOpen(true)} onOpenProfile={() => { if (profileState.profileLoaded && profileState.profile) setProfileOpen(true); }} onOpenAccounts={() => navigate("/contas")} onSignOut={() => void auth.signOut()} onOpenTransfer={() => { navigate("/"); setTransferOpen(true); }} />
    {auth.initialized && !auth.user && guestNotice && <aside className="relative border-b border-red-400/25 bg-gradient-to-r from-red-950/90 via-rose-950/80 to-red-950/90 px-4 py-3 text-red-50 shadow-[0_8px_30px_rgba(127,29,29,.2)]" role="status"><div className="mx-auto flex max-w-[1400px] flex-col items-stretch gap-3 pr-8 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><TriangleAlert className="mt-0.5 shrink-0 text-red-300 sm:mt-0" size={20} aria-hidden="true" /><div className="min-w-0 flex-1 text-xs leading-relaxed sm:flex sm:flex-wrap sm:items-center sm:gap-x-2"><strong className="block text-sm text-white sm:inline">{t("common:guest.title")}</strong><span>{t("common:guest.body")}</span></div></div><button className="self-start whitespace-nowrap rounded-xl border border-red-300/30 bg-red-300/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-300/20 sm:shrink-0" onClick={() => setAuthOpen(true)} disabled={!auth.enabled}>{t("common:guest.action")}</button></div><button className="absolute right-2 top-2 rounded-lg p-1.5 text-red-200 hover:bg-white/10" aria-label={t("common:guest.close")} onClick={dismissGuestNotice}><X size={16} /></button></aside>}
    {tracker.syncError && auth.user && !tracker.conflict && <div className="border-b border-red-300/10 bg-red-400/7 px-4 py-2 text-center text-xs text-red-100">{tracker.syncError} <button className="font-black underline" onClick={() => void tracker.retrySync()}>{t("common:sync.retry")}</button></div>}
    {profileState.profileError && auth.user && <div className="border-b border-red-300/10 bg-red-400/7 px-4 py-2 text-center text-xs text-red-100">{profileState.profileError} <button className="font-black underline" onClick={() => void profileState.reload()}>{t("profile:reload")}</button></div>}
    <Routes>
      <Route path="/" element={<CollectionPage tracker={tracker} transferOpen={transferOpen} setTransferOpen={setTransferOpen} accountsState={accountsState} />} />
      <Route path="/minhas-contas" element={!auth.initialized ? null : auth.user ? <ClashAccountsPage state={accountsState} /> : <Navigate to="/" replace />} />
      <Route path="/contas" element={!auth.initialized ? null : auth.user ? <ClashAccountsPage state={accountsState} /> : <Navigate to="/" replace />} />
      <Route path="/comunidade" element={!auth.initialized ? null : auth.user ? <CommunityPage accountsState={accountsState} myActiveCollection={tracker.collection} /> : <Navigate to="/" replace />} />
      <Route path="/jogador/:id" element={!auth.initialized ? null : auth.user ? <PublicPlayerPage myAccounts={accountsState.accounts} myActiveAccountId={accountsState.activeClashAccountId} myActiveCollection={tracker.collection} /> : <Navigate to="/" replace />} />
      <Route path="/redefinir-senha" element={<Navigate to="/" replace />} /><Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <AuthModal open={authOpen} initialView={auth.recoveryMode ? "reset" : "login"} onClose={() => { setAuthOpen(false); auth.clearRecoveryMode(); }} />
    <ProfileFormModal open={profileOpen && Boolean(profileState.profile || profileRequired)} profile={profileState.profile} required={profileRequired} onClose={() => setProfileOpen(false)} onSave={profileState.save} />
    <ClashAccountFormModal open={accountFormOpen && accountsState.accountRequired} account={null} required onClose={() => setAccountFormOpen(false)} onSave={accountsState.create} />
    <MergeCollectionModal conflict={tracker.conflict} busy={mergeBusy} error={tracker.syncError} onResolve={(choice) => void resolve(choice)} />
  </div>;
}
