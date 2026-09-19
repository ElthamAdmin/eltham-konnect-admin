import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://eltham-konnect-backend-c2sf.onrender.com",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ek_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const authenticationFailureCodes = new Set([
  "INVALID_TOKEN",
  "TOKEN_EXPIRED",
  "SESSION_INACTIVE",
  "SESSION_REVOKED",
]);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    const storedToken = localStorage.getItem("ek_token");

    /*
     * End the staff session only when authentication
     * itself has failed.
     *
     * An unrelated module may use HTTP 401 for one of
     * its own errors. Such a response must not erase a
     * valid EKOS staff session.
     */
    const shouldEndSession =
      status === 401 &&
      (
        !storedToken ||
        authenticationFailureCodes.has(code)
      );

    if (shouldEndSession) {
      localStorage.removeItem("ek_token");
      localStorage.removeItem("ek_user");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;