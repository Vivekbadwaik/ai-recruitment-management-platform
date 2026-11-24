import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { interviewService } from '../../services/interviewService';
import toast from 'react-hot-toast';
import { Star, Send, Award, CheckCircle } from 'lucide-react';

export default function InterviewerFeedback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedIvId = searchParams.get('interview_id');

  const [interviews, setInterviews] = useState([]);
  const [selectedIvId, setSelectedIvId] = useState(preselectedIvId || '');
  const [form, setForm] = useState({
    technical_skills_rating: 4.0,
    communication_rating: 4.0,
    problem_solving_rating: 4.0,
    remarks: '',
    recommendation: 'hire',
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const data = await interviewService.getAssignedInterviews();
        setInterviews(data || []);
        if (!preselectedIvId && data && data.length > 0) {
          setSelectedIvId(data[0].id);
        }
      } catch {
        toast.error('Failed to load interviews');
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, [preselectedIvId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIvId) {
      toast.error('Please select an interview first');
      return;
    }
    if (!form.remarks || form.remarks.trim().length < 5) {
      toast.error('Please provide detailed evaluation remarks (at least 5 characters)');
      return;
    }

    setSubmitting(true);
    try {
      await interviewService.submitFeedback(selectedIvId, {
        technical_skills_rating: parseFloat(form.technical_skills_rating),
        communication_rating: parseFloat(form.communication_rating),
        problem_solving_rating: parseFloat(form.problem_solving_rating),
        remarks: form.remarks,
        recommendation: form.recommendation,
      });
      toast.success('Interview evaluation feedback submitted successfully!');
      navigate('/interviewer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedIv = interviews.find((i) => i.id === parseInt(selectedIvId));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit Interview Feedback</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Score the candidate across technical, communication, and problem-solving benchmarks.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Select Interview */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Select Assigned Interview
          </label>
          <select
            value={selectedIvId}
            onChange={(e) => setSelectedIvId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500"
            required
          >
            {interviews.length === 0 ? (
              <option value="">No interviews assigned</option>
            ) : (
              interviews.map((iv) => (
                <option key={iv.id} value={iv.id}>
                  {iv.candidate_name} — {iv.job_title} ({iv.interview_type} on{' '}
                  {new Date(iv.scheduled_date).toLocaleDateString()})
                </option>
              ))
            )}
          </select>
        </div>

        {selectedIv && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <span>
              <strong>Candidate:</strong> {selectedIv.candidate_name} ({selectedIv.candidate_email})
            </span>
            <span>
              <strong>Target Role:</strong> {selectedIv.job_title}
            </span>
          </div>
        )}

        {/* Ratings Sliders / Inputs */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evaluation Dimensions (1 to 5)</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">Technical Skills</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={form.technical_skills_rating}
                  onChange={(e) => setForm({ ...form, technical_skills_rating: e.target.value })}
                  className="w-full accent-indigo-600"
                />
                <span className="font-bold text-sm text-indigo-600 w-8 text-right">
                  {form.technical_skills_rating}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">Communication</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={form.communication_rating}
                  onChange={(e) => setForm({ ...form, communication_rating: e.target.value })}
                  className="w-full accent-indigo-600"
                />
                <span className="font-bold text-sm text-indigo-600 w-8 text-right">
                  {form.communication_rating}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">Problem Solving</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={form.problem_solving_rating}
                  onChange={(e) => setForm({ ...form, problem_solving_rating: e.target.value })}
                  className="w-full accent-indigo-600"
                />
                <span className="font-bold text-sm text-indigo-600 w-8 text-right">
                  {form.problem_solving_rating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Final Recommendation */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Final Recommendation
          </label>
          <select
            value={form.recommendation}
            onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="strong_hire">Strong Hire — Exceeds bar across all criteria</option>
            <option value="hire">Hire — Meets expectations, solid contributor</option>
            <option value="no_hire">No Hire — Below target competency</option>
            <option value="strong_no_hire">Strong No Hire — Major technical/cultural gaps</option>
          </select>
        </div>

        {/* Remarks Textarea */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Detailed Evaluation Remarks *
          </label>
          <textarea
            rows={5}
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            placeholder="Document technical strengths, code architecture decisions, areas of concern, and behavioral examples..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting || !selectedIvId}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Evaluation Scorecard'}
          </button>
        </div>
      </form>
    </div>
  );
}
