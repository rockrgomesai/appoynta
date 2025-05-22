import axios from "axios";

const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

const axiosInstance = axios.create({
  baseURL: "/api", // Set your base API URL
  headers: {
    Authorization: token ? `Bearer ${token}` : "",
  },
});

export default axiosInstance;