import api from './api';

export const adminService = {
  getStats: async () => {
    const res = await api.get('/api/admin/stats');
    return res.data;
  },
  bulkUploadResumes: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await api.post('/api/admin/resumes/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getCandidates: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/api/admin/candidates?${query}`);
    return res.data;
  },
  getCandidateDetail: async (id) => {
    const res = await api.get(`/api/admin/candidates/${id}`);
    return res.data;
  },
  updateCandidateProfile: async (id, data) => {
    const res = await api.put(`/api/admin/candidates/${id}/profile`, data);
    return res.data;
  },
  addCandidateNote: async (id, note) => {
    const res = await api.post(`/api/admin/candidates/${id}/notes`, { note });
    return res.data;
  },
  semanticSearch: async (query, minScore = 0.0, limit = 20) => {
    const res = await api.post('/api/admin/semantic-search', { query, min_score: minScore, limit });
    return res.data;
  },
  matchCandidatesForJob: async (jobId) => {
    const res = await api.post(`/api/admin/jobs/${jobId}/match-candidates`);
    return res.data;
  },
  updateApplicationStatus: async (appId, status, adminDecision = null, adminNotes = null) => {
    const res = await api.put(`/api/admin/applications/${appId}/status`, {
      status,
      admin_decision: adminDecision,
      admin_notes: adminNotes,
    });
    return res.data;
  },
  getInterviewers: async () => {
    const res = await api.get('/api/admin/interviewers');
    return res.data;
  },
  getApplications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/api/admin/applications?${query}`);
    return res.data;
  },
  shortlistCandidate: async (jobId, candidateUserId) => {
    const res = await api.post(`/api/admin/jobs/${jobId}/shortlist/${candidateUserId}`);
    return res.data;
  },
  exportShortlist: async (jobId = null, format = 'csv') => {
    const params = new URLSearchParams({ format });
    if (jobId) params.append('job_id', jobId);
    const res = await api.get(`/api/admin/export/shortlist?${params.toString()}`, {
      responseType: 'blob',
    });
    return res;
  },
};
