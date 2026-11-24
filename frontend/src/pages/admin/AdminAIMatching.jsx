import { useState, useEffect } from 'react';
import { jobService } from '../../services/jobService';
import { adminService } from '../../services/adminService';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Star,
  Layers,
  Award,
} from 'lucide-react';

export default function AdminAIMatching() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobService.getJobs('active');
        setJobs(data || []);
        if (data && data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      } catch {
        toast.error('Failed to load active jobs');
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      runMatching(selectedJobId);
    }
  }, [selectedJobId]);

  const runMatching = async (jobId) => {
    setLoading(true);
    setMatchResults([]);
    try {
      const results = await adminService.matchCandidatesForJob(jobId);
      setMatchResults(results || []);
    } catch {
      toast.error('Failed to calculate candidate matches');
    } finally {
      setLoading(false);
    }
  };

  const [shortlisting, setShortlisting] = useState(false);

  const handleShortlist = async (candidateUserId) => {
    if (!selectedJobId) return;
    setShortlisting(true);
    try {
      const res = await adminService.shortlistCandidate(selectedJobId, candidateUserId);
      toast.success(res.message || 'Candidate shortlisted for this role!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to shortlist candidate');
    } finally {
      setShortlisting(false);
    }
  };

  const currentJob = jobs.find((j) => j.id === parseInt(selectedJobId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-600" /> AI Candidate Matching Engine
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Hybrid weighted scoring: 40% Required Skills, 20% Experience, 10% Education, 10% Preferred Skills, 20% Semantic Similarity.
          </p>
        </div>

        {/* Job Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Select Job:</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Job Overview Pill */}
      {currentJob && (
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-900">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span><strong>Target:</strong> {currentJob.title}</span>
            <span><strong>Min Experience:</strong> {currentJob.min_experience || 0} years</span>
            <span><strong>Required Skills ({currentJob.required_skills?.length || 0}):</strong> {currentJob.required_skills?.join(', ')}</span>
          </div>
          <span className="font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-md shadow-2xs">
            {matchResults.length} Candidates Evaluated
          </span>
        </div>
      )}

      {/* Candidates Ranked Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Calculating hybrid weights & semantic cosine similarity...</p>
          </div>
        ) : matchResults.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No candidates available for matching against this position.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Rank & Candidate</th>
                  <th className="py-3.5 px-6">Headline</th>
                  <th className="py-3.5 px-6">Skills (40%)</th>
                  <th className="py-3.5 px-6">Exp (20%)</th>
                  <th className="py-3.5 px-6">Semantic (20%)</th>
                  <th className="py-3.5 px-6">Overall Match Score</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matchResults.map((m, idx) => {
                  const b = m.breakdown;
                  const isTop = idx === 0;
                  return (
                    <tr key={m.user_id} className={`hover:bg-slate-50/50 ${isTop ? 'bg-indigo-50/20' : ''}`}>
                      <td className="py-4 px-6 flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isTop ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {m.full_name}
                            {isTop && <Award className="w-4 h-4 text-amber-500" />}
                          </div>
                          <div className="text-xs text-slate-400">{m.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                        {m.headline || '—'}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-slate-800">
                        {b.required_skill_score}%
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-700">
                        {b.candidate_experience_years} yrs ({b.experience_score}%)
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-indigo-600">
                        {b.semantic_similarity_score}%
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">
                            {b.overall_match_score}%
                          </span>
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                b.overall_match_score >= 80
                                  ? 'bg-emerald-500'
                                  : b.overall_match_score >= 60
                                  ? 'bg-indigo-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, b.overall_match_score)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => setSelectedMatch(m)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Explainable AI
                        </button>
                        <button
                          onClick={() => handleShortlist(m.user_id)}
                          disabled={shortlisting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Shortlist
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explainable AI Modal */}
      {selectedMatch && (
        <Modal
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          title={`Explainable AI Breakdown: ${selectedMatch.full_name}`}
          maxWidth="max-w-2xl"
        >
          {(() => {
            const b = selectedMatch.breakdown;
            return (
              <div className="space-y-6">
                {/* Total Score */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider">
                      Overall Hybrid Matching Score
                    </p>
                    <p className="text-3xl font-extrabold mt-0.5">{b.overall_match_score}%</p>
                  </div>
                  <Sparkles className="w-9 h-9 text-indigo-200" />
                </div>

                {/* Weights Breakdown Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Req Skills (40%)</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{b.required_skill_score}%</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Experience (20%)</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{b.experience_score}%</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Education (10%)</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{b.education_score}%</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Pref Skills (10%)</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{b.preferred_skill_score}%</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Semantic (20%)</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{b.semantic_similarity_score}%</p>
                  </div>
                </div>

                {/* Natural Language Explanation (Explainable AI) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Explainable AI Rationale
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{b.explanation}</p>
                </div>

                {/* Matched vs Missing Skills */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matched Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {b.matched_required_skills && b.matched_required_skills.length > 0 ? (
                        b.matched_required_skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No required skills matched</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" /> Missing Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {b.missing_required_skills && b.missing_required_skills.length > 0 ? (
                        b.missing_required_skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">All required skills present!</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleShortlist(selectedMatch.user_id);
                      setSelectedMatch(null);
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
                  >
                    Add to Shortlist
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
