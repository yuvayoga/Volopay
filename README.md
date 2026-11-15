# JobApplicationTracker

A single-page application to track job applications through a hiring pipeline, built with React, Redux Toolkit, and Tailwind CSS.

---

## Tech Stack

- **React 19** — User interface library
- **Vite 8** — Build tool and development server
- **Redux Toolkit** — State management (`createSlice`, `createAsyncThunk`, `createSelector`, `createEntityAdapter`)
- **React Router v7** — Client-side routing with URL query synchronization for search, filters, sort, and pagination
- **Tailwind CSS v3** — Utility-first CSS framework with native `dark:` variants
- **json-server 0.17.4** — Mock REST API with simulated network delay (`--delay 600`)

### Libraries Chosen & Why

| Library | Purpose | Why Chosen |
|---|---|---|
| **@dnd-kit/core** | Drag-and-drop on the Pipeline Kanban board | Lightweight, accessible, React-first DnD library. Provides `PointerSensor`, `useDraggable`, `useDroppable`, and `DragOverlay` without heavy abstractions or unnecessary wrappers. |
| **Recharts** | Status breakdown bar chart on Dashboard | Declarative, composable chart library built on React SVG primitives. Provides `ResponsiveContainer`, `BarChart`, `Bar`, `XAxis`, and `YAxis` with zero D3 boilerplate. |

---

## Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 9.x

### Installation

```bash
npm install
```

### Running the Application

Start the mock API server and the development server in two separate terminal windows:

```bash
# Terminal 1 — Mock API (port 3001 with 600ms network delay)
npm run mock

# Terminal 2 — Vite Dev Server (port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build & Preview for Production

```bash
npm run build
npm run preview
```

### Run ESLint

```bash
npm run lint
```

---

## Project Structure

The project is structured by feature in accordance with the assignment specifications:

```
src/
├── api/
│   └── applicationsApi.js        # Centralized fetch API module for all network calls
├── app/
│   └── store.js                  # Redux Toolkit store configuration
├── components/
│   ├── confirmationmodal.jsx     # Delete confirmation modal (Escape key & backdrop dismiss)
│   ├── layout.jsx                # Header, navigation, theme toggle, and page outlet
│   ├── notfoundpage.jsx          # 404 Not Found state
│   ├── skeleton.jsx              # Loading skeletons (table rows, detail, form, pipeline)
│   ├── statusbadge.jsx           # Color-coded status badge
│   └── toast.jsx                 # Dismissible toast notification
├── features/
│   ├── applications/
│   │   ├── applicationDetailPage.jsx # Full application detail view + status history timeline
│   │   ├── applicationsFormPage.jsx  # Reused Create & Edit form with custom useForm hook
│   │   ├── applicationsListPage.jsx  # Paginated list, search, filter, sort, bulk actions, CSV
│   │   └── applicationsSlice.js      # Entity adapter, async thunks, normalized reducers & selectors
│   ├── dashboard/
│   │   ├── dashboardPage.jsx         # Summary metric cards + Recharts status bar chart
│   │   └── dashboardSelectors.js     # Memoized createSelector for derived dashboard analytics
│   └── pipeline/
│       └── PipelinePage.jsx          # Kanban board with drag-and-drop, optimistic updates & rollback
├── hooks/
│   ├── usedebounce.js            # Debounce hook (300ms) for search input
│   └── useform.jsx               # Custom form hook (values, errors, touched, handlers)
├── utils/
│   └── formatters.js             # Currency range, date, and timestamp formatting utilities
├── App.jsx                       # Route definitions
├── index.css                     # Tailwind base directives & dark-mode styling
└── main.jsx                      # Application entry point
```

---

## Redux State Organization

All application state is managed in Redux Toolkit following normalized entity patterns and strict separation of concerns:

```javascript
{
  applications: {
    ids: [1, 2, 3, ...],
    entities: { 1: { ... }, 2: { ... } },
    listIds: [1, 2, 3, ...],
    allLoaded: false,
    totalCount: 40,
    listRequestId: null,
    detailRequestId: null,
    fetchStatus: 'idle',           // 'idle' | 'loading' | 'succeeded' | 'failed'
    fetchError: null,
    fetchAllStatus: 'idle',
    fetchAllError: null,
    currentApplication: null,
    currentApplicationStatus: 'idle',
    currentApplicationError: null,
    createStatus: 'idle',
    createError: null,
    updateStatus: 'idle',
    updateError: null,
    deleteStatus: 'idle',
    deleteError: null
  }
}
```

### Key Redux Design Choices:
1. **Centralized API Layer**: All `fetch` calls reside strictly in `src/api/applicationsApi.js`. Components never make raw network requests.
2. **Normalized Data Cache**: `createEntityAdapter` manages the entities map and handles atomic operations (`upsertOne`, `upsertMany`, `removeOne`, `removeMany`).
3. **Independent Lifecycle Tracking**: List pagination (`fetchStatus`), detail viewing (`currentApplicationStatus`), entity updates (`updateStatus`), and entity deletions (`deleteStatus`) have dedicated status fields so concurrent actions never overwrite one another.
4. **Memoized Selectors**:
   - `selectListApplications`: Maps paginated `listIds` to entities without unnecessary recalculations.
   - `selectDashboardMetrics`: Computes total counts, response rate, interviews this month, and offers directly from `statusHistory` entries via `createSelector`.

---

## Features Implemented

### Tier 1 — Core (Required)

1. **Applications List (`/applications`)**:
   - Displays Company, Role, Status badge, Date Applied, and formatted Salary Range (e.g. `INR 9L – 15L`).
   - Search by company or role with debounced input.
   - Filter by status (`wishlist`, `applied`, `interview`, `offer`, `rejected`).
   - Sort by Date Applied or Company (Ascending / Descending).
   - Server-side pagination at 10 items per page with total count indicator.
   - **Full URL Query Synchronization**: Search, status filter, sort column, sort order, and page number are reflected in URL query parameters (`?search=...&status=...&page=...`), preserving view state across refreshes, bookmarks, and back-button navigation.
2. **Application Detail (`/applications/:id`)**:
   - Displays all fields (ID, company, role, salary range, location, location type, job URL, notes, createdAt, updatedAt).
   - Visual status history timeline with formatted dates and times.
   - Proper 404 Not Found state with fallback redirect when an invalid ID is requested.
3. **Create & Edit Form (`/applications/new` and `/applications/:id/edit`)**:
   - Single form component reused for both create and edit flows.
   - Powered entirely by a custom `useForm` hook (manages values, errors, touched state, blur, change, submit, and reset handlers).
   - Validations:
     - Company and Role are required.
     - Job URL must be a valid HTTP/HTTPS URL if provided.
     - Min salary cannot exceed max salary; cannot be negative.
     - Date applied cannot be in the future.
     - Date applied is required unless status is `wishlist`.
   - Inline error messages next to invalid fields.
   - Submit button disabled while saving to prevent double submission.
4. **Delete with Confirmation**:
   - Accessible modal prompts for confirmation before any record is deleted.
   - Dismissible via `Escape` key or clicking the background backdrop.
   - Handles deletion loading and server error states.
5. **Async States Everywhere**:
   - Loading skeletons across all screens (table rows, detail cards, form fields, pipeline board).
   - Error states with "Retry" action buttons on network failure.
   - Empty states for zero search/filter results and empty pipeline columns.

---

### Tier 2 — Intermediate

6. **Pipeline Kanban Board (`/pipeline`)**:
   - Five status columns: `Wishlist`, `Applied`, `Interview`, `Offer`, `Rejected`.
   - Smooth drag-and-drop movement powered by `@dnd-kit/core`.
   - **Optimistic Updates & Rollback**: Dragging a card updates Redux immediately. If the server request fails, the card automatically rolls back to its previous column and a toast notification displays the error. In-flight cards are locked during saves to prevent race conditions.
   - Automatically maintains `statusHistory` entries and timestamps on every move.
7. **Chaos Mode**:
   - Environment flag `VITE_CHAOS_MODE=true` simulates ~20% random API failures on status updates to verify optimistic rollback and toast notifications in action.
8. **Dashboard (`/`)**:
   - Overview metric cards: Total Applications, Response Rate (`(Interviews + Offers + Rejections) / Submitted * 100`), Interviews This Month (evaluated from status transition history), and Offers.
   - Status breakdown bar chart built with Recharts.
   - All analytics computed on the fly using memoized `createSelector`.
9. **Debounced Search**:
   - 300ms debounce hook avoids firing network requests on every keystroke.
10. **Dark and Light Theme**:
    - Follows system `prefers-color-scheme` by default with live event listener.
    - Manual toggle button in the navigation header allows overriding the system preference.
    - Theme preference persists across sessions in `localStorage`.

---

### Tier 3 — Stretch Features

11. **Bulk Actions on Applications List**:
    - Select multiple rows via individual row checkboxes or the table header "Select All" checkbox.
    - Bulk Action Bar displays selected count with actions:
      - **Bulk Status Change**: Update all selected applications to any status at once.
      - **Bulk Delete**: Delete all selected applications with confirmation.
    - Integrated with dedicated Redux async thunks (`bulkUpdateStatus`, `bulkDeleteApplications`) and atomic entity adapter methods (`upsertMany`, `removeMany`).
12. **CSV Export of Filtered View**:
    - One-click **"Export CSV"** button on the Applications List page.
    - Generates and downloads RFC-4180 compliant CSV of the currently filtered/searched records using standard browser `Blob` APIs without extra dependencies.

---

## Chaos Mode Testing

Chaos mode makes roughly 20% of status updates fail in the API layer to demonstrate optimistic update rollback and error toast notifications.

### How to Enable:
1. In your `.env` file (or `.env.example`):
   ```env
   VITE_CHAOS_MODE=true
   ```
2. Or start the Vite server with the environment variable:
   ```bash
   VITE_CHAOS_MODE=true npm run dev
   ```

### How to Verify:
1. Navigate to the **Pipeline Board** (`/pipeline`).
2. Drag cards between different status columns.
3. Approximately 1 out of 5 drops will trigger a simulated network failure:
   - The card instantly bounces back to its original column.
   - An error toast appears: `"Chaos Mode: Simulated network failure (20%). Reverted changes."`

---

## Known Limitations

- **Mock API Full-Text Search Scope**: Because `json-server 0.17`'s built-in `q` query searches all fields (including notes and locations), the API layer fetches the filtered/sorted dataset and applies precise company and role matching in memory to guarantee search scope accuracy.
- **Client Concurrency**: State updates rely on optimistic UI with rollback. If two separate browser windows edit the same record concurrently, the latest write commits (standard for client-side REST APIs without WebSockets).

---

## What to Build Next (With Another Week)

1. **Activity History & Interview Notes**: Expand `statusHistory` into an interactive timeline where users can record interview feedback, round numbers, and interviewer details.
2. **Undo for Deletions**: Replace the confirmation modal with a non-blocking 5-second undo toast before the deletion commits to the server.
3. **Calendar View**: A monthly calendar showing application deadlines and upcoming interview dates.
4. **Service Worker Offline Cache**: Enable offline browsing and read-only access with background synchronization when reconnecting.
