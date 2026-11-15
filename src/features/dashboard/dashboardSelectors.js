import { createSelector } from '@reduxjs/toolkit';
import { selectAllApplications } from '../applications/applicationsSlice';

export const selectDashboardMetrics = createSelector(
  [selectAllApplications],
  (applications) => {
    const total = applications.length;
    const counts = { wishlist: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let interviewsThisMonth = 0;

    applications.forEach((app) => {
      const s = app.status?.toLowerCase();
      if (counts[s] !== undefined) counts[s] += 1;

      const history = Array.isArray(app.statusHistory) ? app.statusHistory : [];
      const interviewEntries = history.filter(
        (h) => h.status?.toLowerCase() === 'interview' && h.changedAt
      );

      const hadInterviewThisMonth = interviewEntries.some((h) => {
        const d = new Date(h.changedAt);
        return (
          !isNaN(d.getTime()) &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      });

      if (hadInterviewThisMonth) {
        interviewsThisMonth += 1;
      }
    });

    const submitted = counts.applied + counts.interview + counts.offer + counts.rejected;
    const responded = counts.interview + counts.offer + counts.rejected;
    const responseRate = submitted === 0 ? 0 : Math.round((responded / submitted) * 100);

    return {
      total,
      responseRate,
      interviewsThisMonth,
      offerCount: counts.offer,
      byStatus: [
        { status: 'Wishlist', count: counts.wishlist },
        { status: 'Applied', count: counts.applied },
        { status: 'Interview', count: counts.interview },
        { status: 'Offer', count: counts.offer },
        { status: 'Rejected', count: counts.rejected },
      ],
    };
  }
);
