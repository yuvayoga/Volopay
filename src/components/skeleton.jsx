const B = (w = 'w-full', h = 'h-4') => <div className={`${h} ${w} bg-slate-200 dark:bg-slate-800 rounded`} />;

export function TableRowSkeleton() {
  return (
    <tr className="border-b dark:border-slate-800 animate-pulse">
      <td className="p-2.5 w-8"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded" /></td>
      {[144, 112, 80, 96, 112].map((w, i) => (
        <td key={i} className="p-2.5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" style={{ width: w }} /></td>
      ))}
    </tr>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="flex justify-between">{B('w-24')}{B('w-20')}</div>
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-4 space-y-4">
        {B('w-40', 'h-6')}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i}>{B('w-24')}</div>)}
        </div>
        {B('w-full', 'h-16')}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="max-w-xl mx-auto space-y-4 animate-pulse">
      {B('w-16')}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-4 space-y-3">
        {B('w-32', 'h-6')}
        <div className="grid grid-cols-2 gap-3">{B()}{B()}</div>
        <div className="grid grid-cols-2 gap-3">{B()}{B()}</div>
        {B()}
        {B('w-full', 'h-16')}
      </div>
    </div>
  );
}

export function PipelineSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-72 shrink-0 bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 rounded p-3 space-y-2">
          {B('w-20')}
          {B('w-full', 'h-20')}
          {B('w-full', 'h-20')}
        </div>
      ))}
    </div>
  );
}
