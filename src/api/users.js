import { request } from "./client.js";

export function listUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/users${query ? `?${query}` : ""}`);
}

export function getUser(userId) {
  return request(`/users/${userId}`);
}

export function updateProfile(payload) {
  return request("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function updateRole(userId, role) {
  return request(`/users/${userId}/role`, {
    method: "POST",
    body: JSON.stringify({ role })
  });
}

export function updatePassedDirections(userId, directions) {
  return request(`/users/${userId}/passed-directions`, {
    method: "POST",
    body: JSON.stringify({ directions })
  });
}
