import api from './api';

export const candidateService = {
  getProfile: async () => {
    const res = await api.get('/api/candidates/me/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put('/api/candidates/me/profile', data);
    return res.data;
  },
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/candidates/me/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getResumes: async () => {
    const res = await api.get('/api/candidates/me/resumes');
    return res.data;
  },
  applyForJob: async (jobId) => {
    const res = await api.post(`/api/candidates/me/apply/${jobId}`);
    return res.data;
  },
  getApplications: async () => {
    const res = await api.get('/api/candidates/me/applications');
    return res.data;
  },
  getInterviews: async () => {
    const res = await api.get('/api/candidates/me/interviews');
    return res.data;
  },
};
