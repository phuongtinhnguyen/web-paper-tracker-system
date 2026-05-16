import axios from "axios";

// Cấu hình base URL của backend. Đổi lại cho phù hợp với môi trường của bạn.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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
 * → { data: Paper[], pagination }
 */
export const getPapers = (params = {}) =>
  api.get("/papers", { params });

/** GET /papers/:id  → Paper */
export const getPaperById = (id) =>
  api.get(`/papers/${id}`);

/** POST /papers/:id/summarize  → { paper_id, summary, source } */
export const summarizePaper = (id) =>
  api.post(`/papers/${id}/summarize`);

/**
 * GET /papers/search?q=keyword&page=1&limit=10
 * → { data: Paper[], pagination }
 */
export const searchPapers = (query, params = {}) =>
  api.get("/papers/search", { params: { q: query, ...params } });

// ── TOPICS ───────────────────────────────────────────────────────────────────

/** GET /topics  → Topic[] */
export const getTopics = () =>
  api.get("/topics");

/** GET /papers?topic_id=:id&page=1&limit=5  → { data: Paper[], pagination } */
export const getPapersByTopic = (topicId, params = {}) =>
  api.get("/papers", { params: { ...params, topic_id: topicId } });

// ── FAVORITES ────────────────────────────────────────────────────────────────

/** GET /favorites?page=1&limit=5  → { data: Paper[], pagination } */
export const getFavorites = (params = {}) =>
  api.get("/favorites", { params });

/** POST /papers/favorite/:paperId  → { paper_id, is_favorite } */
export const addFavorite = (paperId) =>
  api.post(`/papers/favorite/${paperId}`);

/** DELETE /papers/favorite/:paperId  → { paper_id, is_favorite } */
export const removeFavorite = (paperId) =>
  api.delete(`/papers/favorite/${paperId}`);

// ── HISTORY ──────────────────────────────────────────────────────────────────

/** GET /history?page=1&limit=5&search=yyy  → { data: Paper[], pagination } */
export const getHistory = (params = {}) =>
  api.get("/history", { params });

/** DELETE /history/:paperId  → { message } */
export const removeHistory = (paperId) =>
  api.delete(`/history/${paperId}`);

/** DELETE /history  → { message } */
export const clearHistory = () =>
  api.delete("/history");

// ── TRACKED TOPICS ───────────────────────────────────────────────────────────

/** GET /user-topics  → Topic[] */
export const getTrackedTopics = () =>
  api.get("/user-topics");

/** POST /user-topics  → { topic } */
export const trackTopic = (topicId) =>
  api.post("/user-topics", { topic_id: topicId });

/** DELETE /user-topics/:topicId  → { topic_id } */
export const untrackTopic = (topicId) =>
  api.delete(`/user-topics/${topicId}`);

export default api;
