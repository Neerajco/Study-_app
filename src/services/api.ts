import { User, Subject, Note, PlatformStats } from '../types';

const TOKEN_KEY = 'studyswap_auth_token';
const USER_KEY = 'studyswap_user_data';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: User | null) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set json content-type only if not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      errorMsg = `Server error (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async register(data: { name: string; email: string; password: string; college?: string; branch?: string; semester?: string }) {
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    return res;
  },

  async login(credentials: { email: string; password: string }) {
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    return res;
  },

  async demoLogin(email?: string) {
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    return res;
  },

  async getMe() {
    return apiFetch<{ user: User }>('/api/auth/me');
  },

  async updateProfile(profileData: Partial<User>) {
    const res = await apiFetch<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    authStorage.setUser(res.user);
    return res;
  },

  async logout() {
    try {
      await apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } finally {
      authStorage.clear();
    }
  },

  // Subjects
  async getSubjects() {
    return apiFetch<{ subjects: Subject[] }>('/api/subjects');
  },

  // Notes
  async getNotes(params: {
    q?: string;
    subject_id?: string | number;
    semester?: string;
    uploader_id?: number;
    bookmarked?: boolean;
    sort?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.subject_id !== undefined && params.subject_id !== 'all') {
      searchParams.append('subject_id', String(params.subject_id));
    }
    if (params.semester && params.semester !== 'all') {
      searchParams.append('semester', params.semester);
    }
    if (params.uploader_id) {
      searchParams.append('uploader_id', String(params.uploader_id));
    }
    if (params.bookmarked) {
      searchParams.append('bookmarked', 'true');
    }
    if (params.sort) {
      searchParams.append('sort', params.sort);
    }

    const queryStr = searchParams.toString();
    const endpoint = `/api/notes${queryStr ? `?${queryStr}` : ''}`;
    return apiFetch<{ notes: Note[] }>(endpoint);
  },

  async getNote(id: number) {
    return apiFetch<{ note: Note }>(`/api/notes/${id}`);
  },

  async uploadNote(formData: FormData) {
    return apiFetch<{ message: string; noteId: number }>('/api/notes', {
      method: 'POST',
      body: formData
    });
  },

  async deleteNote(id: number) {
    return apiFetch<{ success: boolean; message: string }>(`/api/notes/${id}`, {
      method: 'DELETE'
    });
  },

  async toggleBookmark(noteId: number) {
    return apiFetch<{ success: boolean; isBookmarked: boolean; bookmarkCount: number }>(
      `/api/notes/${noteId}/bookmark`,
      { method: 'POST' }
    );
  },

  getDownloadUrl(noteId: number) {
    return `/api/notes/${noteId}/download`;
  },

  getPreviewUrl(noteId: number) {
    return `/api/notes/${noteId}/preview`;
  },

  // Statistics
  async getStats() {
    return apiFetch<PlatformStats>('/api/stats');
  }
};
