import api from './api';

export const interviewService = {
  getAllInterviews: async () => {
    const res = await api.get('/api/interviews/all');
    return res.data;
  },
  scheduleInterview: async (data) => {
    const res = await api.post('/api/interviews', data);
    return res.data;
  },
  rescheduleInterview: async (id, data) => {
    const res = await api.put(`/api/interviews/${id}`, data);
    return res.data;
  },
  cancelInterview: async (id) => {
    const res = await api.delete(`/api/interviews/${id}`);
    return res.data;
  },
  getAssignedInterviews: async () => {
    const res = await api.get('/api/interviews/assigned');
    return res.data;
  },
  getCandidateProfile: async (interviewId) => {
    const res = await api.get(`/api/interviews/${interviewId}/candidate-profile`);
    return res.data;
  },
  submitFeedback: async (interviewId, data) => {
    const res = await api.post(`/api/interviews/${interviewId}/feedback`, data);
    return res.data;
  },
  getFeedback: async (interviewId) => {
    const res = await api.get(`/api/interviews/${interviewId}/feedback`);
    return res.data;
  },
};

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/api/notifications');
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.put(`/api/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/api/notifications/read-all');
    return res.data;
  },
};
