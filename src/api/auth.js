import { request, setCsrfToken, clearCsrfToken } from "./client.js";

export function register(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function login(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then((data) => {
    if (data?.data?.csrfToken) {
      setCsrfToken(data.data.csrfToken);
    }
    return data;
  });
}

export function logout() {
  return request("/auth/logout", { method: "POST" }).finally(() => {
    clearCsrfToken();
  });
}

export function requestEmailCode(payload) {
  return request("/auth/email-code", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function resetPassword(payload) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function changePassword(payload) {
  return request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function me() {
  return request("/auth/me");
}
