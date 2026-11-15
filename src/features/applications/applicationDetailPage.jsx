import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchApplicationById,
  deleteApplication,
  clearCurrentApplication,
  selectCurrentApplication,
  selectCurrentApplicationStatus,
  selectCurrentApplicationError,
  selectDeleteStatus,
  selectDeleteError,
  resetOperationStatus,
} from './applicationsSlice';
import { formatSalaryRange, formatDate, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/statusbadge';
import NotFoundPage from '../../components/notfoundpage';
import ConfirmationModal from '../../components/confirmationmodal';
import { DetailSkeleton } from '../../components/skeleton';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const application = useSelector(selectCurrentApplication);
  const status = useSelector(selectCurrentApplicationStatus);
  const error = useSelector(selectCurrentApplicationError);
  const deleteStatus = useSelector(selectDeleteStatus);
  const deleteError = useSelector(selectDeleteError);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchApplicationById(id));
    return () => dispatch(clearCurrentApplication());
  }, [dispatch, id]);

  const handleDelete = async () => {
    const res = await dispatch(deleteApplication(Number(id) || id));
    if (deleteApplication.fulfilled.match(res)) {
      setIsDeleteOpen(false);
      navigate('/applications');
    }
  };

  const isMatch = application && String(application.id) === String(id);

  if (status === 'failed') {
    if (error?.status === 404) return <NotFoundPage message={`Application with ID #${id} was not found.`} />;
    return (
      <div className="max-w-md mx-auto p-4 bg-red-50 dark:bg-red-950 border border-red-300 text-red-600 rounded text-center text-xs space-y-2">
        <p>{error?.message || 'Failed to load application.'}</p>
        <button type="button" onClick={() => dispatch(fetchApplicationById(id))} className="px-3 py-1 bg-red-600 text-white rounded">Retry</button>
      </div>
    );
  }

  if (!isMatch) return <DetailSkeleton />;

  const history = application.statusHistory ? [...application.statusHistory].reverse() : [];
  const fields = [
    ['Application ID', `#${application.id}`, 'font-mono'],
    ['Salary Range', formatSalaryRange(application.salaryMin, application.salaryMax, application.currency), 'font-mono'],
    ['Location', `${application.location || 'N/A'} (${application.locationType})`, 'capitalize'],
    ['Date Applied', formatDate(application.dateApplied)],
    ['Created At', formatDateTime(application.createdAt)],
    ['Updated At', formatDateTime(application.updatedAt)],
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/applications'))} className="text-slate-500 hover:underline">
          &larr; Back to Applications
        </button>
        <div className="flex gap-2">
          <Link to={`/applications/${application.id}/edit`} className="px-3 py-1 border rounded">Edit</Link>
          <button type="button" onClick={() => setIsDeleteOpen(true)} className="px-3 py-1 text-red-600 border border-red-300 rounded">Delete</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-4 space-y-3">
        <div className="flex justify-between items-start border-b dark:border-slate-800 pb-3">
          <div>
            <h1 className="text-lg font-bold">{application.company}</h1>
            <p className="text-slate-500">{application.role}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {fields.map(([label, val, cls]) => (
            <div key={label}>
              <span className="text-slate-400 block font-medium">{label}</span>
              <span className={`block mt-0.5 ${cls || ''}`}>{val}</span>
            </div>
          ))}
        </div>

        {application.jobUrl && (
          <div>
            <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400">
              View original job posting &rarr;
            </a>
          </div>
        )}

        <div className="border-t dark:border-slate-800 pt-3">
          <span className="text-slate-400 block font-medium mb-1">Notes</span>
          <p className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded border dark:border-slate-700 whitespace-pre-wrap">
            {application.notes || 'No notes added.'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-4 space-y-3">
        <h2 className="text-sm font-semibold">Status History Timeline</h2>
        <div className="border-l-2 ml-2 pl-4 space-y-2 dark:border-slate-700">
          {history.map((h, i) => (
            <div key={i} className="flex justify-between">
              <span className="font-medium capitalize">{h.status}</span>
              <span className="text-slate-400">{formatDateTime(h.changedAt)}</span>
            </div>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteOpen}
        title={`Delete ${application.company}?`}
        isDeleting={deleteStatus === 'loading'}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={() => { setIsDeleteOpen(false); dispatch(resetOperationStatus('delete')); }}
      />
    </div>
  );
}
