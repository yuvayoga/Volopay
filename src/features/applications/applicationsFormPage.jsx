import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useForm from '../../hooks/useform';
import {
  createApplication,
  updateApplication,
  fetchApplicationById,
  clearCurrentApplication,
  selectCurrentApplication,
  selectCurrentApplicationStatus,
  selectCurrentApplicationError,
  selectCreateStatus,
  selectCreateError,
  selectUpdateStatus,
  selectUpdateError,
  resetOperationStatus,
} from './applicationsSlice';
import { FormSkeleton } from '../../components/skeleton';

const today = () => new Date().toISOString().split('T')[0];

const DEFAULT_VALUES = {
  company: '', role: '', status: 'applied', jobUrl: '',
  salaryMin: '', salaryMax: '', currency: 'INR',
  locationType: 'onsite', location: '', dateApplied: '', notes: '',
};

const validate = (values) => {
  const errors = {};
  if (!values.company?.trim()) errors.company = 'Company is required.';
  if (!values.role?.trim()) errors.role = 'Role is required.';

  if (values.jobUrl?.trim()) {
    try {
      const u = new URL(values.jobUrl.trim());
      if (!['http:', 'https:'].includes(u.protocol)) errors.jobUrl = 'Must start with http:// or https://';
    } catch {
      errors.jobUrl = 'Invalid URL.';
    }
  }

  const min = values.salaryMin !== '' && values.salaryMin != null ? Number(values.salaryMin) : null;
  const max = values.salaryMax !== '' && values.salaryMax != null ? Number(values.salaryMax) : null;
  if (min !== null && (isNaN(min) || min < 0)) errors.salaryMin = 'Cannot be negative.';
  if (max !== null && (isNaN(max) || max < 0)) errors.salaryMax = 'Cannot be negative.';
  if (min !== null && max !== null && min >= 0 && max >= 0 && min > max) {
    errors.salaryMin = 'Min cannot exceed max.';
  }

  if (values.status !== 'wishlist' && !values.dateApplied) {
    errors.dateApplied = 'Required unless Wishlist.';
  } else if (values.dateApplied && new Date(values.dateApplied) > new Date().setHours(23, 59, 59, 999)) {
    errors.dateApplied = 'Cannot be in future.';
  }

  return errors;
};

function Field({ label, name, required, error, touched, children, ...props }) {
  return (
    <div className="space-y-1">
      <label htmlFor={`f-${name}`} className="block text-xs font-medium">
        {label} {required && '*'}
      </label>
      {children || (
        <input
          id={`f-${name}`}
          name={name}
          className={`w-full p-1.5 text-xs border rounded bg-transparent dark:border-slate-700 ${touched && error ? 'border-red-500' : ''}`}
          {...props}
        />
      )}
      {touched && error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function FormBody({ id, isEditing, currentApp }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const createStatus = useSelector(selectCreateStatus);
  const createError = useSelector(selectCreateError);
  const updateStatus = useSelector(selectUpdateStatus);
  const updateError = useSelector(selectUpdateError);

  const initialValues = isEditing && currentApp
    ? { ...DEFAULT_VALUES, ...currentApp, salaryMin: currentApp.salaryMin ?? '', salaryMax: currentApp.salaryMax ?? '', dateApplied: currentApp.dateApplied || '' }
    : { ...DEFAULT_VALUES, dateApplied: today() };

  const onSubmit = async (vals) => {
    const toNum = (v) => (v !== '' && v != null ? Number(v) : null);
    const payload = {
      ...vals,
      company: vals.company.trim(),
      role: vals.role.trim(),
      jobUrl: vals.jobUrl.trim(),
      location: vals.location.trim(),
      notes: vals.notes.trim(),
      salaryMin: toNum(vals.salaryMin),
      salaryMax: toNum(vals.salaryMax),
      dateApplied: vals.status === 'wishlist' ? null : (vals.dateApplied || null),
    };

    const action = isEditing ? updateApplication({ id: Number(id) || id, currentApp, updates: payload }) : createApplication(payload);
    const res = await dispatch(action);
    if ((isEditing ? updateApplication : createApplication).fulfilled.match(res)) {
      navigate(isEditing ? `/applications/${id}` : '/applications');
    }
  };

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setFieldValue } = useForm({
    initialValues,
    validate,
    onSubmit,
  });

  const onStatusChange = (e) => {
    const val = e.target.value;
    handleChange(e);
    if (val !== 'wishlist' && !values.dateApplied) setFieldValue('dateApplied', today());
    else if (val === 'wishlist') setFieldValue('dateApplied', '');
  };

  const isSaving = isSubmitting || createStatus === 'loading' || updateStatus === 'loading';
  const serverError = isEditing ? updateError : createError;
  const backUrl = isEditing ? `/applications/${id}` : '/applications';
  const selectClass = 'w-full p-1.5 text-xs border rounded bg-transparent dark:border-slate-700';

  const bind = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: errors[name],
    touched: touched[name],
  });

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(backUrl));

  return (
    <div className="max-w-xl mx-auto space-y-4 text-xs">
      <button type="button" onClick={goBack} className="text-slate-500 hover:underline">&larr; Back</button>

      <div className="p-4 border rounded bg-white dark:bg-slate-900 dark:border-slate-800 space-y-3">
        <h1 className="text-base font-bold">{isEditing ? `Edit: ${currentApp?.company}` : 'New Application'}</h1>

        {serverError && <p className="p-2 border border-red-200 bg-red-50 dark:bg-red-950 text-red-600 rounded">{serverError}</p>}

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company" required {...bind('company')} />
            <Field label="Role" required {...bind('role')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" name="status" required>
              <select id="f-status" name="status" value={values.status} onChange={onStatusChange} onBlur={handleBlur} className={selectClass}>
                <option value="wishlist">Wishlist</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </Field>

            <Field
              label="Date Applied"
              type="date"
              required={values.status !== 'wishlist'}
              disabled={values.status === 'wishlist'}
              {...bind('dateApplied')}
            />
          </div>

          <Field label="Job URL" type="url" placeholder="https://..." {...bind('jobUrl')} />

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Min Salary (${values.currency})`} type="number" min="0" placeholder="e.g. 900000" {...bind('salaryMin')} />
            <Field label={`Max Salary (${values.currency})`} type="number" min="0" placeholder="e.g. 1500000" {...bind('salaryMax')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" placeholder="e.g. Pune" {...bind('location')} />
            <Field label="Location Type" name="locationType">
              <select id="f-locationType" name="locationType" value={values.locationType} onChange={handleChange} onBlur={handleBlur} className={selectClass}>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </Field>
          </div>

          <Field label="Notes" name="notes">
            <textarea id="f-notes" name="notes" rows={3} value={values.notes} onChange={handleChange} onBlur={handleBlur} className={selectClass} />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
            <button type="button" onClick={goBack} className="px-3 py-1.5 border rounded">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-3 py-1.5 bg-blue-600 text-white rounded disabled:opacity-50">
              {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ApplicationFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const dispatch = useDispatch();

  const currentApp = useSelector(selectCurrentApplication);
  const status = useSelector(selectCurrentApplicationStatus);
  const fetchError = useSelector(selectCurrentApplicationError);

  useEffect(() => {
    if (isEditing && id) dispatch(fetchApplicationById(id));
    return () => {
      dispatch(clearCurrentApplication());
      dispatch(resetOperationStatus('create'));
      dispatch(resetOperationStatus('update'));
    };
  }, [dispatch, id, isEditing]);

  if (isEditing && status === 'failed') {
    return (
      <div className="max-w-md mx-auto p-4 border border-red-300 rounded text-center space-y-2 text-xs">
        <p className="text-red-600">{fetchError?.message || 'Failed to load application.'}</p>
        <button type="button" onClick={() => dispatch(fetchApplicationById(id))} className="px-3 py-1 bg-red-600 text-white rounded">
          Retry
        </button>
      </div>
    );
  }

  if (isEditing && (!currentApp || String(currentApp.id) !== String(id))) {
    return <FormSkeleton />;
  }

  return <FormBody key={id || 'new'} id={id} isEditing={isEditing} currentApp={isEditing ? currentApp : null} />;
}
