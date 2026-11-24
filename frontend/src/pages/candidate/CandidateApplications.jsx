import { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidateService';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { Sparkles, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CandidateApplications() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await candidateService.getApplications();
        setApplications(data || []);
      } catch {
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
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
        <h1 className="text-2xl font-bold text-slate-900">My Job Applications</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Track the status of your applications, review AI matching analytics, and see feedback.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            You haven&apos;t submitted any applications yet. Browse open jobs to apply!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Job Position</th>
                  <th className="py-3.5 px-6">Applied Date</th>
                  <th className="py-3.5 px-6">AI Match Score</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">{app.job_title}</td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      {app.ai_match_score !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{app.ai_match_score}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, app.ai_match_score)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Calculating...</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={app.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      {app.ai_recommendation && (
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> AI Analysis
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

      {/* AI Recommendation Modal */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`AI Match Breakdown: ${selectedApp.job_title}`}
          maxWidth="max-w-2xl"
        >
          {(() => {
            const b = selectedApp.ai_recommendation;
            if (!b) return null;
            return (
              <div className="space-y-6">
                {/* Score Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      Overall Match Score
                    </span>
                    <h3 className="text-2xl font-black text-indigo-900 mt-0.5">
                      {b.overall_match_score}%
                    </h3>
                  </div>
                  <Sparkles className="w-8 h-8 text-indigo-500" />
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Required Skills (40%)</p>
                    <p className="text-base font-bold text-slate-800 mt-1">{b.required_skill_score}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Experience (20%)</p>
                    <p className="text-base font-bold text-slate-800 mt-1">{b.experience_score}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Education (10%)</p>
                    <p className="text-base font-bold text-slate-800 mt-1">{b.education_score}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Semantic (20%)</p>
                    <p className="text-base font-bold text-slate-800 mt-1">{b.semantic_similarity_score}%</p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    AI Evaluation Summary
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{b.explanation}</p>
                </div>

                {/* Skills comparison */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matched Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {b.matched_required_skills && b.matched_required_skills.length > 0 ? (
                        b.matched_required_skills.map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">None matched</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" /> Missing Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {b.missing_required_skills && b.missing_required_skills.length > 0 ? (
                        b.missing_required_skills.map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">No missing skills! Full match!</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
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
