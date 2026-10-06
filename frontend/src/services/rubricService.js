import api from './api'

export const rubricService = {
  getMine: async () => (await api.get('/rubric/mine')).data,
  save: async (stages, expectedVersion) =>
    (await api.put('/rubric/mine', { stages, expectedVersion })).data,
  reset: async () => (await api.post('/rubric/mine/reset')).data
}