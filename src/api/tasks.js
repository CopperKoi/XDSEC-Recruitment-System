import { request } from "./client.js";

export function listTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/tasks${query ? `?${query}` : ""}`).then((data) => ({
    ...data,
    items: (data?.data?.items || []).map((task) => ({
      ...task,
      id: task.uuid || task.id,
      targetUserId: task.target_user_id || task.targetUserId,
      assignedBy: task.assigned_by || task.assignedBy,
      createdAt: task.created_at || task.createdAt,
      updatedAt: task.updated_at || task.updatedAt
    }))
  }));
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

export function deleteTask(taskId) {
  return request(`/tasks/${taskId}`, { method: "DELETE" });
}
