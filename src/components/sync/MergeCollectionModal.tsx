import type { CollectionChoice, CollectionConflict } from "../../types/sync";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useTranslation } from "react-i18next";

interface MergeCollectionModalProps {
  conflict: CollectionConflict | null;
  busy: boolean;
  error: string;
  onResolve: (choice: CollectionChoice) => void;
}

export function MergeCollectionModal({ conflict, busy, error, onResolve }: MergeCollectionModalProps) {
  const { t } = useTranslation("exchange");
  return (
    <Modal open={Boolean(conflict)} onClose={() => undefined} dismissible={false} title={t("merge.title")} description={t("merge.description")}>
      {conflict && <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Summary title={t("merge.device")} collected={conflict.localSummary.collected} duplicates={conflict.localSummary.duplicateCopies} updatedAt={conflict.local.updatedAt} />
          <Summary title={t("merge.cloud")} collected={conflict.remoteSummary.collected} duplicates={conflict.remoteSummary.duplicateCopies} updatedAt={conflict.remoteUpdatedAt} />
        </div>
        <p className="rounded-xl border border-amber-300/15 bg-amber-300/7 p-3 text-xs leading-relaxed text-amber-100">{t("merge.explanation")}</p>
        {error && <p role="alert" className="rounded-xl bg-red-500/12 p-3 text-sm text-red-200">{error}</p>}
        <div className="grid gap-2 sm:grid-cols-3">
          <Button disabled={busy} variant="secondary" onClick={() => onResolve("local")}>{t("merge.useDevice")}</Button>
          <Button disabled={busy} variant="secondary" onClick={() => onResolve("remote")}>{t("merge.useCloud")}</Button>
          <Button disabled={busy} onClick={() => onResolve("merge")}>{busy ? t("merge.syncing") : t("merge.merge")}</Button>
        </div>
      </div>}
    </Modal>
  );
}

function Summary({ title, collected, duplicates, updatedAt }: { title: string; collected: number; duplicates: number; updatedAt: string | null }) {
  const { t, i18n } = useTranslation("exchange");
  return <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-xs font-black uppercase tracking-wider text-stone-400">{title}</p><p className="mt-2 text-2xl font-black text-white">{collected}<span className="text-sm text-stone-500">/60</span></p><p className="mt-1 text-xs text-stone-400">{t("merge.summary", { collected, duplicates, date: updatedAt ? new Date(updatedAt).toLocaleString(i18n.language) : t("merge.noDate") })}</p></div>;
}
