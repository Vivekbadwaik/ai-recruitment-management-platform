import { useState, useEffect } from 'react';
import { jobService } from '../../services/jobService';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Badge from '../../components/Badge';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, Briefcase, MapPin, Users, PlusCircle } from 'lucide-react';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteJobId, setDeleteJobId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    required_skills: [],
    preferred_skills: [],
    min_experience: 0,
    max_experience: '',
    education_requirements: '',
    location: 'Remote',
    employment_type: 'Full-time',
    status: 'active',
  });
  const [reqSkillInput, setReqSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    try {
      const data = await jobService.getJobs('all');
      setJobs(data || []);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenCreate = () => {
    setEditingJob(null);
    setForm({
      title: '',
      description: '',
      required_skills: [],
      preferred_skills: [],
      min_experience: 0,
      max_experience: '',
      education_requirements: '',
      location: 'Remote',
      employment_type: 'Full-time',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setForm({
      title: job.title || '',
      description: job.description || '',
      required_skills: job.required_skills || [],
      preferred_skills: job.preferred_skills || [],
      min_experience: job.min_experience || 0,
      max_experience: job.max_experience || '',
      education_requirements: job.education_requirements || '',
      location: job.location || 'Remote',
      employment_type: job.employment_type || 'Full-time',
      status: job.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleAddReqSkill = (e) => {
    e.preventDefault();
    if (reqSkillInput.trim() && !form.required_skills.includes(reqSkillInput.trim())) {
      setForm({ ...form, required_skills: [...form.required_skills, reqSkillInput.trim()] });
      setReqSkillInput('');
    }
  };

  const handleAddPrefSkill = (e) => {
    e.preventDefault();
    if (prefSkillInput.trim() && !form.preferred_skills.includes(prefSkillInput.trim())) {
      setForm({ ...form, preferred_skills: [...form.preferred_skills, prefSkillInput.trim()] });
      setPrefSkillInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error('Title and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        min_experience: parseFloat(form.min_experience) || 0,
        max_experience: form.max_experience ? parseFloat(form.max_experience) : null,
      };

      if (editingJob) {
        await jobService.updateJob(editingJob.id, payload);
        toast.success('Job posting updated!');
      } else {
        await jobService.createJob(payload);
        toast.success('New job posting created!');
      }
      setIsModalOpen(false);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteJobId) return;
    try {
      await jobService.deleteJob(deleteJobId);
      toast.success('Job posting removed.');
      setDeleteJobId(null);
      fetchJobs();
    } catch {
      toast.error('Failed to delete job');
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
          <h1 className="text-2xl font-bold text-slate-900">Job Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Create, update, and manage open positions for candidate application and AI matching.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Post New Job
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {jobs.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No job positions created yet. Click &quot;Post New Job&quot; above to create your first opening.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Job Title</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Experience</th>
                  <th className="py-3.5 px-6">Applicants</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">{job.title}</td>
                    <td className="py-4 px-6 text-slate-500 text-xs">{job.location || 'Remote'}</td>
                    <td className="py-4 px-6 text-slate-500 text-xs">{job.employment_type}</td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {job.min_experience ? `${job.min_experience}+ yrs` : 'Entry level'}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {job.applicant_count || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={job.status} />
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(job)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Job"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteJobId(job.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingJob ? 'Edit Job Posting' : 'Create New Job Opening'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Job Description *</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the key responsibilities, qualifications, and role scope..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Remote (US) or San Francisco, CA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Employment Type</label>
                <select
                  value={form.employment_type}
                  onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Min Experience (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.min_experience}
                  onChange={(e) => setForm({ ...form, min_experience: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max Experience (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.max_experience}
                  onChange={(e) => setForm({ ...form, max_experience: e.target.value })}
                  placeholder="Optional max"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Education Requirements</label>
                <input
                  type="text"
                  value={form.education_requirements}
                  onChange={(e) => setForm({ ...form, education_requirements: e.target.value })}
                  placeholder="e.g. Bachelor's in Computer Science or related degree"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Required Skills Management */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Required Technical Skills (Weight 40% in AI Matching)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={reqSkillInput}
                  onChange={(e) => setReqSkillInput(e.target.value)}
                  placeholder="Type skill & press Enter or Add (e.g. Python)"
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddReqSkill}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.required_skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          required_skills: form.required_skills.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-indigo-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills Management */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Preferred Skills (Weight 10% in AI Matching)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={prefSkillInput}
                  onChange={(e) => setPrefSkillInput(e.target.value)}
                  placeholder="Type preferred skill e.g. Docker, Redis"
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddPrefSkill}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.preferred_skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          preferred_skills: form.preferred_skills.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs"
              >
                {submitting ? 'Saving...' : editingJob ? 'Update Job' : 'Create Job'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteJobId}
        onClose={() => setDeleteJobId(null)}
        onConfirm={handleDelete}
        title="Delete Job Posting"
        message="Are you sure you want to delete this job posting? All candidate applications associated with it will also be deleted."
      />
    </div>
  );
}
