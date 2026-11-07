import { apiRequest } from "./apiClient";

export function loginAdmin() {
  return cy
    .env(["adminUsername", "adminPassword"])
    .then(({ adminUsername, adminPassword }) => {
      if (
        typeof adminUsername !== "string" ||
        !adminUsername.trim() ||
        typeof adminPassword !== "string" ||
        !adminPassword
      ) {
        throw new Error("Stel adminUsername en adminPassword in.");
      }

      return apiRequest({
        method: "POST",
        path: "/auth/login",
        body: {
          username: adminUsername,
          password: adminPassword,
        },
        log: false,
      });
    });
}

export function logoutAdmin() {
    return apiRequest({
        method: 'POST',
        path: '/auth/logout',
    })
}
