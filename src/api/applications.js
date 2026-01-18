import { request } from "./client.js";

export function submitApplication(payload) {
  return request("/applications", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMyApplication() {
  return request("/applications/me");
}

export function getApplication(userId) {
  return request(`/applications/${userId}`);
}

export function updateApplicationStatus(userId, status) {
  return request(`/applications/${userId}/status`, {
    method: "POST",
    body: JSON.stringify({ status })
  });
}
