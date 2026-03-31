import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401: try to refresh token once
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Typed API helpers ─────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getOne: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/courses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/courses/${id}`),
  addLecture: (courseId, data) => api.post(`/courses/${courseId}/lectures`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getLectures: (courseId) => api.get(`/courses/${courseId}/lectures`),
  deleteLecture: (courseId, lectureId) => api.delete(`/courses/${courseId}/lectures/${lectureId}`),
};

export const enrollmentAPI = {
  enroll: (courseId) => api.post('/enrollments', { courseId }),
  getMy: () => api.get('/enrollments/my'),
  getOne: (courseId) => api.get(`/enrollments/${courseId}`),
  updateProgress: (courseId, lectureId) => api.post(`/enrollments/${courseId}/progress`, { lectureId }),
  getCertificate: (courseId) => api.get(`/enrollments/${courseId}/certificate`, { responseType: 'blob' }),
  getAll: () => api.get('/enrollments/admin/all'),
};

export const quizAPI = {
  get: (lectureId) => api.get(`/quiz/${lectureId}`),
  submit: (lectureId, data) => api.post(`/quiz/${lectureId}/submit`, data),
  create: (lectureId, data) => api.post(`/quiz/${lectureId}`, data),
  delete: (lectureId) => api.delete(`/quiz/${lectureId}`),
};

export const paymentAPI = {
  createOrder: (courseId) => api.post('/payment/order', { courseId }),
  verify: (data) => api.post('/payment/verify', data),
};

export const chatAPI = {
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  send: (receiverId, message) => api.post('/chat/messages', { receiverId, message }),
  getConversations: () => api.get('/chat/conversations'),
  getUnreadCount: () => api.get('/chat/unread-count'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getStudents: () => api.get('/admin/students'),
  toggleStudent: (id) => api.patch(`/admin/students/${id}/toggle`),
};
