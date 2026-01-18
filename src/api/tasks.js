import { request } from "./client.js";

export function listTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/tasks${query ? `?${query}` : ""}`);
}

export function createTask(payload) {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTask(taskId, payload) {
  return request(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function submitTaskReport(taskId, payload) {
  return request(`/tasks/${taskId}/report`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
