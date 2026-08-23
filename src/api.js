import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://eltham-konnect-backend-c2sf.onrender.com",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ek_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error?.response?.status;

    /*
     * Every 401 means the stored staff session can
     * no longer be trusted. This includes expired
     * tokens, revoked security versions, inactive
     * users, deleted users and malformed tokens.
     */
    if (status === 401) {
      localStorage.removeItem(
        "ek_token"
      );

      localStorage.removeItem(
        "ek_user"
      );

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.replace(
          "/login"
        );
      }
    }

    return Promise.reject(error);
  }
);

export default api;