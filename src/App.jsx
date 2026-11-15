import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout';
import NotFoundPage from './components/notfoundpage';
import DashboardPage from './features/dashboard/dashboardPage';
import ApplicationsListPage from './features/applications/applicationsListPage';
import ApplicationDetailPage from './features/applications/applicationDetailPage';
import ApplicationFormPage from './features/applications/applicationsFormPage';
import PipelinePage from './features/pipeline/PipelinePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsListPage />} />
        <Route path="applications/new" element={<ApplicationFormPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="applications/:id/edit" element={<ApplicationFormPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
