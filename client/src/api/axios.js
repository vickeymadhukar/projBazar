// ─────────────────────────────────────────────────────────────────────────────
//  src/api/axios.js
//  Configured Axios instance for all API calls
//
//  Key: withCredentials is NOT needed for Auth0 Bearer token flow.
//  The Auth0 Access Token is passed as Authorization header by the auth hook.
//  However, if we ever set HttpOnly cookies on the backend,
//  withCredentials: true ensures the browser sends them automatically.
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';

const apiClient = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,   // Send cookies cross-origin (future-proof)
  timeout:         15000,  // 15s request timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: attach Auth0 access token ────────────────────────────
// The token is injected by the calling hook (useAuth) which gets it
// from Auth0's getAccessTokenSilently().
// The interceptor looks for it in the request config's `_token` field.
//
// Usage in a hook:
//   const token = await getAccessTokenSilently();
//   const res = await apiClient.get('/listings/my', { _token: token });
//
apiClient.interceptors.request.use(
  (config) => {
    if (config._token) {
      config.headers.Authorization = `Bearer ${config._token}`;
      delete config._token; // don't expose the field in the actual request
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: global error handling ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${status} — ${message}`, error.config?.url);
    }

    // 401: Token expired / invalid — Auth0 SDK will handle re-auth
    // 403: Forbidden — let the component handle it
    // Other errors propagate normally

    return Promise.reject(error);
  }
);

export default apiClient;
