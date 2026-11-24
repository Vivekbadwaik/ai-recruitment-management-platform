import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Filter,
  Eye,
  MessageSquare,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  Send,
} from 'lucide-react';

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minExpFilter, setMinExpFilter] = useState('');

  // Selected candidate detail
  const [selectedUser, setSelectedUser] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const fetchCandidates = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (skillFilter) params.skill = skillFilter;
      if (locationFilter) params.location = locationFilter;
      if (minExpFilter) params.min_exp = minExpFilter;
      const data = await adminService.getCandidates(params);
      setCandidates(data || []);
    } catch {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, skillFilter, locationFilter, minExpFilter]);

  const handleOpenDetail = async (user) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const data = await adminService.getCandidateDetail(user.user_id);
      setCandidateDetail(data);
    } catch {
      toast.error('Failed to load candidate details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedUser) return;
    setAddingNote(true);
    try {
      const added = await adminService.addCandidateNote(selectedUser.user_id, newNote);
      toast.success('Internal note added');
      setCandidateDetail({
        ...candidateDetail,
        notes: [added, ...(candidateDetail.notes || [])],
      });
      setNewNote('');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
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
          <h1 className="text-2xl font-bold text-slate-900">Candidate Talent Directory</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Search, filter, and inspect verified candidate profiles, parsed resumes, and internal notes.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, headline..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <input
            type="text"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="Filter by skill (e.g. Python)"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filter by location (e.g. San Francisco)"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <input
            type="number"
            step="0.5"
            value={minExpFilter}
            onChange={(e) => setMinExpFilter(e.target.value)}
            placeholder="Min experience (years)"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Candidate Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {candidates.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No candidates found matching the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Headline</th>
                  <th className="py-3.5 px-6">Experience</th>
                  <th className="py-3.5 px-6">Key Skills</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => (
                  <tr key={c.user_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{c.full_name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                      {c.headline || '—'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-800 font-semibold">
                      {c.total_experience_years ? `${c.total_experience_years} yrs` : 'Entry'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(c.skills || []).slice(0, 4).map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700"
                          >
                            {sk}
                          </span>
                        ))}
                        {(c.skills || []).length > 4 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{(c.skills || []).length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">{c.location || 'Remote'}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenDetail(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Full Profile & Notes Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setCandidateDetail(null);
          }}
          title={selectedUser.full_name}
          maxWidth="max-w-3xl"
        >
          {detailLoading || !candidateDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{candidateDetail.full_name}</h3>
                    <p className="text-xs text-indigo-600 font-medium">{candidateDetail.profile.headline || 'Candidate'}</p>
                  </div>
                  <div className="text-xs text-slate-500">
                    <p><strong>Email:</strong> {candidateDetail.email}</p>
                    <p><strong>Phone:</strong> {candidateDetail.profile.phone || 'N/A'}</p>
                    <p><strong>Location:</strong> {candidateDetail.profile.location || 'Remote'}</p>
                  </div>
                </div>
                {candidateDetail.profile.summary && (
                  <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200 leading-relaxed">
                    {candidateDetail.profile.summary}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Skills ({candidateDetail.profile.skills?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(candidateDetail.profile.skills || []).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience History */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Work Experience ({candidateDetail.profile.total_experience_years || 0} years)
                </h4>
                <div className="space-y-2">
                  {(candidateDetail.profile.experience || []).map((exp, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>{exp.title} • {exp.company}</span>
                        <span className="text-slate-400 font-normal">
                          {exp.start_date} - {exp.end_date || 'Present'}
                        </span>
                      </div>
                      {exp.description && <p className="text-slate-600 mt-1 leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Education</h4>
                <div className="space-y-2">
                  {(candidateDetail.profile.education || []).map((edu, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-semibold text-slate-900">
                        {edu.degree} in {edu.field_of_study}
                      </div>
                      <div className="text-slate-500">
                        {edu.institution} • {edu.end_year} {edu.grade ? `(${edu.grade})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Recruiter Notes */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" /> Internal Recruiter Notes
                </h4>
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add internal evaluation note..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={addingNote || !newNote.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Add
                  </button>
                </form>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(candidateDetail.notes || []).length === 0 ? (
                    <p className="text-xs text-slate-400">No recruiter notes yet.</p>
                  ) : (
                    (candidateDetail.notes || []).map((n) => (
                      <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                          <span className="font-semibold text-slate-700">{n.admin_name}</span>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-800">{n.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
