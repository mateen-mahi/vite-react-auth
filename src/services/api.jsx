import axios from "axios";

const api = axios.create({
  baseURL: "https://complete-auth-in-express-main.onrender.com/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;