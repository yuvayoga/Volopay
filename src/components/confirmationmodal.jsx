import { useEffect } from 'react';

export default function ConfirmationModal({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  isDeleting = false,
  error = null,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape' && !isDeleting) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div onClick={(e) => e.target === e.currentTarget && !isDeleting && onClose()} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded border dark:border-slate-800 max-w-sm w-full p-4 space-y-3">
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">{message}</p>
        </div>
        {error && (
          <div className="p-2 bg-red-50 dark:bg-red-950 border border-red-300 text-red-600 rounded text-xs">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
          <button type="button" onClick={onClose} disabled={isDeleting} className="px-3 py-1.5 text-xs border rounded disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="px-3 py-1.5 text-xs text-white bg-red-600 rounded disabled:opacity-50">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
