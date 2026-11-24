import { useState, useEffect } from 'react';
import { interviewService } from '../../services/interviewService';
import { adminService } from '../../services/adminService';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Edit3,
  Trash2,
  User,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [rescheduleIv, setRescheduleIv] = useState(null);
  const [cancelIvId, setCancelIvId] = useState(null);
  const [feedbackViewIv, setFeedbackViewIv] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);

  // Dropdown options for scheduling
  const [applications, setApplications] = useState([]);
  const [interviewers, setInterviewers] = useState([]);

  // Form states
  const [form, setForm] = useState({
    application_id: '',
    interviewer_user_id: '',
    scheduled_date: '',
    duration_minutes: 60,
    interview_type: 'technical',
    meeting_link: 'https://meet.google.com/xyz-recruitment-demo',
    notes: '',
  });

  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  const fetchInterviews = async () => {
    try {
      const data = await interviewService.getAllInterviews();
      setInterviews(data || []);
    } catch {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleOptions = async () => {
    try {
      const [appsData, invsData] = await Promise.all([
        adminService.getApplications(),
        adminService.getInterviewers(),
      ]);
      setApplications(appsData || []);
      setInterviewers(invsData || []);

      if (appsData && appsData.length > 0 && !form.application_id) {
        setForm((prev) => ({
          ...prev,
          application_id: appsData[0].id,
          interviewer_user_id: invsData && invsData.length > 0 ? invsData[0].id : prev.interviewer_user_id,
        }));
      }
    } catch {
      console.error('Failed to load schedule options');
    }
  };

  useEffect(() => {
    fetchInterviews();
    loadScheduleOptions();
  }, []);

  const handleOpenSchedule = () => {
    if (applications.length > 0 && (!form.application_id || form.application_id === '')) {
      setForm((prev) => ({
        ...prev,
        application_id: applications[0].id,
        interviewer_user_id: interviewers.length > 0 ? interviewers[0].id : '',
      }));
    }
    setIsScheduleOpen(true);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!form.application_id) {
      toast.error('Please select an application');
      return;
    }
    if (!form.interviewer_user_id) {
      toast.error('Please select an interviewer');
      return;
    }
    if (!form.scheduled_date) {
      toast.error('Please pick a date and time');
      return;
    }
    try {
      await interviewService.scheduleInterview({
        ...form,
        application_id: parseInt(form.application_id),
        interviewer_user_id: parseInt(form.interviewer_user_id),
        scheduled_date: new Date(form.scheduled_date).toISOString(),
      });
      toast.success('Interview successfully scheduled & candidate notified!');
      setIsScheduleOpen(false);
      fetchInterviews();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to schedule interview');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleIv) return;
    try {
      await interviewService.rescheduleInterview(rescheduleIv.id, {
        scheduled_date: new Date(rescheduleDate).toISOString(),
        notes: rescheduleNotes || null,
      });
      toast.success('Interview rescheduled successfully!');
      setRescheduleIv(null);
      fetchInterviews();
    } catch {
      toast.error('Failed to reschedule interview');
    }
  };

  const handleCancel = async () => {
    if (!cancelIvId) return;
    try {
      await interviewService.cancelInterview(cancelIvId);
      toast.success('Interview cancelled');
      setCancelIvId(null);
      fetchInterviews();
    } catch {
      toast.error('Failed to cancel interview');
    }
  };

  const handleViewFeedback = async (iv) => {
    setFeedbackViewIv(iv);
    try {
      const fb = await interviewService.getFeedback(iv.id);
      setFeedbackData(fb);
    } catch {
      toast.error('Failed to fetch feedback');
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-slate-900">Interview Operations & Schedules</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Coordinate rounds, assign technical interviewers, and monitor candidate evaluations.
          </p>
        </div>
        <button
          onClick={handleOpenSchedule}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Schedule Interview
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {interviews.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No scheduled interviews currently. Click &quot;Schedule Interview&quot; to arrange one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Job Role</th>
                  <th className="py-3.5 px-6">Interviewer</th>
                  <th className="py-3.5 px-6">Scheduled Date & Time</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interviews.map((iv) => (
                  <tr key={iv.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{iv.candidate_name}</div>
                      <div className="text-xs text-slate-400">{iv.candidate_email}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700 font-medium">{iv.job_title}</td>
                    <td className="py-4 px-6 text-xs text-slate-700">{iv.interviewer_name}</td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      <div>{new Date(iv.scheduled_date).toLocaleDateString()}</div>
                      <div className="text-slate-400">
                        {new Date(iv.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        ({iv.duration_minutes}m)
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs capitalize text-slate-600 font-medium">
                      {iv.interview_type}
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={iv.status} />
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {iv.has_feedback && (
                        <button
                          onClick={() => handleViewFeedback(iv)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="View Evaluation Feedback"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setRescheduleIv(iv);
                          setRescheduleDate(iv.scheduled_date ? iv.scheduled_date.slice(0, 16) : '');
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Reschedule Interview"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {iv.status !== 'cancelled' && (
                        <button
                          onClick={() => setCancelIvId(iv.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Cancel Interview"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Interview Modal */}
      {isScheduleOpen && (
        <Modal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          title="Schedule Candidate Interview"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSchedule} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Candidate & Applied Role *
              </label>
              {applications.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                  No applications found. Candidates must apply or be shortlisted first.
                </div>
              ) : (
                <select
                  value={form.application_id}
                  onChange={(e) => setForm({ ...form, application_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.candidate_name} — {app.job_title} ({app.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assigned Interviewer *
              </label>
              {interviewers.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                  No interviewers registered yet.
                </div>
              ) : (
                <select
                  value={form.interviewer_user_id}
                  onChange={(e) => setForm({ ...form, interviewer_user_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  {interviewers.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.full_name} ({inv.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date and Time *
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                step="15"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Interview Type
              </label>
              <select
                value={form.interview_type}
                onChange={(e) => setForm({ ...form, interview_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="technical">Technical Round</option>
                <option value="hr">HR / Behavioral</option>
                <option value="system_design">System Design</option>
                <option value="culture_fit">Culture Fit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Video Meeting Link
              </label>
              <input
                type="url"
                value={form.meeting_link}
                onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Internal Recruiter Notes
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Topic coverage, focal technical areas..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-xs"
              >
                Schedule & Notify
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {rescheduleIv && (
        <Modal
          isOpen={!!rescheduleIv}
          onClose={() => setRescheduleIv(null)}
          title={`Reschedule Interview: ${rescheduleIv.candidate_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleReschedule} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                New Date and Time *
              </label>
              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reschedule Reason / Notes
              </label>
              <textarea
                rows={3}
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="Reason for schedule adjustment..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleIv(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-xs"
              >
                Confirm Reschedule
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!cancelIvId}
        onClose={() => setCancelIvId(null)}
        onConfirm={handleCancel}
        title="Cancel Interview"
        message="Are you sure you want to cancel this interview? The candidate and interviewer will receive cancellation notifications."
      />

      {/* Feedback View Modal */}
      {feedbackViewIv && (
        <Modal
          isOpen={!!feedbackViewIv}
          onClose={() => {
            setFeedbackViewIv(null);
            setFeedbackData(null);
          }}
          title={`Interview Evaluation: ${feedbackViewIv.candidate_name}`}
          maxWidth="max-w-lg"
        >
          {!feedbackData ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading feedback...</div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Recommendation
                  </span>
                  <p className="text-lg font-bold text-slate-900 capitalize">
                    {feedbackData.recommendation?.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Overall Rating
                  </span>
                  <p className="text-2xl font-black text-indigo-600">{feedbackData.overall_rating} / 5</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Technical</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{feedbackData.technical_skills_rating} / 5</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Communication</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{feedbackData.communication_rating} / 5</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Problem Solving</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{feedbackData.problem_solving_rating} / 5</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Interviewer Remarks
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line">
                  {feedbackData.remarks}
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setFeedbackViewIv(null);
                    setFeedbackData(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
