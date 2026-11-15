const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const simulateChaos = () => {
  if (import.meta.env.VITE_CHAOS_MODE === 'true' && Math.random() < 0.2) {
    throw new Error('Chaos Mode: Simulated network failure.');
  }
};

const todayLocal = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

const json = async (url, opts) => {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = new Error(res.status === 404 ? `Not found (${res.status})` : `Request failed: ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res;
};

export const fetchApplicationsApi = async ({ page = 1, limit = 10, search = '', status = '', sortBy = 'dateApplied', order = 'desc' } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (sortBy) params.append('_sort', sortBy);
  if (order) params.append('_order', order);

  const term = (search || '').trim().toLowerCase();

  if (term) {
    const res = await json(`${BASE_URL}/applications?${params.toString()}`);
    const data = await res.json();
    const matched = data.filter((app) =>
      (app.company?.toLowerCase().includes(term)) || (app.role?.toLowerCase().includes(term))
    );
    const start = (page - 1) * limit;
    return { items: matched.slice(start, start + limit), totalCount: matched.length };
  }

  if (page) params.append('_page', page);
  if (limit) params.append('_limit', limit);

  const res = await json(`${BASE_URL}/applications?${params.toString()}`);
  const data = await res.json();
  const totalCount = parseInt(res.headers.get('x-total-count') || '0', 10);
  return { items: data, totalCount: totalCount || data.length };
};

export const fetchAllApplicationsApi = async () => {
  const res = await json(`${BASE_URL}/applications`);
  return res.json();
};

export const fetchApplicationByIdApi = async (id) => {
  const res = await json(`${BASE_URL}/applications/${id}`);
  return res.json();
};

export const createApplicationApi = async (applicationData) => {
  const nowIso = new Date().toISOString();
  const status = applicationData.status || 'wishlist';
  let dateApplied = applicationData.dateApplied;
  if (status === 'wishlist') dateApplied = null;
  else if (!dateApplied) dateApplied = todayLocal();

  const newApplication = {
    ...applicationData,
    status,
    dateApplied,
    statusHistory: [{ status, changedAt: nowIso }],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const res = await json(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newApplication),
  });
  return res.json();
};

export const updateApplicationApi = async (id, currentApp, updates) => {
  if (updates.status && updates.status !== currentApp?.status) simulateChaos();

  const nowIso = new Date().toISOString();
  let updatedStatusHistory = currentApp?.statusHistory ? [...currentApp.statusHistory] : [];

  if (updates.status && updates.status !== currentApp?.status) {
    updatedStatusHistory.push({ status: updates.status, changedAt: nowIso });
  }

  const payload = { ...updates, statusHistory: updatedStatusHistory, updatedAt: nowIso };

  if (payload.status === 'wishlist') {
    payload.dateApplied = null;
  } else if (payload.status && payload.status !== 'wishlist' && !payload.dateApplied && !currentApp?.dateApplied) {
    payload.dateApplied = todayLocal();
  }

  const res = await json(`${BASE_URL}/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const deleteApplicationApi = async (id) => {
  await json(`${BASE_URL}/applications/${id}`, { method: 'DELETE' });
  return id;
};

export const bulkUpdateStatusApi = async (items) => {
  return Promise.all(items.map(({ id, currentApp, status }) => updateApplicationApi(id, currentApp, { status })));
};

export const bulkDeleteApplicationsApi = async (ids) => {
  return Promise.all(ids.map((id) => deleteApplicationApi(id)));
};
