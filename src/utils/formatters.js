export const formatSalaryNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  if (num >= 10000000) return `${Number.isInteger(num / 10000000) ? num / 10000000 : (num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${Number.isInteger(num / 100000) ? num / 100000 : (num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${Number.isInteger(num / 1000) ? num / 1000 : (num / 1000).toFixed(1)}k`;
  return num.toString();
};

export const formatSalaryRange = (min, max, currency = 'INR') => {
  if (!min && !max) return 'Not disclosed';
  const c = currency || 'INR';
  if (min && max) return min === max ? `${c} ${formatSalaryNumber(min)}` : `${c} ${formatSalaryNumber(min)} – ${formatSalaryNumber(max)}`;
  return min ? `${c} ${formatSalaryNumber(min)}+` : `Up to ${c} ${formatSalaryNumber(max)}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Not applied yet';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
