"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  LogOut,
  Shield,
  Stethoscope,
  Trophy,
  Users,
} from "lucide-react";

import { appMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BackofficeShellProps {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
}

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: Shield },
  { label: "Usuários", href: "/admin/usuarios", icon: Users },
  { label: "EAD", href: "/admin/ead", icon: GraduationCap },
  { label: "Biblioteca", href: "/admin/biblioteca", icon: BookOpen },
  { label: "Eventos", href: "/admin/eventos", icon: CalendarDays },
  { label: "Profissionais", href: "/admin/profissionais", icon: Stethoscope },
  { label: "Conteúdos", href: "/admin/conteudos", icon: FileText },
  { label: "Gamificação", href: "/admin/gamificacao", icon: Trophy },
  { label: "Relatórios", href: "/admin/relatorios", icon: BarChart3 },
  { label: "Compliance", href: "/admin/compliance", icon: Shield },
  { label: "Moderação", href: "/admin/moderacao", icon: Activity },
  { label: "Notificações", href: "/admin/notificacoes", icon: Bell },
];

const professionalNavItems = [
  { label: "Dashboard", href: "/profissional", icon: Stethoscope },
  { label: "Agenda", href: "/profissional/agenda", icon: CalendarDays },
  { label: "Registros", href: "/profissional/registros", icon: FileText },
  { label: "Feed", href: "/profissional/feed", icon: Activity },
];

export function BackofficeShell({
  badge,
  title,
  description,
  children,
}: BackofficeShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isAdmin = pathname.startsWith("/admin");
  const navItems = isAdmin ? adminNavItems : professionalNavItems;
  const shellLabel = isAdmin ? "admin" : "profissional";

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 text-gray-900">
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-gray-100 bg-white shadow-sm md:flex">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-[#0264af]/15 ring-1 ring-gray-100">
            <Image
              src={appMeta.logoPath}
              alt={appMeta.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900">
            {appMeta.name} {shellLabel}
          </span>
        </div>

        {title && (
          <div className="px-6 pb-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              {badge && <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">{badge}</p>}
              <h1 className="mt-3 text-xl font-bold text-gray-900">{title}</h1>
              {description && <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>}
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== (isAdmin ? "/admin" : "/profissional") &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-[#0264af]/8 text-[#0264af]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon size={19} className={active ? "stroke-[2.5px]" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0264af]">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Operação em tempo real</p>
                <p className="text-xs text-gray-500">Pronto para Vercel + Neon</p>
              </div>
            </div>
          </div>
          <button
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut size={16} />
            {isSigningOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
