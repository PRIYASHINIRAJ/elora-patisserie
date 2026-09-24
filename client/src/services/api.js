import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

// In production the site and API are on different domains, and some browsers
// (Safari, iOS) block the API's cross-site cookie. So we also keep the token
// returned at login and send it as a header the server accepts.
const TOKEN_KEYS = {
  customer: 'elora_customer_token',
  admin: 'elora_admin_token',
};
const TOKEN_HEADERS = {
  customer: 'X-Customer-Token',
  admin: 'X-Admin-Token',
};

export function setAuthToken(type, token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEYS[type], token);
    else localStorage.removeItem(TOKEN_KEYS[type]);
  } catch {
    // storage unavailable (private mode) — cookie auth still applies
  }
}

api.interceptors.request.use((config) => {
  for (const type of Object.keys(TOKEN_KEYS)) {
    let token = null;
    try {
      token = localStorage.getItem(TOKEN_KEYS[type]);
    } catch {
      // ignore
    }
    if (token) config.headers[TOKEN_HEADERS[type]] = token;
  }
  return config;
});

export default api;
