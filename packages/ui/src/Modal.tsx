/**
 * Modal — dialog overlay built on the native <dialog> element.
 *
 * Uses showModal()/close() for proper focus trapping and backdrop.
 * Clicking the backdrop or pressing Escape triggers onClose automatically.
 * When title is provided, a header with close (X) button is rendered.
 *
 * @prop open     — Controls dialog visibility. true = open, false = closed.
 * @prop onClose  — Called when the dialog is dismissed (backdrop click, Escape, or X button).
 * @prop title    — Optional header text. When provided, renders a title bar with a close button.
 * @prop children — Content rendered inside the dialog body.
 *
 * @example
 * // Basic modal with title
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Konfirmo fshirjen">
 *   <p>A jeni te sigurt?</p>
 *   <Button variant="danger" onClick={handleDelete}>Fshi</Button>
 * </Modal>
 *
 * // Without title (custom header inside children)
 * <Modal open={showForm} onClose={() => setShowForm(false)}>
 *   <h2>Artikull i ri</h2>
 *   <ArticleForm onSubmit={handleSubmit} />
 * </Modal>
 *
 * // Controlled by state
 * const [open, setOpen] = useState(false);
 * <Button onClick={() => setOpen(true)}>Hap</Button>
 * <Modal open={open} onClose={() => setOpen(false)} title="Detajet">
 *   {content}
 * </Modal>
 */
"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto max-w-lg w-full rounded-2xl bg-gn-surface p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gn-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-gn-text-tertiary rounded-lg hover:bg-gn-overlay hover:text-gn-text transition-colors"
              aria-label="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
