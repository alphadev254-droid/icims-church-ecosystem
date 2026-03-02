import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,   // send/receive httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — if 401, clear local auth state (handled by store)
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Avoid circular import — dispatch a custom event the store can listen to
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export default apiClient;
