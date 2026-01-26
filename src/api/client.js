const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v2";
const CSRF_KEY = "xdsec_csrf";

export function getCsrfToken() {
  return window.localStorage.getItem(CSRF_KEY) || "";
}

export function setCsrfToken(token) {
  if (token) {
    window.localStorage.setItem(CSRF_KEY, token);
  }
}

export function clearCsrfToken() {
  window.localStorage.removeItem(CSRF_KEY);
}

export async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include"
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(body?.message || "Request failed");
    error.status = response.status;
    error.payload = body;
    throw error;
  }

  return body;
}
