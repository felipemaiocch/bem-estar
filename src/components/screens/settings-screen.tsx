"use client";

import { Bell, Camera, ChevronRight, Lock, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

interface PreferenceItem {
  key: "REMINDER_DAY_BEFORE" | "REMINDER_HOUR_BEFORE" | "SLOT_RELEASED" | "AGENDA_NEWS";
  label: string;
  description: string;
  enabled: boolean;
}

export function SettingsScreen() {
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [user, setUser] = useState<{ name: string; avatarUrl: string | null; email: string } | null>(null);
  const [apiFeedback, setApiFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoadingPreferences(true);
      setLoadingUser(true);
      try {
        const [prefResp, userResp] = await Promise.all([
          fetch("/api/user/notification-preferences"),
          fetch("/api/user/me"),
        ]);
        
        const prefData = await prefResp.json();
        const userData = await userResp.json();

        if (prefData.ok) setPreferences(prefData.preferences);
        if (userData.ok) setUser(userData.user);
      } catch {
        setApiFeedback({ type: "error", message: "Erro ao carregar configurações." });
      } finally {
        setLoadingPreferences(false);
        setLoadingUser(false);
      }
    }
    loadSettings();
  }, []);

  async function togglePreference(key: PreferenceItem["key"], enabled: boolean) {
    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });
      const data = await response.json();
      if (data.ok) setPreferences(data.preferences);
    } catch {
      setApiFeedback({ type: "error", message: "Erro ao atualizar preferência." });
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Em um app real, faríamos upload para S3/Cloudinary aqui.
    // Para o MVP, vamos simular ou salvar em base64 se o banco permitir strings longas.
    // Vamos apenas disparar um alerta de "Funcionalidade em implementação" ou simular o upload.
    
    setLoadingUser(true);
    setApiFeedback(null);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/user/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.ok) {
        setUser(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
        setApiFeedback({ type: "success", message: "Foto de perfil atualizada!" });
        // Notificar o shell para atualizar o sidebar
        window.dispatchEvent(new CustomEvent("user-data-changed"));
      } else {
        setApiFeedback({ type: "error", message: data.error || "Erro ao subir foto." });
      }
    } catch {
      setApiFeedback({ type: "error", message: "Falha de conexão ao subir foto." });
    } finally {
      setLoadingUser(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setApiFeedback({ type: "error", message: "As novas senhas não coincidem." });
      return;
    }

    setIsChangingPassword(true);
    setApiFeedback(null);

    try {
      const response = await fetch("/api/user/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setApiFeedback({ type: "success", message: "Senha alterada com sucesso!" });
        setShowPasswordForm(false);
        setPasswordForm({ current: "", new: "", confirm: "" });
      } else {
        setApiFeedback({ type: "error", message: data.error || "Erro ao alterar senha." });
      }
    } catch {
      setApiFeedback({ type: "error", message: "Erro de conexão." });
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 px-2">
        <h1 className="text-3xl font-black text-slate-900">Configurações</h1>
      </div>

      {/* Perfil e Foto */}
      <Card>
        <CardHeader>
          <SectionHeading
            eyebrow="Dados Pessoais"
            title="Seu Perfil"
            description="Gerencie sua imagem de exibição e dados básicos."
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-100">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-[#0264af]/10 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-[#0264af]" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full shadow-lg hover:scale-110 transition-all border-2 border-white"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-slate-900">{user?.name || "Carregando..."}</h3>
              <p className="text-slate-500">{user?.email || "—"}</p>
              <p className="text-xs font-bold text-[#0264af] mt-2 uppercase tracking-widest">Membro se.monitora</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors hidden sm:block">
              <ChevronRight />
            </button>
          </div>
          
          {apiFeedback && (
            <div className={cn(
              "p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-1",
              apiFeedback.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
            )}>
              {apiFeedback.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <SectionHeading
            eyebrow="Comunicação"
            title="Preferências de Push"
            description="Escolha quais alertas você deseja receber no seu celular ou navegador."
            action={<Bell className="text-[#0264af]" size={20} />}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingPreferences && <div className="text-sm text-slate-400 p-4">Carregando preferências...</div>}
          {preferences.map((item) => (
            <button
              key={item.key}
              onClick={() => togglePreference(item.key, !item.enabled)}
              className="group flex w-full items-start justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-5 text-left transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className="flex-1">
                <p className="font-bold text-slate-900 group-hover:text-[#0264af] transition-colors">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
              <div
                className={cn(
                  "mt-1 flex h-7 w-12 items-center rounded-full px-1 transition-all duration-300",
                  item.enabled ? "justify-end bg-[#0264af]" : "justify-start bg-slate-300",
                )}
              >
                <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <SectionHeading
            eyebrow="Proteção"
            title="Segurança da Conta"
            description="Alterne sua senha e gerencie acessos ativos."
            action={<Lock className="text-slate-400" size={20} />}
          />
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <button 
              onClick={() => setShowPasswordForm(true)}
              className="flex items-center justify-between w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all group"
            >
              <span className="font-bold text-slate-700">Alterar senha</span>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Senha Atual</label>
                <input 
                  type="password" 
                  required
                  value={passwordForm.current}
                  onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                  className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#0264af] outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nova Senha</label>
                  <input 
                    type="password" 
                    required
                    value={passwordForm.new}
                    onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#0264af] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    required
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#0264af] outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="flex-1 h-12 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-[2] h-12 rounded-2xl font-bold text-white bg-slate-900 hover:bg-black transition-all disabled:opacity-50"
                >
                  {isChangingPassword ? "Salvando..." : "Salvar nova senha"}
                </button>
              </div>
            </form>
          )}
          <p className="mt-4 text-xs text-center text-slate-400">ID da sessão atual: {user?.email ? btoa(user.email).substring(0, 16) : '...'}</p>
        </CardContent>
      </Card>

      <div className="pt-8 text-center">
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">se.monitora v1.0.0</p>
      </div>
    </div>
  );
}
