import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import {
  fetchAllApplications,
  selectIsAllLoaded,
  selectFetchAllStatus,
  selectFetchAllError,
} from '../applications/applicationsSlice';
import { selectDashboardMetrics } from './dashboardSelectors';

const card = 'bg-white dark:bg-slate-900 p-4 rounded border dark:border-slate-800';

const STATS = [
  { label: 'Total Applications', key: 'total' },
  { label: 'Response Rate', key: 'responseRate', fmt: (v) => `${v}%`, color: 'text-blue-600' },
  { label: 'Interviews This Month', key: 'interviewsThisMonth', color: 'text-amber-600' },
  { label: 'Offers', key: 'offerCount', color: 'text-emerald-600' },
];

export default function DashboardPage() {
  const dispatch = useDispatch();
  const isAllLoaded = useSelector(selectIsAllLoaded);
  const fetchAllStatus = useSelector(selectFetchAllStatus);
  const fetchAllError = useSelector(selectFetchAllError);
  const metrics = useSelector(selectDashboardMetrics);

  useEffect(() => {
    if (!isAllLoaded && fetchAllStatus !== 'loading') dispatch(fetchAllApplications());
  }, [dispatch, isAllLoaded, fetchAllStatus]);

  const header = (
    <div>
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p className="text-xs text-slate-500">Overview of your job application pipeline</p>
    </div>
  );

  if (fetchAllStatus === 'loading' && !isAllLoaded) {
    return (
      <div className="space-y-4">
        {header}
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${card} animate-pulse h-16`} />
          ))}
        </div>
        <div className={`${card} animate-pulse h-64`} />
      </div>
    );
  }

  if (fetchAllStatus === 'failed') {
    return (
      <div className="space-y-4">
        {header}
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-300 text-red-600 rounded text-center text-xs space-y-2">
          <p>{fetchAllError || 'Failed to load dashboard data.'}</p>
          <button type="button" onClick={() => dispatch(fetchAllApplications())} className="px-3 py-1 bg-red-600 text-white rounded">Retry</button>
        </div>
      </div>
    );
  }

  if (metrics.total === 0) {
    return (
      <div className="space-y-4">
        {header}
        <div className={`${card} p-6 text-center text-xs text-slate-400`}>
          No applications yet. Start by adding your first job application.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      <div className="grid grid-cols-4 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className={card}>
            <span className="text-xs text-slate-500 block">{s.label}</span>
            <span className={`text-2xl font-bold mt-1 block ${s.color || ''}`}>
              {s.fmt ? s.fmt(metrics[s.key]) : metrics[s.key]}
            </span>
          </div>
        ))}
      </div>
      <div className={`${card} space-y-3`}>
        <h2 className="text-sm font-semibold">Applications by Status</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.byStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Bar dataKey="count" fill="#2563eb" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
