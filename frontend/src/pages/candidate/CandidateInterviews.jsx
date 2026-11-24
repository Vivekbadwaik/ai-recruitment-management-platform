import { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidateService';
import Badge from '../../components/Badge';
import { Calendar, Clock, Video, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CandidateInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const data = await candidateService.getInterviews();
        setInterviews(data || []);
      } catch {
        toast.error('Failed to load interviews');
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scheduled Interviews</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          View your interview schedules, interviewer information, and meeting links.
        </p>
      </div>

      <div className="space-y-4">
        {interviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No interviews currently scheduled. Once a recruiter shortlists your application, interview invitations will appear here.
          </div>
        ) : (
          interviews.map((iv) => (
            <div
              key={iv.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{iv.job_title}</h2>
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mt-0.5">
                    {iv.interview_type} Interview
                  </p>
                </div>
                <Badge status={iv.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    <strong>Date:</strong> {new Date(iv.scheduled_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    <strong>Time:</strong> {new Date(iv.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({iv.duration_minutes}m)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>
                    <strong>Interviewer:</strong> {iv.interviewer_name}
                  </span>
                </div>
              </div>

              {iv.notes && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 mb-4">
                  <strong>Notes:</strong> {iv.notes}
                </div>
              )}

              {iv.meeting_link && (
                <div className="flex justify-end">
                  <a
                    href={iv.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-colors shadow-2xs"
                  >
                    <Video className="w-4 h-4" /> Join Video Meeting
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
