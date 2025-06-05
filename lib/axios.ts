import axios from "axios";

const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

const axiosInstance = axios.create({
  baseURL: "/api", // Set your base API URL
  headers: {
    Authorization: token ? `Bearer ${token}` : "",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Save intended path
      const intended = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(intended)}`;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;