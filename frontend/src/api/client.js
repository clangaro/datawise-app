// src/api/client.js  — thin wrapper around axios
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Questionnaire ─────────────────────────────────────────────────────────────
export const getRecommendation = (profile) =>
  api.post('/questionnaire/recommend', profile).then(r => r.data)

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload/file', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

// ── Assumptions ───────────────────────────────────────────────────────────────
export const checkAssumptions = (payload) =>
  api.post('/assumptions/check', payload).then(r => r.data)

// ── Analysis ──────────────────────────────────────────────────────────────────
export const runAnalysis = (payload) =>
  api.post('/analysis/run', payload).then(r => r.data)

export default api
