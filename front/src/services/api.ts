import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.0.79:8000/api",
  timeout: 10000
});

export default api;