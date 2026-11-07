import { multipartRequest } from "./multipartRequest";
import { apiRequest } from "./apiClient";

export function createCase(data) {
  return multipartRequest({
    path: "/admin/cases",
    fields: {
      data: JSON.stringify(data),
    },
    files: [
      {
        field: "image",
        fixture: "images/standaardKoffer.png",
        filename: "fallback.png",
        mimeType: "image/png",
      },
    ],
  });
}

export function deleteCase(recordId, version) {
  return apiRequest({
    method: "DELETE",
    path: `/admin/cases/${recordId}`,
    headers: {
      "If-Match": String(version),
      "Idempotency-Key": crypto.randomUUID(),
    },
  });
}

export function updateCase(recordId, version, data) {
  return apiRequest({
    method: "put",
    path: `/admin/cases/${recordId}`,
    headers: {
      "If-Match": String(version),
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: data,
  });
}
export function getAllCases() {
  return apiRequest({
    method: "GET",
    path: "/admin/content",
  });
}
export function getPublicContent() {
  return apiRequest({
    method: "GET",
    path: "/public/content",
  });
}
