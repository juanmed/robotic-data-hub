const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("api_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  sessions: {
    list: () => request<any[]>("/sessions"),
    get: (id: string) => request<any>(`/sessions/${id}`),
    create: (data: any) => request<any>("/sessions", { method: "POST", body: JSON.stringify(data) }),
  },
  listings: {
    list: () => request<any[]>("/listings"),
    get: (id: string) => request<any>(`/listings/${id}`),
  },
  uploads: {
    create: (sessionId: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return fetch(`${API_BASE}/sessions/${sessionId}/upload`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem("api_token") || ""}` },
      });
    },
  },
};
