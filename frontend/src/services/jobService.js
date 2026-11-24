import api from './api';

export const jobService = {
  getJobs: async (status = 'active') => {
    const res = await api.get(`/api/jobs?status_filter=${status}`);
    return res.data;
  },
  getJob: async (id) => {
    const res = await api.get(`/api/jobs/${id}`);
    return res.data;
  },
  createJob: async (jobData) => {
    const res = await api.post('/api/jobs', jobData);
    return res.data;
  },
  updateJob: async (id, jobData) => {
    const res = await api.put(`/api/jobs/${id}`, jobData);
    return res.data;
  },
  deleteJob: async (id) => {
    const res = await api.delete(`/api/jobs/${id}`);
    return res.data;
  },
};
