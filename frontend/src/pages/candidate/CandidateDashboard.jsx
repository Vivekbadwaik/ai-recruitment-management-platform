import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateService } from '../../services/candidateService';
import { jobService } from '../../services/jobService';
import {
  FileText,
  Briefcase,
  ClipboardList,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../../components/Badge';

export default function CandidateDashboard() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prof, jobList, apps, ivs] = await Promise.all([
          candidateService.getProfile(),
          jobService.getJobs('active'),
          candidateService.getApplications(),
          candidateService.getInterviews(),
        ]);
        setProfile(prof);
        setJobs(jobList || []);
        setApplications(apps || []);
        setInterviews(ivs || []);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isProfileComplete = profile && profile.skills && profile.skills.length > 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" /> AI Candidate Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || 'Candidate'}!
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            {profile?.headline || 'Manage your career profile, track job applications, and prepare for interviews.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/candidate/resume"
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-medium text-sm hover:bg-indigo-50 transition-colors shadow-xs"
          >
            Upload Resume
          </Link>
          <Link
            to="/candidate/jobs"
            className="px-4 py-2.5 rounded-xl bg-indigo-500/30 border border-white/20 text-white font-medium text-sm hover:bg-white/10 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Profile Status</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-bold text-slate-900">
                  {isProfileComplete ? 'Complete' : 'Needs Setup'}
                </span>
                {isProfileComplete && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Applications</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{applications.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Open Positions</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{jobs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Interviews</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{interviews.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Recent Applications & Scheduled Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Applications</h2>
            <Link to="/candidate/applications" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {applications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                You haven&apos;t applied for any positions yet.{' '}
                <Link to="/candidate/jobs" className="text-indigo-600 font-medium hover:underline">
                  Browse jobs
                </Link>
              </div>
            ) : (
              applications.slice(0, 4).map((app) => (
                <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{app.job_title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Applied on {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.ai_match_score !== null && (
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {app.ai_match_score}% Match
                      </span>
                    )}
                    <Badge status={app.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scheduled Interviews */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Scheduled Interviews</h2>
            <Link to="/candidate/interviews" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {interviews.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No interviews scheduled currently.
              </div>
            ) : (
              interviews.slice(0, 3).map((iv) => (
                <div key={iv.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-900">{iv.job_title}</span>
                    <Badge status={iv.status} />
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>
                      <strong>Date:</strong> {new Date(iv.scheduled_date).toLocaleString()} ({iv.duration_minutes} mins)
                    </p>
                    <p>
                      <strong>Interviewer:</strong> {iv.interviewer_name} ({iv.interview_type})
                    </p>
                    {iv.meeting_link && (
                      <a
                        href={iv.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-indigo-600 hover:underline font-medium pt-1"
                      >
                        Join Meeting Link →
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
