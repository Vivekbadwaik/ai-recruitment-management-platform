import { useState, useEffect } from 'react';
import { interviewService } from '../../services/interviewService';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import {
  Calendar,
  Eye,
  MessageSquare,
  Video,
  Clock,
  User,
  CheckCircle,
} from 'lucide-react';

export default function InterviewerAssigned() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const data = await interviewService.getAssignedInterviews();
        setInterviews(data || []);
      } catch {
        toast.error('Failed to load interviews');
      } finally {
        setLoading(false);
      }
    };
    fetchAssigned();
  }, []);

  const handleOpenCandidateProfile = async (interviewId) => {
    setProfileLoading(true);
    try {
      const data = await interviewService.getCandidateProfile(interviewId);
      setSelectedProfile(data);
    } catch {
      toast.error('Failed to load candidate profile');
    } finally {
      setProfileLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assigned Candidate Interviews</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Review candidates authorized for your technical evaluation, inspect parsed resumes, and prepare interview notes.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {interviews.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No interviews assigned to you currently.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Job Role</th>
                  <th className="py-3.5 px-6">Round</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interviews.map((iv) => (
                  <tr key={iv.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-semibold text-slate-900">{iv.candidate_name}</td>
                    <td className="py-4 px-6 text-xs text-slate-700">{iv.job_title}</td>
                    <td className="py-4 px-6 text-xs capitalize text-slate-600">{iv.interview_type}</td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      <div>{new Date(iv.scheduled_date).toLocaleDateString()}</div>
                      <div className="text-slate-400">
                        {new Date(iv.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        ({iv.duration_minutes}m)
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={iv.status} />
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenCandidateProfile(iv.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                      >
                        <Eye className="w-3.5 h-3.5" /> Profile
                      </button>
                      <Link
                        to={`/interviewer/feedback?interview_id=${iv.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Feedback
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Profile Modal */}
      {selectedProfile && (
        <Modal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          title={`Candidate Profile: ${selectedProfile.candidate?.full_name}`}
          maxWidth="max-w-2xl"
        >
          {(() => {
            const cand = selectedProfile.candidate;
            return (
              <div className="space-y-5 text-sm">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-900">{cand.full_name}</h3>
                  <p className="text-xs text-indigo-600 font-semibold">{cand.headline || 'Candidate'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {cand.email} • {cand.location || 'Remote'} • {cand.total_experience_years || 0} yrs experience
                  </p>
                  {cand.summary && (
                    <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200 leading-relaxed">
                      {cand.summary}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(cand.skills || []).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Experience</h4>
                  <div className="space-y-2">
                    {(cand.experience || []).map((exp, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="font-semibold text-slate-900">
                          {exp.title} • {exp.company}
                        </div>
                        <p className="text-slate-600 mt-0.5">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
