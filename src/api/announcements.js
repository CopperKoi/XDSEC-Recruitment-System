import { request } from "./client.js";

export function listAnnouncements() {
  return request("/announcements");
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
