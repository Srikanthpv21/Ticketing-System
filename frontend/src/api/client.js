import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://ticketing-system-backend-ox75.onrender.com";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// --- Automatic token refresh -------------------------------------------
// On a 401, try once to get a new access token with the refresh token and
// replay the request. Concurrent 401s share a single refresh call.
let refreshPromise = null;

const clearSessionAndRedirect = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const refresh = localStorage.getItem("refresh_token");
    // Plain axios (not `api`) so this call skips our interceptors.
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh/`, { refresh })
      .then((res) => {
        localStorage.setItem("access_token", res.data.access);
        if (res.data.refresh) {
          localStorage.setItem("refresh_token", res.data.refresh);
        }
        return res.data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url || "";
    const isAuthCall =
      url.includes("/auth/login/") ||
      url.includes("/auth/register/") ||
      url.includes("/auth/refresh/");

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthCall ||
      !localStorage.getItem("refresh_token")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const access = await refreshAccessToken();
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch (refreshError) {
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
