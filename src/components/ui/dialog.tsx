import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface p-6 shadow-card"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-paper-deep"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
