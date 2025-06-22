import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("supabase.auth.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("supabase.auth.token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// AI Agents API
// export const agentsApi = {
//   getAll: () => api.get("/agents"),
//   create: (data: any) => api.post("/agents", data),
//   update: (id: string, data: any) => api.put(`/agents/${id}`, data),
//   delete: (id: string) => api.delete(`/agents/${id}`),
//   chat: (id: string, data: any) => api.post(`/agents/${id}/chat`, data),
//   getCapabilities: (id: string) => api.get(`/agents/${id}/capabilities`),
// };

// Integrations API
export const integrationsApi = {
  getAll: () => api.get("/integrations"),
  connectGmail: () => api.post("/integrations/gmail/connect"),
  connectCalendar: () => api.post("/integrations/calendar/connect"),
  connectWhatsApp: (data: any) =>
    api.post("/integrations/whatsapp/connect", data),
  connectSpotify: () => api.post("/integrations/spotify/connect"),
  disconnect: (provider: string) => api.delete(`/integrations/${provider}`),
};

// Conversations API
export const conversationsApi = {
  getAll: () => api.get("/conversations"),
  getById: (id: string) => api.get(`/conversations/${id}`),
  create: (data: any) => api.post("/conversations", data),
  update: (id: string, data: any) => api.put(`/conversations/${id}`, data),
  delete: (id: string) => api.delete(`/conversations/${id}`),
  getMessages: (id: string) => api.get(`/conversations/${id}/messages`),
};

// Email API
export const emailApi = {
  getAll: (params?: any) => api.get("/email", { params }),
  send: (data: any) => api.post("/email/send", data),
  analyze: (id: string) => api.post(`/email/${id}/analyze`),
  markAsRead: (id: string) => api.put(`/email/${id}/read`),
};

// Calendar API
export const calendarApi = {
  getEvents: (params?: any) => api.get("/calendar/events", { params }),
  createEvent: (data: any) => api.post("/calendar/events", data),
  updateEvent: (id: string, data: any) =>
    api.put(`/calendar/events/${id}`, data),
  deleteEvent: (id: string) => api.delete(`/calendar/events/${id}`),
};

// Search API
export const searchApi = {
  query: (data: any) => api.post("/search/query", data),
  voice: (data: any) => api.post("/search/voice", data),
  getHistory: () => api.get("/search/history"),
};

// News API
export const newsApi = {
  getTop: (params?: any) => api.get("/news/top", { params }),
  getByCategory: (category: string) => api.get(`/news/categories/${category}`),
  ask: (data: any) => api.post("/news/ask", data),
  getBriefing: () => api.get("/news/briefing"),
};

// Music API
export const musicApi = {
  search: (data: any) => api.post("/music/search", data),
  getRecommendations: () => api.get("/music/recommendations"),
  updatePreferences: (data: any) => api.post("/music/preferences", data),
  getHistory: () => api.get("/music/history"),
};

// Voice API
export const voiceApi = {
  textToSpeech: (data: any) => api.post("/voice/tts", data),
  speechToText: (data: any) => api.post("/voice/stt", data),
  getVoices: () => api.get("/voice/voices"),
};

export default api;
