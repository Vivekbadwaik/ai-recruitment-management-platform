import { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidateService';
import toast from 'react-hot-toast';
import { User, Plus, Trash2, Save, Sparkles } from 'lucide-react';

export default function CandidateProfile() {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    summary: '',
    skills: [],
    education: [],
    experience: [],
    projects: [],
    total_experience_years: 0.0,
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await candidateService.getProfile();
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          headline: data.headline || '',
          summary: data.summary || '',
          skills: data.skills || [],
          education: data.education || [],
          experience: data.experience || [],
          projects: data.projects || [],
          total_experience_years: data.total_experience_years || 0.0,
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleAddEducation = () => {
    setProfile({
      ...profile,
      education: [
        ...profile.education,
        { institution: '', degree: '', field_of_study: '', start_year: '', end_year: '', grade: '' },
      ],
    });
  };

  const handleUpdateEducation = (index, field, value) => {
    const updated = [...profile.education];
    updated[index][field] = value;
    setProfile({ ...profile, education: updated });
  };

  const handleRemoveEducation = (index) => {
    setProfile({
      ...profile,
      education: profile.education.filter((_, i) => i !== index),
    });
  };

  const handleAddExperience = () => {
    setProfile({
      ...profile,
      experience: [
        ...profile.experience,
        { company: '', title: '', location: '', start_date: '', end_date: '', is_current: false, description: '' },
      ],
    });
  };

  const handleUpdateExperience = (index, field, value) => {
    const updated = [...profile.experience];
    updated[index][field] = value;
    setProfile({ ...profile, experience: updated });
  };

  const handleRemoveExperience = (index) => {
    setProfile({
      ...profile,
      experience: profile.experience.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await candidateService.updateProfile(profile);
      toast.success('Profile saved successfully! AI embedding updated.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-bold text-slate-900">My Candidate Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Keep your profile updated. Changes automatically recalculate your AI match score and semantic embeddings.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-indigo-600" /> Personal & Contact Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Professional Headline</label>
              <input
                type="text"
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                placeholder="e.g. Senior Full Stack Engineer | Python, React, AWS"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Professional Summary</label>
              <textarea
                rows={3}
                value={profile.summary}
                onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                placeholder="Brief summary of your career background, expertise, and goals..."
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Total Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={profile.total_experience_years}
                onChange={(e) => setProfile({ ...profile, total_experience_years: parseFloat(e.target.value) || 0.0 })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Skills Tag Management */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Technical & Professional Skills
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill e.g. React, Python, Docker"
              className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {profile.skills.length === 0 ? (
              <p className="text-xs text-slate-400">No skills added yet. Add your key skills above.</p>
            ) : (
              profile.skills.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Experience Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Work History & Experience</h2>
            <button
              type="button"
              onClick={handleAddExperience}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Role
            </button>
          </div>
          {profile.experience.length === 0 ? (
            <p className="text-xs text-slate-400">No experience records added.</p>
          ) : (
            profile.experience.map((exp, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(idx)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Job Title</label>
                    <input
                      type="text"
                      value={exp.title || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'title', e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Company</label>
                    <input
                      type="text"
                      value={exp.company || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Start Date</label>
                    <input
                      type="text"
                      value={exp.start_date || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'start_date', e.target.value)}
                      placeholder="MM/YYYY"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">End Date</label>
                    <input
                      type="text"
                      value={exp.end_date || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'end_date', e.target.value)}
                      placeholder="MM/YYYY or Present"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Key Responsibilities</label>
                    <textarea
                      rows={2}
                      value={exp.description || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                      placeholder="Describe your achievements and key technologies used..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Education Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Education & Qualifications</h2>
            <button
              type="button"
              onClick={handleAddEducation}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Degree
            </button>
          </div>
          {profile.education.length === 0 ? (
            <p className="text-xs text-slate-400">No education entries added.</p>
          ) : (
            profile.education.map((edu, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(idx)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Institution</label>
                    <input
                      type="text"
                      value={edu.institution || ''}
                      onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                      placeholder="University name"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Degree</label>
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                      placeholder="e.g. Bachelor of Science"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Field of Study</label>
                    <input
                      type="text"
                      value={edu.field_of_study || ''}
                      onChange={(e) => handleUpdateEducation(idx, 'field_of_study', e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Years / Grade</label>
                    <input
                      type="text"
                      value={edu.end_year || ''}
                      onChange={(e) => handleUpdateEducation(idx, 'end_year', e.target.value)}
                      placeholder="Graduation Year e.g. 2022"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
