import type { AdminPermission } from "@prisma/client";

export const adminPermissionOptions: Array<{
  value: AdminPermission;
  label: string;
  href: string;
}> = [
  { value: "DASHBOARD", label: "Dashboard", href: "/admin" },
  { value: "USERS", label: "Usuários", href: "/admin/usuarios" },
  { value: "EAD", label: "EAD", href: "/admin/ead" },
  { value: "LIBRARY", label: "Biblioteca", href: "/admin/biblioteca" },
  { value: "EVENTS", label: "Eventos", href: "/admin/eventos" },
  { value: "PROFESSIONALS", label: "Profissionais", href: "/admin/profissionais" },
  { value: "CONTENTS", label: "Conteúdos", href: "/admin/conteudos" },
  { value: "GAMIFICATION", label: "Gamificação", href: "/admin/gamificacao" },
  { value: "REPORTS", label: "Relatórios", href: "/admin/relatorios" },
  { value: "COMPLIANCE", label: "Compliance", href: "/admin/compliance" },
  { value: "MODERATION", label: "Moderação", href: "/admin/moderacao" },
  { value: "NOTIFICATIONS", label: "Notificações", href: "/admin/notificacoes" },
];

export const adminPermissionValues = adminPermissionOptions.map((permission) => permission.value) as [
  AdminPermission,
  ...AdminPermission[],
];
