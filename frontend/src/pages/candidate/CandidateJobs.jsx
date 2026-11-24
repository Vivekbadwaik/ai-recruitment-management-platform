import { useState, useEffect } from 'react';
import { jobService } from '../../services/jobService';
import { candidateService } from '../../services/candidateService';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import toast from 'react-hot-toast';
import {
  Briefcase,
  MapPin,
  Clock,
  Search,
  Sparkles,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export default function CandidateJobs() {
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const loadData = async () => {
    try {
      const [jobList, myApps] = await Promise.all([
        jobService.getJobs('active'),
        candidateService.getApplications(),
      ]);
      setJobs(jobList || []);
      const ids = new Set((myApps || []).map((a) => a.job_id));
      setAppliedJobIds(ids);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (jobId) => {
    setApplying(true);
    try {
      const res = await candidateService.applyForJob(jobId);
      toast.success(
        `Application submitted! AI Match Score: ${res.ai_match_score ? res.ai_match_score.toFixed(1) + '%' : 'Calculated'}`
      );
      setAppliedJobIds(new Set([...appliedJobIds, jobId]));
      setSelectedJob(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const q = search.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      (j.location && j.location.toLowerCase().includes(q)) ||
      (j.required_skills && j.required_skills.some((s) => s.toLowerCase().includes(q)))
    );
  });

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
          <h1 className="text-2xl font-bold text-slate-900">Explore Open Positions</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Discover roles matching your skills and experience. Apply directly to initiate AI-powered matching.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by job title, skill (e.g. Python, React), or location..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-2xs"
        />
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredJobs.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No active positions found matching your search.
          </div>
        ) : (
          filteredJobs.map((job) => {
            const hasApplied = appliedJobIds.has(job.id);
            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-base font-bold text-slate-900 leading-snug">{job.title}</h2>
                    <Badge status={job.employment_type || 'Full-time'} />
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />{' '}
                      {job.min_experience ? `${job.min_experience}+ yrs exp` : 'Entry level'}
                    </span>
                    {job.application_deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Deadline:{' '}
                        {new Date(job.application_deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {(job.required_skills || []).slice(0, 5).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700"
                      >
                        {sk}
                      </span>
                    ))}
                    {(job.required_skills || []).length > 5 && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-400">
                        +{(job.required_skills || []).length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Details
                  </button>
                  {hasApplied ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={applying}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                    >
                      Quick Apply
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.title}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                {selectedJob.employment_type}
              </span>
              <span>• Location: {selectedJob.location || 'Remote'}</span>
              <span>• Min Experience: {selectedJob.min_experience || 0} years</span>
              {selectedJob.education_requirements && (
                <span>• Education: {selectedJob.education_requirements}</span>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Job Overview
              </h4>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {selectedJob.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Required Technical Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {(selectedJob.required_skills || []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {selectedJob.preferred_skills && selectedJob.preferred_skills.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Preferred / Nice-to-Have Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.preferred_skills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              {appliedJobIds.has(selectedJob.id) ? (
                <button
                  disabled
                  className="px-5 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-sm border border-emerald-200"
                >
                  Already Applied
                </button>
              ) : (
                <button
                  onClick={() => handleApply(selectedJob.id)}
                  disabled={applying}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs"
                >
                  {applying ? 'Submitting Application...' : 'Apply for this Role'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
