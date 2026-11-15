import { useEffect } from 'react';

export default function Toast({ message, type = 'error', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => { if (onClose) onClose(); }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const colors = type === 'error'
    ? 'bg-red-50 dark:bg-red-950 border-red-300 text-red-700 dark:text-red-300'
    : 'bg-green-50 dark:bg-green-950 border-green-300 text-green-700 dark:text-green-300';

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
      <div className={`flex items-center justify-between p-3 rounded border text-xs font-medium ${colors}`}>
        <span>{message}</span>
        <button type="button" onClick={onClose} className="ml-3 font-bold">&times;</button>
      </div>
    </div>
  );
}
