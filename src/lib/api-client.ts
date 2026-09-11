import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,   // send/receive httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

// Send the browser's IANA timezone on every request. The backend validates it
// and persists it only for records whose meaning depends on local clock time.
apiClient.interceptors.request.use(config => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone) config.headers.set('X-Timezone', timezone);
  return config;
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
