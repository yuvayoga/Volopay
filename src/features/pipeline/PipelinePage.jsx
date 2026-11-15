import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import {
  fetchAllApplications,
  selectAllApplications,
  selectIsAllLoaded,
  selectFetchAllStatus,
  selectFetchAllError,
  optimisticStatusUpdate,
  updateApplication,
} from '../applications/applicationsSlice';
import { formatSalaryRange, formatDate } from '../../utils/formatters';
import Toast from '../../components/toast';
import { PipelineSkeleton } from '../../components/skeleton';

const COLUMNS = [
  { key: 'wishlist', label: 'Wishlist', dot: 'bg-slate-400' },
  { key: 'applied', label: 'Applied', dot: 'bg-blue-500' },
  { key: 'interview', label: 'Interview', dot: 'bg-amber-500' },
  { key: 'offer', label: 'Offer', dot: 'bg-emerald-500' },
  { key: 'rejected', label: 'Rejected', dot: 'bg-rose-500' },
];

function CardContent({ app }) {
  return (
    <>
      <div className="font-semibold truncate mb-1">{app.company}</div>
      <p className="text-slate-500 truncate mb-1.5">{app.role}</p>
      <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t dark:border-slate-800">
        <span className="font-mono">{formatSalaryRange(app.salaryMin, app.salaryMax, app.currency)}</span>
        <span>{formatDate(app.dateApplied)}</span>
      </div>
    </>
  );
}

function KanbanCard({ app, isUpdating }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id, disabled: isUpdating });

  return (
    <div
      ref={setNodeRef} {...attributes} {...listeners}
      className={`bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-2.5 text-xs select-none ${
        isUpdating ? 'opacity-60 cursor-wait' : 'cursor-grab active:cursor-grabbing'
      } ${isDragging ? 'opacity-25 border-dashed border-blue-400' : ''}`}
    >
      <CardContent app={app} />
    </div>
  );
}

function KanbanColumn({ column, applications, updatingIds }) {
  const { isOver, setNodeRef } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 flex flex-col rounded border ${
        isOver ? 'bg-blue-50 dark:bg-blue-950 border-blue-400' : 'bg-slate-100 dark:bg-slate-900 dark:border-slate-800'
      }`}
    >
      <div className="p-2.5 border-b dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.dot}`} />
          <h2 className="text-xs font-bold">{column.label}</h2>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-semibold bg-white dark:bg-slate-800 rounded border dark:border-slate-700">
          {applications.length}
        </span>
      </div>
      <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-210px)] min-h-[140px]">
        {applications.length === 0 ? (
          <div className="h-20 flex items-center justify-center border border-dashed rounded text-[11px] text-slate-400 dark:border-slate-700">Empty</div>
        ) : (
          applications.map((app) => <KanbanCard key={app.id} app={app} isUpdating={updatingIds.has(app.id)} />)
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const dispatch = useDispatch();
  const applications = useSelector(selectAllApplications);
  const isAllLoaded = useSelector(selectIsAllLoaded);
  const fetchAllStatus = useSelector(selectFetchAllStatus);
  const fetchAllError = useSelector(selectFetchAllError);

  const [toast, setToast] = useState(null);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (!isAllLoaded && fetchAllStatus !== 'loading') dispatch(fetchAllApplications());
  }, [dispatch, isAllLoaded, fetchAllStatus]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeApp = activeId ? applications.find((a) => a.id === activeId) : null;

  const handleDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const appId = active.id;
    const targetStatus = over.id;
    if (updatingIds.has(appId)) return;
    const currentApp = applications.find((a) => a.id === appId);
    if (!currentApp || currentApp.status === targetStatus) return;

    const previousStatus = currentApp.status;
    const previousDateApplied = currentApp.dateApplied;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const updates = { status: targetStatus };
    if (targetStatus === 'wishlist') updates.dateApplied = null;
    else if (!currentApp.dateApplied) updates.dateApplied = today;

    dispatch(optimisticStatusUpdate({ id: appId, status: targetStatus, dateApplied: updates.dateApplied }));
    setUpdatingIds((prev) => new Set(prev).add(appId));

    try {
      const res = await dispatch(updateApplication({ id: appId, currentApp, updates }));
      if (updateApplication.rejected.match(res)) throw new Error(res.payload || 'Failed to update status');
    } catch (err) {
      dispatch(optimisticStatusUpdate({ id: appId, status: previousStatus, dateApplied: previousDateApplied }));
      const isChaosFail = String(err?.message || err).includes('Chaos Mode');
      setToast({
        message: isChaosFail ? 'Chaos Mode: Simulated network failure (20%). Reverted changes.' : 'Failed to update status. Reverted changes.',
        type: 'error',
      });
    } finally {
      setUpdatingIds((prev) => { const next = new Set(prev); next.delete(appId); return next; });
    }
  };

  const header = (
    <div>
      <h1 className="text-xl font-bold">Pipeline Board</h1>
      <p className="text-xs text-slate-500">Drag and drop applications across recruitment stages</p>
    </div>
  );

  if (fetchAllStatus === 'loading' && !isAllLoaded) {
    return <div className="space-y-4">{header}<PipelineSkeleton /></div>;
  }

  if (fetchAllStatus === 'failed') {
    return (
      <div className="space-y-4">
        {header}
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-300 text-red-600 rounded text-center text-xs space-y-2">
          <p>{fetchAllError || 'Failed to load pipeline data.'}</p>
          <button type="button" onClick={() => dispatch(fetchAllApplications())} className="px-3 py-1 bg-red-600 text-white rounded">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      {applications.length === 0 ? (
        <div className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded text-center text-xs text-slate-400">
          No applications in the pipeline. Add an application to get started.
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.key} column={col} applications={applications.filter((a) => a.status === col.key)} updatingIds={updatingIds} />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeApp ? (
              <div className="w-72 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded p-2.5 text-xs select-none">
                <CardContent app={activeApp} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
