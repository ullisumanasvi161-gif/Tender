const API_BASE = '/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Ignore if response is not JSON
    }
    throw new Error(errorMessage);
  }
  
  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return response; // Return response object for raw content (PDF/Excel exports)
};

export const api = {
  // Auth endpoints
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email, role: data.role }));
    }
    return data;
  },

  async register(name, email, password, role = 'staff') {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email, role: data.role }));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      if (!user || user === 'undefined') return null;
      return JSON.parse(user);
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('token');
  },

  // Checklist endpoints
  async generateChecklist(checklistData) {
    const response = await fetch(`${API_BASE}/checklists`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(checklistData),
    });
    return await handleResponse(response);
  },

  async getChecklists(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.type && filters.type !== 'All') params.append('type', filters.type);
    if (filters.readiness && filters.readiness !== 'All') params.append('readiness', filters.readiness);

    const response = await fetch(`${API_BASE}/checklists?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },

  async getChecklistById(id) {
    const response = await fetch(`${API_BASE}/checklists/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },

  async updateItemStatus(checklistId, section, itemId, status) {
    const response = await fetch(`${API_BASE}/checklists/${checklistId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ section, itemId, status }),
    });
    return await handleResponse(response);
  },

  async uploadMockDocument(checklistId, section, itemId, fileName) {
    const response = await fetch(`${API_BASE}/checklists/${checklistId}/upload`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ section, itemId, fileName }),
    });
    return await handleResponse(response);
  },

  async rateChecklist(checklistId, rating) {
    const response = await fetch(`${API_BASE}/checklists/${checklistId}/rate`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ rating }),
    });
    return await handleResponse(response);
  },

  async regenerateChecklist(checklistId) {
    const response = await fetch(`${API_BASE}/checklists/${checklistId}/regenerate`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },

  async deleteChecklist(checklistId) {
    const response = await fetch(`${API_BASE}/checklists/${checklistId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },

  // Tender Documents API
  async getTenderDocuments(tenderId) {
    const response = await fetch(`${API_BASE}/documents/tender/${tenderId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },

  async uploadTenderDocument(tenderId, file) {
    const formData = new FormData();
    formData.append('tenderId', tenderId);
    formData.append('file', file);

    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return await handleResponse(response);
  },

  async getSignedPreviewUrl(docId) {
    const response = await fetch(`${API_BASE}/documents/${docId}/preview`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },

  async getSignedDownloadUrl(docId) {
    const response = await fetch(`${API_BASE}/documents/${docId}/download`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },

  async deleteTenderDocument(docId) {
    const response = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },


  // Export URLs (these return file streams, so we return the URL or perform direct window.open)
  getExportPdfUrl(id) {
    const token = this.getToken();
    return `/api/export/${id}/pdf?token=${token || ''}`; // Can be handled via fetch or direct auth headers in download if needed, but since it requires token we can build helper to download
  },

  getExportExcelUrl(id) {
    return `/api/export/${id}/excel`;
  },
  
  async downloadExportFile(id, format) {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/export/${id}/${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export to ${format.toUpperCase()}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tender_Checklist_${id}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Analytics endpoints
  async getAnalytics() {
    const response = await fetch(`${API_BASE}/analytics`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  }
};
