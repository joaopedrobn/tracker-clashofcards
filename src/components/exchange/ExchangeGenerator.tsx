import { Copy, Download, MessageCircleMore, Share2 } from "lucide-react";
import { copyToClipboard } from "../../utils/clipboard";
import { downloadText } from "../../utils/downloadText";
import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";
import { ExchangeTextPreview } from "./ExchangeTextPreview";

interface ExchangeGeneratorProps {
  text: string;
  onNotify: (message: string) => void;
}

export function ExchangeGenerator({ text, onNotify }: ExchangeGeneratorProps) {
  const { t } = useTranslation("exchange");
  const copy = async () => {
    await copyToClipboard(text);
    onNotify(t("generator.copied"));
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: t("generator.shareTitle"), text });
        onNotify(t("generator.shared"));
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copy();
  };

  return (
    <section id="exchange" className="panel-wood rounded-3xl p-4 sm:p-6" aria-labelledby="exchange-title">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-amber-400"><MessageCircleMore size={18} /><span className="text-xs font-black uppercase tracking-[0.18em]">{t("generator.eyebrow")}</span></div>
          <h2 id="exchange-title" className="font-display text-2xl text-white sm:text-3xl">{t("generator.title")}</h2>
          <p className="mt-1 max-w-xl text-sm text-stone-400">{t("generator.description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={copy}><Copy size={15} /> {t("generator.copy")}</Button>
          <Button size="sm" variant="secondary" onClick={share}><Share2 size={15} /> {t("generator.share")}</Button>
          <Button size="sm" variant="secondary" onClick={() => { downloadText(text, "clash-card-tracker.txt"); onNotify(t("generator.downloaded")); }}><Download size={15} /> {t("generator.download")}</Button>
        </div>
      </div>
      <ExchangeTextPreview text={text} />
    </section>
  );
}
