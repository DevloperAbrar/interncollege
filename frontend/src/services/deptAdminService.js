import api from './api'

export const deptAdminService = {
  getDashboard: async () => (await api.get('/dept-admin/dashboard')).data,
  getBranches: async () => (await api.get('/dept-admin/branches')).data,
  createBranch: async (name) => (await api.post('/dept-admin/branches', { name })).data,
  deleteBranch: async (id) => (await api.delete(`/dept-admin/branches/${id}`)).data,
  updateBranch: async (id, name) => (await api.put(`/dept-admin/branches/${id}`, { name })).data,
  updateMentor: async (id, data) => (await api.put(`/dept-admin/mentors/${id}`, data)).data,
  getMentors: async () => (await api.get('/dept-admin/mentors')).data,
  getMentorStudents: async (id) => (await api.get(`/dept-admin/mentors/${id}/students`)).data,
  createMentor: async (data) => (await api.post('/dept-admin/mentors', data)).data,
  deleteMentor: async (id) => (await api.delete(`/dept-admin/mentors/${id}`)).data,
}