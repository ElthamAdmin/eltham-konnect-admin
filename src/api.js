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
    const status = error?.response?.status;
    const message = error?.response?.data?.message || "";

    const isExpiredToken =
      status === 401 &&
      String(message).toLowerCase().includes("expired");

    if (isExpiredToken) {
      localStorage.removeItem("ek_token");
      localStorage.removeItem("ek_user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;