import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { jobService } from '../../services/jobService';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import {
  Download,
  Filter,
  Users,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function AdminShortlist() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);

  // Status update modal
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [newStatus, setNewStatus] = useState('interview');
  const [adminDecision, setAdminDecision] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchShortlist = async () => {
    setLoading(true);
    try {
      const params = { status: 'shortlisted' };
      if (selectedJobId) params.job_id = selectedJobId;

      const [jobsData, appsData] = await Promise.all([
        jobService.getJobs('all'),
        adminService.getApplications(params),
      ]);
      setJobs(jobsData || []);
      setApplications(appsData || []);
    } catch {
      toast.error('Failed to load shortlisted applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlist();
  }, [selectedJobId]);

  const handleExport = async (format) => {
    try {
      const response = await adminService.exportShortlist(selectedJobId || null, format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shortlisted_candidates.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Exported shortlist as ${format.toUpperCase()}!`);
    } catch {
      toast.error(`Failed to export ${format}`);
    }
  };

  const handleOpenStatusModal = (app) => {
    setStatusModalApp(app);
    setNewStatus(app.status || 'interview');
    setAdminDecision(app.admin_decision || '');
    setAdminNotes(app.admin_notes || '');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusModalApp) return;
    setUpdating(true);
    try {
      await adminService.updateApplicationStatus(
        statusModalApp.id,
        newStatus,
        adminDecision || null,
        adminNotes || null
      );
      toast.success(`Candidate status updated to: ${newStatus}`);
      setStatusModalApp(null);
      fetchShortlist();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shortlisted Candidates</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Review top talent, advance candidates to interview rounds, and export datasets.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filter by Job */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Job:</span>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          >
            <option value="">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-500">
          Showing {applications.length} shortlisted candidates
        </span>
      </div>

      {/* Shortlisted Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No candidates shortlisted for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Role Applied</th>
                  <th className="py-3.5 px-6">AI Match Score</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Decision & Notes</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{app.candidate_name}</div>
                      <div className="text-xs text-slate-400">{app.candidate_email}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700 font-medium">
                      {app.job_title}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-bold text-slate-900">
                          {app.ai_match_score ? `${app.ai_match_score.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={app.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                      {app.admin_decision ? (
                        <div>
                          <span className="font-semibold text-indigo-700 capitalize">{app.admin_decision}: </span>
                          <span>{app.admin_notes || 'No notes'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Pending review</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenStatusModal(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Advance Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Human-in-the-Loop Status & Override Modal */}
      {statusModalApp && (
        <Modal
          isOpen={!!statusModalApp}
          onClose={() => setStatusModalApp(null)}
          title={`Update Status: ${statusModalApp.candidate_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Candidate Pipeline Stage
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Approve for Interview</option>
                <option value="selected">Selected for Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Human-in-the-Loop Override Decision (Optional)
              </label>
              <input
                type="text"
                value={adminDecision}
                onChange={(e) => setAdminDecision(e.target.value)}
                placeholder="e.g. Overriding AI recommendation based on technical portfolio"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Recruiter Evaluation Notes
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal rationale for this candidate's progression..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModalApp(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-xs"
              >
                {updating ? 'Updating...' : 'Save Decision'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
