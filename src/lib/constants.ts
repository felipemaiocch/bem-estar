import type { UserRole } from "@/types";

export const appMeta = {
  name: "se.monitora",
  company: "dr.monitora",
  greetingName: "Felipe",
  logoPath: "/logo%20se.drmonitora.png",
};

export const roleRouteMap: Record<UserRole, string> = {
  USER: "/usuario",
  PROFESSIONAL: "/profissional",
  ADMIN: "/admin",
};
