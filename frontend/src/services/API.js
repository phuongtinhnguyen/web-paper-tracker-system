import axios from "axios";

// Cấu hình base URL của backend. Đổi lại cho phù hợp với môi trường của bạn.
const BASE_URL = import.meta.env.VITE_API_URL = "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Tự động đính kèm token vào mỗi request (nếu có)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── AUTH ─────────────────────────────────────────────────────────────────────

/** POST /auth/login  → { access_token, user } */
export const login = (email, password) =>
  api.post("/auth/login", { email, password });

/** POST /auth/register  → { message } */
export const register = (username, email, password) =>
  api.post("/auth/register", { username, email, password });

/** POST /auth/forgot-password  → { message } */
export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

// ── PAPERS ───────────────────────────────────────────────────────────────────

/**
 * GET /papers?page=1&limit=5&topic_id=xxx&search=yyy
 * → { data: Paper[], total: number, page: number, totalPages: number }
 */
export const getPapers = (params = {}) =>
  api.get("/papers", { params });

/** GET /papers/:id  → Paper */
export const getPaperById = (id) =>
  api.get(`/papers/${id}`);

/**
 * GET /papers/search?q=keyword&page=1&limit=10
 * → { data: Paper[], total: number, page: number, totalPages: number }
 */
export const searchPapers = (query, params = {}) =>
  api.get("/papers/search", { params: { q: query, ...params } });

// ── TOPICS ───────────────────────────────────────────────────────────────────

/** GET /topics  → Topic[] */
export const getTopics = () =>
  api.get("/topics");

/** GET /topics/:id/papers?page=1&limit=6  → { data: Paper[], total, totalPages } */
export const getPapersByTopic = (topicId, params = {}) =>
  api.get(`/topics/${topicId}/papers`, { params });

// ── FAVORITES ────────────────────────────────────────────────────────────────

/** GET /favorites?page=1&limit=6  → { data: Paper[], total, totalPages } */
export const getFavorites = (params = {}) =>
  api.get("/favorites", { params });

/** POST /favorites/:paperId  → { message } */
export const addFavorite = (paperId) =>
  api.post(`/favorites/${paperId}`);

/** DELETE /favorites/:paperId  → { message } */
export const removeFavorite = (paperId) =>
  api.delete(`/favorites/${paperId}`);

// ── HISTORY ──────────────────────────────────────────────────────────────────

/** GET /history?page=1&limit=6&search=yyy  → { data: Paper[], total, totalPages } */
export const getHistory = (params = {}) =>
  api.get("/history", { params });

/** DELETE /history/:paperId  → { message } */
export const removeHistory = (paperId) =>
  api.delete(`/history/${paperId}`);

/** DELETE /history  → { message } */
export const clearHistory = () =>
  api.delete("/history");

// ── TRACKED TOPICS ───────────────────────────────────────────────────────────

/** GET /user/tracked-topics  → Topic[] */
export const getTrackedTopics = () =>
  api.get("/user/tracked-topics");

/** POST /user/tracked-topics/:topicId  → { message } */
export const trackTopic = (topicId) =>
  api.post(`/user/tracked-topics/${topicId}`);

/** DELETE /user/tracked-topics/:topicId  → { message } */
export const untrackTopic = (topicId) =>
  api.delete(`/user/tracked-topics/${topicId}`);

export default api;
