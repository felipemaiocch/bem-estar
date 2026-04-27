"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Megaphone,
  Search,
  Settings,
  X,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { appMeta } from "@/lib/constants";
import { userMainNav } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function UserShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(true);

  const loadGlobalAlert = useCallback(async () => {
    try {
      const resp = await fetch("/api/admin/global-alert");
      const data = await resp.json();
      if (data.ok && data.alert) {
        const seen = sessionStorage.getItem(`seen-alert-${data.alert.id}`);
        if (!seen) {
          setActiveAlert(data.alert.message);
          setActiveAlertId(data.alert.id);
          setAlertDismissed(false);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    void loadGlobalAlert();
  }, [loadGlobalAlert]);

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

  const dismissAlert = () => {
    setAlertDismissed(true);
    if (activeAlertId) {
      sessionStorage.setItem(`seen-alert-${activeAlertId}`, "true");
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900">
      {/* Modal Global */}
      {!alertDismissed && activeAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl">
              <div className="bg-[#0264af] p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                    <Megaphone className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">Comunicado</h2>
                    <p className="mt-1 text-xs text-white/70 uppercase tracking-widest font-semibold font-mono">Mensagem Oficial</p>
                  </div>
                  <button onClick={dismissAlert} className="rounded-lg p-1 hover:bg-white/10">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 text-gray-700 leading-relaxed font-medium">
                  {activeAlert}
                </div>
                <button 
                  onClick={dismissAlert}
                  className="mt-6 w-full cursor-pointer rounded-2xl bg-[#0264af] py-4 text-center font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-[#015392] active:scale-[0.98]"
                >
                  Entendi, fechar
                </button>
              </div>
            </div>
          </div>
        )}
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
          <span className="text-xl font-black tracking-tight text-gray-900">{appMeta.name}</span>
        </div>

        <div className="mb-4 border-b border-gray-50 px-6 py-4">
          <Link href="/usuario/perfil" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-[#0264af]/10 text-sm font-bold text-[#0264af]">
              FS
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Felipe Santos</p>
              <p className="text-xs text-gray-500">Nível Ouro • 1.990 pts</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {userMainNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                  active ? "bg-[#0264af]/8 text-[#0264af]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon size={20} className={active ? "stroke-[2.5px]" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <Link
            href="/usuario/perfil"
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition-all hover:bg-gray-50"
          >
            <Settings size={20} />
            Configurações
          </Link>
          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut size={20} />
            {isSigningOut ? "Saindo..." : "Sair da conta"}
          </button>
        </div>
      </aside>

      <div className="relative flex h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-md md:px-8 md:py-4">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#0264af]/10 text-sm font-bold text-[#0264af] shadow-sm">
              FS
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Bom dia,</p>
              <p className="text-sm font-bold text-gray-900">Felipe 👋</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden items-center rounded-full border border-gray-100 bg-gray-50 px-4 py-2 md:flex">
              <Search size={18} className="mr-2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-48 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-full bg-gray-50 p-2 text-gray-600 transition-colors hover:bg-gray-100 md:p-3"
              >
                <Bell size={20} />
                {!alertDismissed && <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-white bg-red-500 md:right-2 md:top-2 md:h-2.5 md:w-2.5" />}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 animate-in fade-in slide-in-from-top-2 rounded-3xl border border-gray-100 bg-white p-2 shadow-2xl ring-1 ring-black/5 z-50">
                  <div className="p-4 flex items-center justify-between border-b border-gray-50">
                    <h3 className="font-bold text-gray-900">Notificações</h3>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Recentes</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {activeAlert ? (
                      <div className="flex gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-50 mb-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0264af] text-white">
                          <Megaphone size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Aviso da Operação</p>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{activeAlert}</p>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">Agora mesmo</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm text-gray-500">Sem notificações no momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50/60 p-4 pb-24 md:p-8 md:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <nav className="fixed bottom-0 z-50 flex w-full items-center justify-between border-t border-gray-100 bg-white px-6 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] md:hidden">
        {userMainNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[64px] flex-col items-center gap-1 p-2 transition-all duration-300",
                active ? "scale-110 text-[#0264af]" : "text-gray-400 hover:text-gray-600",
              )}
            >
              <Icon size={24} className={active ? "stroke-[2.5px]" : ""} />
              <span
                className={cn(
                  "text-[10px] font-medium transition-all",
                  active ? "opacity-100" : "h-0 overflow-hidden opacity-0",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
