export default function Badge({ status, text }) {
  const label = text || status;
  const statusStyles = {
    applied: 'bg-blue-50 text-blue-700 border-blue-200',
    reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
    shortlisted: 'bg-violet-50 text-violet-700 border-violet-200',
    interview: 'bg-sky-50 text-sky-700 border-sky-200',
    selected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-200',
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
    rescheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const style = statusStyles[status?.toLowerCase()] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
      {label}
    </span>
  );
}
