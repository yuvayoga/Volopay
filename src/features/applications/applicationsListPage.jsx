import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  fetchApplications,
  bulkUpdateStatus,
  bulkDeleteApplications,
  selectListApplications,
  selectFetchStatus,
  selectFetchError,
  selectTotalCount,
} from './applicationsSlice';
import { formatSalaryRange, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/statusbadge';
import { TableRowSkeleton } from '../../components/skeleton';
import useDebounce from '../../hooks/usedebounce';

const input = 'w-full p-1.5 text-xs border rounded bg-transparent dark:border-slate-700';
const btn = 'px-2.5 py-1 text-xs border rounded dark:border-slate-700';

export default function ApplicationsListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const applications = useSelector(selectListApplications);
  const status = useSelector(selectFetchStatus);
  const error = useSelector(selectFetchError);
  const totalCount = useSelector(selectTotalCount);

  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const sortBy = searchParams.get('sortBy') || 'dateApplied';
  const order = searchParams.get('order') || 'desc';

  const [searchInput, setSearchInput] = useState(search);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => setSearchInput(search), [search]);
  useEffect(() => setSelectedIds([]), [page, search, statusFilter, sortBy, order]);

  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    const trimmed = debouncedSearch.trim();
    if (searchInput.trim() === trimmed && trimmed !== currentSearch) {
      const next = new URLSearchParams(searchParams);
      if (trimmed) next.set('search', trimmed); else next.delete('search');
      next.set('page', '1');
      setSearchParams(next);
    }
  }, [debouncedSearch, searchInput, searchParams, setSearchParams]);

  useEffect(() => {
    dispatch(fetchApplications({ page, limit: 10, search, status: statusFilter, sortBy, order }));
  }, [dispatch, page, search, statusFilter, sortBy, order]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const exportCSV = () => {
    if (!applications.length) return;
    const h = ['ID', 'Company', 'Role', 'Status', 'Date Applied', 'Salary Min', 'Salary Max', 'Currency', 'Location'];
    const rows = applications.map((a) => [a.id, `"${(a.company || '').replace(/"/g, '""')}"`, `"${(a.role || '').replace(/"/g, '""')}"`, a.status, a.dateApplied || '', a.salaryMin ?? '', a.salaryMax ?? '', a.currency || '', `"${(a.location || '').replace(/"/g, '""')}"`]);
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([[h.join(','), ...rows.map((r) => r.join(','))].join('\n')], { type: 'text/csv' })),
      download: 'applications.csv',
    });
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleBulk = async (type, val) => {
    if (type === 'delete' && !window.confirm(`Delete ${selectedIds.length} application(s)?`)) return;
    if (type === 'delete') await dispatch(bulkDeleteApplications(selectedIds));
    else await dispatch(bulkUpdateStatus({ ids: selectedIds, status: val }));
    setSelectedIds([]);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / 10));

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Applications</h1>
          <p className="text-slate-500">Manage and track your job applications</p>
        </div>
        <button type="button" onClick={exportCSV} className={btn}>Export CSV</button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-3 rounded border dark:border-slate-800 grid grid-cols-4 gap-2">
        <form onSubmit={(e) => { e.preventDefault(); updateParam('search', searchInput.trim()); }}>
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search company or role..." className={input} />
        </form>
        <select value={statusFilter} onChange={(e) => updateParam('status', e.target.value)} className={input}>
          <option value="">All Statuses</option>
          {['wishlist', 'applied', 'interview', 'offer', 'rejected'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => updateParam('sortBy', e.target.value)} className={input}>
          <option value="dateApplied">Sort by Date Applied</option>
          <option value="company">Sort by Company</option>
        </select>
        <div className="flex gap-2">
          <button type="button" onClick={() => updateParam('order', order === 'asc' ? 'desc' : 'asc')} className={`flex-1 ${btn}`}>
            {order === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>
          {(search || statusFilter || sortBy !== 'dateApplied' || order !== 'desc') && (
            <button type="button" onClick={() => { setSearchInput(''); setSearchParams(new URLSearchParams()); }} className={btn}>Reset</button>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded">
          <span className="font-medium text-blue-800 dark:text-blue-300">{selectedIds.length} selected</span>
          <select onChange={(e) => handleBulk('status', e.target.value)} defaultValue="" className="p-1 border rounded bg-white dark:bg-slate-800 dark:border-slate-700">
            <option value="" disabled>Change Status...</option>
            {['wishlist', 'applied', 'interview', 'offer', 'rejected'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button type="button" onClick={() => handleBulk('delete')} className="px-2 py-1 text-red-600 border border-red-300 rounded bg-white dark:bg-slate-800">Delete</button>
          <button type="button" onClick={() => setSelectedIds([])} className="text-slate-500 hover:underline ml-auto">Clear</button>
        </div>
      )}

      {status === 'failed' && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-300 text-red-600 rounded text-center space-y-2">
          <p>{error || 'Failed to load applications.'}</p>
          <button type="button" onClick={() => dispatch(fetchApplications({ page, limit: 10, search, status: statusFilter, sortBy, order }))} className="px-3 py-1 bg-red-600 text-white rounded">Retry</button>
        </div>
      )}

      {status !== 'failed' && (
        <>
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-2.5 w-8">
                    <input type="checkbox" checked={applications.length > 0 && selectedIds.length === applications.length} onChange={(e) => setSelectedIds(e.target.checked ? applications.map((a) => a.id) : [])} />
                  </th>
                  {['Company', 'Role', 'Status', 'Date Applied', 'Salary Range'].map((h) => <th key={h} className="p-2.5">{h}</th>)}
                </tr>
              </thead>
              <tbody className={`divide-y dark:divide-slate-800 ${status === 'loading' ? 'opacity-60' : ''}`}>
                {status === 'loading' && applications.length === 0 ? (
                  Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} />)
                ) : applications.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-slate-400">No applications found matching your filters.</td></tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} onClick={() => navigate(`/applications/${app.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/applications/${app.id}`)} tabIndex={0} role="link" className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => setSelectedIds((p) => (p.includes(app.id) ? p.filter((i) => i !== app.id) : [...p, app.id]))} />
                      </td>
                      <td className="p-2.5 font-medium">{app.company}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">{app.role}</td>
                      <td className="p-2.5"><StatusBadge status={app.status} /></td>
                      <td className="p-2.5 text-slate-500">{formatDate(app.dateApplied)}</td>
                      <td className="p-2.5 font-mono">{formatSalaryRange(app.salaryMin, app.salaryMax, app.currency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-slate-500 pt-1">
            <span>Page {page} of {totalPages} ({totalCount} total)</span>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => updateParam('page', (page - 1).toString())} disabled={page <= 1} className={`${btn} disabled:opacity-40`}>Previous</button>
              <button type="button" onClick={() => updateParam('page', (page + 1).toString())} disabled={page >= totalPages} className={`${btn} disabled:opacity-40`}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
