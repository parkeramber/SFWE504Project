import axios from "axios";

// Base API client. Auth header is attached per-request by consumers.
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
});

export default api;
