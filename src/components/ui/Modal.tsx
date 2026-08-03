import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  dismissible?: boolean;
}

export function Modal({ open, title, description, children, onClose, dismissible = true }: ModalProps) {
  const { t } = useTranslation("common");
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && dismissible && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismissible, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#08090d]/85 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => dismissible && onClose()}>
      <section
        className="panel-metal max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-5 sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="font-display text-2xl text-white">{title}</h2>
            {description && <p className="mt-1 text-sm leading-relaxed text-stone-400">{description}</p>}
          </div>
          {dismissible && (
            <button className="icon-button shrink-0" onClick={onClose} aria-label={t("actions.close")}>
              <X size={19} />
            </button>
          )}
        </div>
        {children}
      </section>
    </div>
  );
}
