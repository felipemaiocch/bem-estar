import { roleRouteMap } from "@/lib/constants";
import type { SessionPayload, UserRole } from "@/types";

function inferRole(email: string, requestedRole?: UserRole): UserRole {
  if (requestedRole) {
    return requestedRole;
  }

  const normalizedEmail = email.toLowerCase();

  if (normalizedEmail.includes("admin")) {
    return "ADMIN";
  }

  if (
    normalizedEmail.includes("pro") ||
    normalizedEmail.includes("psico") ||
    normalizedEmail.includes("nutri")
  ) {
    return "PROFESSIONAL";
  }

  return "USER";
}

export function createDemoSession(input: {
  email: string;
  name?: string;
  requestedRole?: UserRole;
}): SessionPayload {
  const role = inferRole(input.email, input.requestedRole);
  const subByRole: Record<UserRole, string> = {
    USER: "user-felipe",
    PROFESSIONAL: "professional-camila",
    ADMIN: "admin-paula",
  };

  return {
    sub: subByRole[role],
    email: input.email,
    name:
      input.name ??
      (role === "ADMIN"
        ? "Paula Admin"
        : role === "PROFESSIONAL"
          ? "Camila Rocha"
          : "Felipe Santos"),
    role,
  };
}

export function redirectForRole(role: UserRole) {
  return roleRouteMap[role];
}
