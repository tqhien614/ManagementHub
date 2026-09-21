const API_BASE = "/api/v1";
const TOKEN_KEY = "ai-pdmh-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type ApiResult<T> = { data: T | null; error: string | null; status: number };

async function request<T>(
  path: string,
  init?: RequestInit & { skipAuth?: boolean },
): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (!init?.skipAuth) {
      const token = getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      return { data: null, error: body?.detail || `HTTP ${res.status}`, status: res.status };
    }
    return { data: body as T, error: null, status: res.status };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Lỗi mạng", status: 0 };
  }
}

export async function uploadFile<T>(path: string, file: File, fieldName = "file"): Promise<ApiResult<T>> {
  try {
    const formData = new FormData();
    formData.append(fieldName, file);
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers, body: formData });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) return { data: null, error: body?.detail || `HTTP ${res.status}`, status: res.status };
    return { data: body as T, error: null, status: res.status };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Lỗi mạng", status: 0 };
  }
}

export type Health = { status: string; service: string };
export function checkApiHealth(): Promise<ApiResult<Health>> {
  return request<Health>("/health", { skipAuth: true });
}

// Auth
export type User = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  status: string;
  is_admin: boolean;
  created_at: string;
};

export type TokenResponse = { access_token: string; token_type: string; user: User };

export function register(data: { username: string; display_name: string; email: string; password: string }) {
  return request<User>("/auth/register", { method: "POST", body: JSON.stringify(data), skipAuth: true });
}
export function verifyOtp(data: { email: string; code: string; purpose: string }) {
  return request<{ message: string }>("/auth/verify-otp", { method: "POST", body: JSON.stringify(data), skipAuth: true });
}
export function resendOtp(data: { email: string; purpose: string }) {
  return request<{ message: string }>("/auth/resend-otp", { method: "POST", body: JSON.stringify(data), skipAuth: true });
}
export function login(data: { username: string; password: string }) {
  return request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(data), skipAuth: true });
}
export function getMe() {
  return request<User>("/users/me");
}
export function updateMe(data: { display_name?: string; bio?: string; avatar_url?: string }) {
  return request<User>("/users/me", { method: "PATCH", body: JSON.stringify(data) });
}
export function getMyDocuments() {
  return request<{ id: string; title: string; status: string; genre: string; product_id: string; created_at: string }[]>("/users/me/documents");
}
export function listPendingUsers() {
  return request<User[]>(`/admin/users?status_filter=pending`);
}
export function listAllUsers() {
  return request<User[]>(`/admin/users`);
}
export function approveUser(id: string) {
  return request<User>(`/admin/users/${id}/approve`, { method: "POST" });
}
export function blockUser(id: string) {
  return request<User>(`/admin/users/${id}/block`, { method: "POST" });
}

// Generic request for ad-hoc calls
export { request };

// Documents / Folders / Products
export type Product = { id: string; name: string; slug: string; description: string | null; status: string; owner_id: string; created_at: string };
export type Folder = { id: string; product_id: string; parent_folder_id: string | null; name: string; created_by: string; created_at: string; updated_at: string };
export type Doc = { id: string; folder_id: string | null; product_id: string; title: string; raw_file_path: string | null; status: string; genre: string; owner_id: string; created_at: string; updated_at: string };
export type Markdown = { document_id: string; content_text: string; updated_at: string };
export type Version = { id: string; document_id: string; version_no: number; content_text: string; changed_by: string; created_at: string };

export function createProduct(data: { name: string; slug: string; description?: string; status?: string }) {
  return request<Product>("/products", { method: "POST", body: JSON.stringify(data) });
}
export function createFolder(data: { product_id: string; parent_folder_id?: string | null; name: string }) {
  return request<Folder>("/folders", { method: "POST", body: JSON.stringify(data) });
}
export function listFolders(product_id: string, parent_folder_id?: string | null) {
  const q = new URLSearchParams({ product_id });
  if (parent_folder_id) q.set("parent_folder_id", parent_folder_id);
  else q.set("parent_folder_id", "");
  return request<Folder[]>(`/folders?${q.toString()}`);
}
export function getDocument(id: string) {
  return request<Doc>(`/documents/${id}`);
}
export function getMarkdown(id: string) {
  return request<Markdown>(`/documents/${id}/markdown`);
}
export function updateMarkdown(id: string, content_text: string) {
  return request<Markdown>(`/documents/${id}/markdown`, { method: "PUT", body: JSON.stringify({ content_text }) });
}
export function listVersions(id: string) {
  return request<Version[]>(`/documents/${id}/versions`);
}
export function deleteDocument(id: string) {
  return request<{ ok: boolean }>(`/documents/${id}`, { method: "DELETE" });
}
