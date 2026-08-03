import { CheckCircle2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  const { t } = useTranslation("common");
  if (!message) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-950/95 px-4 py-3 text-sm font-bold text-emerald-100 shadow-2xl backdrop-blur" role="status">
      <CheckCircle2 className="shrink-0 text-emerald-400" size={20} />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} aria-label={t("actions.close")} className="text-emerald-300 hover:text-white"><X size={16} /></button>
    </div>
  );
}
