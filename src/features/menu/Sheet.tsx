import { useEffect, useRef, type ReactNode } from 'react';

/** A bottom sheet over the screen. Escape closes it, the same as its Cancel button. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label={title}
      className="text-ink bg-surface mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-4xl p-5 backdrop:bg-[rgb(0_0_0/0.6)]"
    >
      <h2 className="text-xl font-extrabold">{title}</h2>
      {children}
    </dialog>
  );
}
