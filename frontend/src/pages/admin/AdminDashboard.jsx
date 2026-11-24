import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { jobService } from '../../services/jobService';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Briefcase,
  ClipboardList,
  Calendar,
  Star,
  CheckCircle,
  TrendingUp,
  Brain,
  Search,
  UploadCloud,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, jobsData] = await Promise.all([
          adminService.getStats(),
          jobService.getJobs('all'),
        ]);
        setStats(statsData);
        setJobs(jobsData || []);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const pipelineData = [
    { name: 'Applied', count: stats?.total_applications || 0, color: '#3b82f6' },
    { name: 'Shortlisted', count: stats?.shortlisted || 0, color: '#8b5cf6' },
    { name: 'Interviews', count: stats?.scheduled_interviews || 0, color: '#6366f1' },
    { name: 'Selected', count: stats?.selected || 0, color: '#10b981' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Recruitment Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Enterprise overview of candidate pipelines, AI semantic matching, and interview schedules.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/resumes"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" /> Bulk Resume Upload
          </Link>
          <Link
            to="/admin/matching"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Brain className="w-4 h-4" /> AI Candidate Match
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Candidates</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.total_candidates || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Resumes</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.total_resumes || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Briefcase className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Active Jobs</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.active_jobs || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <ClipboardList className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Applications</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.total_applications || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-2">
            <Star className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Shortlisted</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.shortlisted || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Interviews</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.scheduled_interviews || 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Selected</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.selected || 0}</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Pipeline Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Pipeline Funnel</h2>
              <p className="text-xs text-slate-400">Current progress of applicants across hiring stages</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & AI Search shortcut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-400 mb-4">Shortcuts for recruiter workflows</p>
            <div className="space-y-2.5">
              <Link
                to="/admin/search"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Semantic Search</p>
                    <p className="text-[11px] text-slate-400">Natural language talent retrieval</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link
                to="/admin/shortlist"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Manage Shortlist</p>
                    <p className="text-[11px] text-slate-400">Review & export shortlisted talent</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600" />
              </Link>

              <Link
                to="/admin/interviews"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Interview Hub</p>
                    <p className="text-[11px] text-slate-400">Schedule & track evaluations</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Active Postings:</span>
            <span className="font-bold text-slate-800">{jobs.filter((j) => j.status === 'active').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
