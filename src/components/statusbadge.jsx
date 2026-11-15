const STYLES = {
  wishlist: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  applied: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  interview: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  offer: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  rejected: 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
};

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase() || 'wishlist';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[key] || STYLES.wishlist}`}>
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  );
}
