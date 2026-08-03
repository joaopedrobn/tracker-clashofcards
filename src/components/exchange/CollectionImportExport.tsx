import { ClipboardPaste, Code2, Copy, Download, FileJson, RotateCcw, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CollectionData } from "../../types/collection";
import { copyToClipboard } from "../../utils/clipboard";
import { downloadText } from "../../utils/downloadText";
import {
  createCollectionCode,
  exportCollectionJson,
  importCollectionJson,
  parseCollectionCode,
} from "../../services/collectionSerializer";
import { Button } from "../ui/Button";

interface CollectionImportExportProps {
  collection: CollectionData;
  onImport: (collection: CollectionData) => void;
  onNotify: (message: string) => void;
  onRequestClear: () => void;
}

export function CollectionImportExport({ collection, onImport, onNotify, onRequestClear }: CollectionImportExportProps) {
  const { t } = useTranslation(["exchange", "common", "collection"]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const code = createCollectionCode(collection);

  const importValue = (value: string) => {
    try {
      const next = value.trim().startsWith("{") ? importCollectionJson(value) : parseCollectionCode(value);
      onImport(next);
      setInput("");
      setError("");
      onNotify(t("transfer.imported"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("transfer.importError"));
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importValue(await file.text());
    event.target.value = "";
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="action-tile" onClick={() => { downloadText(exportCollectionJson(collection), "clash-card-tracker.json"); onNotify(t("transfer.downloaded")); }}>
          <span className="tile-icon bg-cyan-400/12 text-cyan-300"><Download size={20} /></span>
          <span><strong>{t("transfer.downloadBackup")}</strong><small>{t("transfer.exportJson")}</small></span>
        </button>
        <button className="action-tile" onClick={() => fileInputRef.current?.click()}>
          <span className="tile-icon bg-violet-400/12 text-violet-300"><Upload size={20} /></span>
          <span><strong>{t("transfer.importFile")}</strong><small>{t("transfer.loadJson")}</small></span>
        </button>
        <input ref={fileInputRef} className="hidden" type="file" accept="application/json,.json" onChange={handleFile} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="collection-code" className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-400"><Code2 size={15} /> {t("transfer.compactCode")}</label>
          <button className="text-xs font-black text-amber-400 hover:text-amber-300" onClick={async () => { await copyToClipboard(code); onNotify(t("exchange:transfer.codeCopied")); }}><Copy className="mr-1 inline" size={13} /> {t("common:actions.copy")}</button>
        </div>
        <textarea id="collection-code" readOnly className="field custom-scrollbar h-20 w-full resize-none font-mono text-[10px] leading-relaxed text-stone-400" value={code} />
      </div>

      <div className="h-px bg-white/8" />

      <div>
        <label htmlFor="import-value" className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-400"><ClipboardPaste size={15} /> {t("transfer.paste")}</label>
        <textarea id="import-value" className="field custom-scrollbar h-28 w-full resize-none font-mono text-xs" placeholder={t("transfer.pastePlaceholder")} value={input} onChange={(event) => { setInput(event.target.value); setError(""); }} />
        {error && <p className="mt-2 text-xs font-bold text-red-400" role="alert">{error}</p>}
        <Button className="mt-3 w-full" disabled={!input.trim()} onClick={() => importValue(input)}><FileJson size={17} /> {t("transfer.loadCollection")}</Button>
      </div>

      <div className="border-t border-white/8 pt-5">
        <p className="mb-3 text-xs font-black uppercase tracking-wider text-stone-400">{t("exchange:transfer.dangerZone")}</p>
        <button className="action-tile w-full border-red-400/15 hover:border-red-400/30" aria-label={t("collection:clear.title")} onClick={onRequestClear}>
          <span className="tile-icon bg-red-400/12 text-red-300"><RotateCcw size={20} /></span>
          <span><strong className="text-red-100">{t("collection:clear.title")}</strong><small>{t("collection:clear.description")}</small></span>
        </button>
      </div>
    </div>
  );
}
