import { createSlice, createAsyncThunk, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import {
  fetchApplicationsApi,
  fetchAllApplicationsApi,
  fetchApplicationByIdApi,
  createApplicationApi,
  updateApplicationApi,
  deleteApplicationApi,
  bulkUpdateStatusApi,
  bulkDeleteApplicationsApi,
} from '../../api/applicationsApi';

const applicationsAdapter = createEntityAdapter({
  selectId: (app) => app.id,
  sortComparer: (a, b) => new Date(b.dateApplied || b.createdAt) - new Date(a.dateApplied || a.createdAt),
});

const thunk = (type, fn) => createAsyncThunk(type, async (arg, { rejectWithValue }) => {
  try { return await fn(arg); } catch (e) { return rejectWithValue(type.includes('ById') ? { message: e.message, status: e.status || 0 } : e.message); }
});

export const fetchApplications = thunk('applications/fetchApplications', fetchApplicationsApi);
export const fetchAllApplications = thunk('applications/fetchAllApplications', fetchAllApplicationsApi);
export const fetchApplicationById = thunk('applications/fetchApplicationById', fetchApplicationByIdApi);
export const createApplication = thunk('applications/createApplication', createApplicationApi);
export const updateApplication = thunk('applications/updateApplication', ({ id, currentApp, updates }) => updateApplicationApi(id, currentApp, updates));
export const deleteApplication = createAsyncThunk('applications/deleteApplication', async (id, { rejectWithValue }) => {
  try { await deleteApplicationApi(id); return id; } catch (e) { return rejectWithValue(e.message); }
});
export const bulkUpdateStatus = createAsyncThunk('applications/bulkUpdateStatus', async ({ ids, status }, { getState, rejectWithValue }) => {
  try {
    const entities = selectApplicationEntities(getState());
    return await bulkUpdateStatusApi(ids.map((id) => ({ id, currentApp: entities[id], status })));
  } catch (e) { return rejectWithValue(e.message); }
});
export const bulkDeleteApplications = createAsyncThunk('applications/bulkDeleteApplications', async (ids, { rejectWithValue }) => {
  try { await bulkDeleteApplicationsApi(ids); return ids; } catch (e) { return rejectWithValue(e.message); }
});

const initialState = applicationsAdapter.getInitialState({
  listIds: [],
  allLoaded: false,
  listRequestId: null,
  fetchStatus: 'idle',
  fetchError: null,
  fetchAllStatus: 'idle',
  fetchAllError: null,
  totalCount: 0,
  detailRequestId: null,
  currentApplication: null,
  currentApplicationStatus: 'idle',
  currentApplicationError: null,
  createStatus: 'idle',
  createError: null,
  updateStatus: 'idle',
  updateError: null,
  deleteStatus: 'idle',
  deleteError: null,
});

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearCurrentApplication: (state) => {
      state.currentApplication = null;
      state.currentApplicationStatus = 'idle';
      state.currentApplicationError = null;
      state.detailRequestId = null;
    },
    resetOperationStatus: (state, action) => {
      const op = action.payload;
      if (op === 'create') { state.createStatus = 'idle'; state.createError = null; }
      if (op === 'update') { state.updateStatus = 'idle'; state.updateError = null; }
      if (op === 'delete') { state.deleteStatus = 'idle'; state.deleteError = null; }
    },
    optimisticStatusUpdate: (state, action) => {
      const { id, ...changes } = action.payload;
      applicationsAdapter.updateOne(state, { id, changes });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state, action) => {
        state.fetchStatus = 'loading';
        state.fetchError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        if (state.listRequestId === action.meta.requestId) {
          state.fetchStatus = 'succeeded';
          applicationsAdapter.upsertMany(state, action.payload.items);
          state.listIds = action.payload.items.map((app) => app.id);
          state.totalCount = action.payload.totalCount;
          state.listRequestId = null;
        }
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        if (state.listRequestId === action.meta.requestId) {
          state.fetchStatus = 'failed';
          state.fetchError = action.payload || 'Failed to fetch applications';
          state.listRequestId = null;
        }
      })

      .addCase(fetchAllApplications.pending, (state) => {
        state.fetchAllStatus = 'loading';
        state.fetchAllError = null;
      })
      .addCase(fetchAllApplications.fulfilled, (state, action) => {
        state.fetchAllStatus = 'succeeded';
        applicationsAdapter.setAll(state, action.payload);
        state.allLoaded = true;
        state.totalCount = action.payload.length;
      })
      .addCase(fetchAllApplications.rejected, (state, action) => {
        state.fetchAllStatus = 'failed';
        state.fetchAllError = action.payload || 'Failed to fetch all applications';
      })

      .addCase(fetchApplicationById.pending, (state, action) => {
        state.currentApplicationStatus = 'loading';
        state.currentApplicationError = null;
        state.detailRequestId = action.meta.requestId;
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        if (state.detailRequestId === action.meta.requestId) {
          state.currentApplicationStatus = 'succeeded';
          state.currentApplication = action.payload;
          applicationsAdapter.upsertOne(state, action.payload);
          state.detailRequestId = null;
        }
      })
      .addCase(fetchApplicationById.rejected, (state, action) => {
        if (state.detailRequestId === action.meta.requestId) {
          state.currentApplicationStatus = 'failed';
          state.currentApplicationError = action.payload || { message: 'Application not found', status: 0 };
          state.detailRequestId = null;
        }
      })

      .addCase(createApplication.pending, (state) => { state.createStatus = 'loading'; state.createError = null; })
      .addCase(createApplication.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        applicationsAdapter.addOne(state, action.payload);
        state.listIds = [action.payload.id, ...state.listIds];
        state.totalCount += 1;
      })
      .addCase(createApplication.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload || 'Failed to create application';
      })

      .addCase(updateApplication.pending, (state) => { state.updateStatus = 'loading'; state.updateError = null; })
      .addCase(updateApplication.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        applicationsAdapter.upsertOne(state, action.payload);
        if (state.currentApplication?.id === action.payload.id) state.currentApplication = action.payload;
      })
      .addCase(updateApplication.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload || 'Failed to update application';
      })

      .addCase(deleteApplication.pending, (state) => { state.deleteStatus = 'loading'; state.deleteError = null; })
      .addCase(deleteApplication.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        applicationsAdapter.removeOne(state, action.payload);
        state.listIds = state.listIds.filter((id) => id !== action.payload);
        state.totalCount = Math.max(0, state.totalCount - 1);
        if (state.currentApplication?.id === action.payload) state.currentApplication = null;
      })
      .addCase(deleteApplication.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.deleteError = action.payload || 'Failed to delete application';
      })
      .addCase(bulkUpdateStatus.pending, (state) => { state.updateStatus = 'loading'; state.updateError = null; })
      .addCase(bulkUpdateStatus.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        applicationsAdapter.upsertMany(state, action.payload);
      })
      .addCase(bulkUpdateStatus.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload || 'Failed to bulk update';
      })
      .addCase(bulkDeleteApplications.pending, (state) => { state.deleteStatus = 'loading'; state.deleteError = null; })
      .addCase(bulkDeleteApplications.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        applicationsAdapter.removeMany(state, action.payload);
        state.listIds = state.listIds.filter((id) => !action.payload.includes(id));
        state.totalCount = Math.max(0, state.totalCount - action.payload.length);
      })
      .addCase(bulkDeleteApplications.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.deleteError = action.payload || 'Failed to bulk delete';
      });
  },
});

export const { clearCurrentApplication, resetOperationStatus, optimisticStatusUpdate } = applicationsSlice.actions;
export default applicationsSlice.reducer;

export const {
  selectAll: selectAllApplications,
  selectEntities: selectApplicationEntities,
} = applicationsAdapter.getSelectors((state) => state.applications);

export const selectListApplications = createSelector(
  [selectApplicationEntities, (state) => state.applications.listIds],
  (entities, listIds) => (listIds || []).map((id) => entities[id]).filter(Boolean)
);

export const selectIsAllLoaded = (state) => state.applications.allLoaded;
export const selectFetchStatus = (state) => state.applications.fetchStatus;
export const selectFetchError = (state) => state.applications.fetchError;
export const selectTotalCount = (state) => state.applications.totalCount;
export const selectCurrentApplication = (state) => state.applications.currentApplication;
export const selectCurrentApplicationStatus = (state) => state.applications.currentApplicationStatus;
export const selectCurrentApplicationError = (state) => state.applications.currentApplicationError;
export const selectCreateStatus = (state) => state.applications.createStatus;
export const selectCreateError = (state) => state.applications.createError;
export const selectUpdateStatus = (state) => state.applications.updateStatus;
export const selectUpdateError = (state) => state.applications.updateError;
export const selectDeleteStatus = (state) => state.applications.deleteStatus;
export const selectDeleteError = (state) => state.applications.deleteError;
export const selectFetchAllStatus = (state) => state.applications.fetchAllStatus;
export const selectFetchAllError = (state) => state.applications.fetchAllError;
