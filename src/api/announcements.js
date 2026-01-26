import { request } from "./client.js";

export function listAnnouncements() {
  return request("/announcements").then((data) => ({
    ...data,
    items: (data?.data?.items || []).map((item) => ({
      ...item,
      id: item.uuid || item.id,
      authorId: item.author_id || item.authorId,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt
    }))
  }));
}

export function createAnnouncement(payload) {
  return request("/announcements", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAnnouncement(id, payload) {
  return request(`/announcements/${id}` , {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function pinAnnouncement(id, pinned) {
  return request(`/announcements/${id}/pin`, {
    method: "POST",
    body: JSON.stringify({ pinned })
  });
}

export function deleteAnnouncement(id) {
  return request(`/announcements/${id}`, { method: "DELETE" });
}
