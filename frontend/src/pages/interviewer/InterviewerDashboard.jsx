import { useState, useEffect } from 'react';
import { interviewService } from '../../services/interviewService';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import {
  Calendar,
  MessageSquare,
  Users,
  Clock,
  Video,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InterviewerDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const data = await interviewService.getAssignedInterviews();
        setInterviews(data || []);
      } catch {
        toast.error('Failed to load assigned interviews');
      } finally {
        setLoading(false);
      }
    };
    fetchAssigned();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const completedCount = interviews.filter((i) => i.has_feedback || i.status === 'completed').length;
  const pendingCount = interviews.filter((i) => i.status === 'scheduled' && !i.has_feedback).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Interviewer Workspace</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Access your assigned candidate interviews, review resumes, and submit standardized evaluation scorecards.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Assigned</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{interviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Pending Rounds</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Feedback Submitted</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Interviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Assigned Interviews</h2>
          <Link
            to="/interviewer/interviews"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {interviews.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              You do not have any assigned interviews currently.
            </div>
          ) : (
            interviews.map((iv) => (
              <div
                key={iv.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{iv.candidate_name}</h3>
                    <Badge status={iv.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Role: <strong className="text-slate-700">{iv.job_title}</strong> • Round: {iv.interview_type}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled: {new Date(iv.scheduled_date).toLocaleString()} ({iv.duration_minutes}m)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {iv.meeting_link && (
                    <a
                      href={iv.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5 text-slate-600" /> Join Meet
                    </a>
                  )}
                  {iv.has_feedback ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50">
                      <CheckCircle className="w-3.5 h-3.5" /> Feedback Done
                    </span>
                  ) : (
                    <Link
                      to={`/interviewer/feedback?interview_id=${iv.id}`}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      Submit Feedback
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
