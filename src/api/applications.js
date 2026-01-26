import { request } from "./client.js";

export function submitApplication(payload) {
  return request("/applications", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMyApplication() {
  return request("/applications/me").then((data) => ({
    ...data,
    application: data?.data
      ? {
          realName: data.data.real_name || data.data.realName,
          phone: data.data.phone,
          gender: data.data.gender,
          department: data.data.department,
          major: data.data.major,
          studentId: data.data.student_id || data.data.studentId,
          directions: data.data.directions || [],
          resume: data.data.resume
        }
      : null
  }));
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

export function deleteApplication(userId) {
  return request(`/applications/${userId}`, { method: "DELETE" });
}

export function deleteMyApplication() {
  return request("/applications/me", { method: "DELETE" });
}
