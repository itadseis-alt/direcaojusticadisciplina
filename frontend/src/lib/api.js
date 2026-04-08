import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.withCredentials = true;

// Helper to format error messages
function formatError(error) {
  const detail = error.response?.data?.detail;
  if (detail == null) return "Algo deu errado. Tente novamente.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

// Users API
export const usersApi = {
  list: async () => {
    const { data } = await axios.get(`${API}/users`);
    return data;
  },
  get: async (id) => {
    const { data } = await axios.get(`${API}/users/${id}`);
    return data;
  },
  create: async (userData) => {
    const { data } = await axios.post(`${API}/users`, userData);
    return data;
  },
  update: async (id, userData) => {
    const { data } = await axios.put(`${API}/users/${id}`, userData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`${API}/users/${id}`);
    return data;
  },
  updatePassword: async (id, newPassword) => {
    const { data } = await axios.put(`${API}/users/${id}/password`, { new_password: newPassword });
    return data;
  },
  uploadPhoto: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axios.post(`${API}/upload/user-foto/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
};

// Cases API
export const casesApi = {
  list: async (params = {}) => {
    const { data } = await axios.get(`${API}/cases`, { params });
    return data;
  },
  get: async (id) => {
    const { data } = await axios.get(`${API}/cases/${id}`);
    return data;
  },
  create: async (caseData) => {
    const { data } = await axios.post(`${API}/cases`, caseData);
    return data;
  },
  update: async (id, caseData) => {
    const { data } = await axios.put(`${API}/cases/${id}`, caseData);
    return data;
  },
  updateStatus: async (id, status, despachoUrl = null) => {
    const { data } = await axios.put(`${API}/cases/${id}/status`, { status, despacho_url: despachoUrl });
    return data;
  },
  process: async (id, processData) => {
    const { data } = await axios.put(`${API}/cases/${id}/process`, processData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`${API}/cases/${id}`);
    return data;
  },
  uploadFoto: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axios.post(`${API}/upload/foto/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  uploadPdf: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axios.post(`${API}/upload/pdf/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  uploadDespacho: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axios.post(`${API}/upload/despacho/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  export: async (format = 'csv') => {
    const response = await axios.get(`${API}/export/cases`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const { data } = await axios.get(`${API}/dashboard/stats`);
    return data;
  }
};

// Notifications API
export const notificationsApi = {
  getExpiringSanctions: async () => {
    const { data } = await axios.get(`${API}/notifications/expiring-sanctions`);
    return data;
  }
};

// Member History API
export const memberApi = {
  getHistory: async (nim) => {
    const { data } = await axios.get(`${API}/member-history/${nim}`);
    return data;
  },
  search: async (query) => {
    const { data } = await axios.get(`${API}/member-search`, { params: { q: query } });
    return data;
  }
};

// Activity Logs API
export const logsApi = {
  list: async (page = 1, limit = 50) => {
    const { data } = await axios.get(`${API}/activity-logs`, { params: { page, limit } });
    return data;
  }
};

// Files API
export const filesApi = {
  getUrl: (path) => {
    if (!path) return null;
    return `${API}/files/${path}`;
  }
};

export { formatError };
