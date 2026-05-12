"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  Lock,
  Mail,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { appMeta, roleRouteMap } from "@/lib/constants";
import type { UserRole } from "@/types";

const goals = [
  "Saúde mental",
  "Condicionamento físico",
  "Alimentação saudável",
  "Performance no trabalho",
];

const frequencies = ["1", "2", "3", "4", "5", "Todos os dias"];

export function AuthLanding() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("USER");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "request-access">("login");
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [requestForm, setRequestForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: selectedRole,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok || !data.ok || !data.redirectTo) {
        setLoginError(data.error ?? "Não foi possível entrar agora.");
        return;
      }

      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setLoginError("Falha de conexão ao tentar autenticar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestAccessSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);
    setRequestFeedback(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: requestForm.name,
          email: requestForm.email,
          password: requestForm.password,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        setLoginError(data.error ?? "Não foi possível solicitar acesso agora.");
        return;
      }

      setRequestFeedback(
        data.message ??
          "Cadastro enviado para aprovação. Você poderá entrar assim que o administrador liberar seu acesso.",
      );
      setForm((current) => ({ ...current, email: requestForm.email, password: "" }));
      setRequestForm({ name: "", email: "", password: "" });
    } catch {
      setLoginError("Falha de conexão ao solicitar acesso.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <div className="z-10 flex w-full flex-1 flex-col justify-center bg-white p-6 shadow-2xl md:max-w-md md:p-10 lg:max-w-lg lg:p-16">
        {!showOnboarding ? (
          <>
            <div className="mb-8 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg shadow-[#0264af]/15 ring-1 ring-gray-100">
              <Image
                src={appMeta.logoPath}
                alt={appMeta.name}
                width={72}
                height={72}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Bem-vindo ao <span className="text-[#fd3a83]">se.monitora</span>
              </h1>
              <p className="mt-2 text-base text-gray-500">
                {authMode === "login"
                  ? "Entre para acessar sua rotina de saúde e bem-estar da dr.monitora."
                  : "Solicite seu acesso. A entrada será liberada após aprovação do administrador."}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setLoginError(null);
                  setRequestFeedback(null);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  authMode === "login"
                    ? "bg-white text-[#0264af] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("request-access");
                  setLoginError(null);
                  setRequestFeedback(null);
                }}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  authMode === "request-access"
                    ? "bg-white text-[#0264af] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Solicitar acesso
              </button>
            </div>

            {authMode === "login" ? (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="seuemail@exemplo.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 outline-none transition-all focus:border-[#0264af] focus:bg-white focus:ring-2 focus:ring-[#0264af]/20"
                  />
                  <Mail className="absolute right-3 top-3.5 text-gray-400" size={18} />
                </div>
              </div>

              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 outline-none transition-all focus:border-[#0264af] focus:bg-white focus:ring-2 focus:ring-[#0264af]/20"
                  />
                  <Lock className="absolute right-3 top-3.5 text-gray-400" size={18} />
                </div>
              </div>


              <div className="flex justify-end">
                <span className="text-xs font-medium text-gray-400 italic">
                  Esqueceu a senha? Contate o administrador.
                </span>
              </div>

              {loginError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loginError}
                </div>
              ) : null}

              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Entrando..." : "Entrar"}
                <ArrowRight size={18} />
              </Button>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[12px] text-slate-500 leading-relaxed">
                Se ainda não houver aceite registrado, você será direcionado ao{" "}
                <span className="font-semibold text-slate-700">
                  Termo de Consentimento de Saúde
                </span>{" "}
                antes de acessar a plataforma.
              </div>
            </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRequestAccessSubmit}>
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome completo</label>
                  <input
                    value={requestForm.name}
                    onChange={(event) =>
                      setRequestForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 outline-none transition-all focus:border-[#0264af] focus:bg-white focus:ring-2 focus:ring-[#0264af]/20"
                    required
                  />
                </div>

                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={requestForm.email}
                      onChange={(event) =>
                        setRequestForm((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="seuemail@exemplo.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 outline-none transition-all focus:border-[#0264af] focus:bg-white focus:ring-2 focus:ring-[#0264af]/20"
                      required
                    />
                    <Mail className="absolute right-3 top-3.5 text-gray-400" size={18} />
                  </div>
                </div>

                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={requestForm.password}
                      onChange={(event) =>
                        setRequestForm((current) => ({ ...current, password: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 outline-none transition-all focus:border-[#0264af] focus:bg-white focus:ring-2 focus:ring-[#0264af]/20"
                      minLength={6}
                      required
                    />
                    <Lock className="absolute right-3 top-3.5 text-gray-400" size={18} />
                  </div>
                </div>

                {loginError ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {loginError}
                  </div>
                ) : null}

                {requestFeedback ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {requestFeedback}
                  </div>
                ) : null}

                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar solicitação"}
                  <UserPlus size={18} />
                </Button>

                <p className="text-center text-xs leading-relaxed text-slate-500">
                  Após enviar, seu cadastro ficará pendente até aprovação do administrador.
                </p>
              </form>
            )}

          </>
        ) : (
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <button
                onClick={() => {
                  if (step > 1) {
                    setStep((current) => current - 1);
                  } else {
                    setShowOnboarding(false);
                  }
                }}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="flex gap-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className={`h-2 rounded-full transition-all ${step >= item ? "w-8 bg-[#0264af]" : "w-2 bg-gray-200"
                      }`}
                  />
                ))}
              </div>
            </div>

            {step < 3 ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#0264af]">
                  Onboarding
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  {step === 1
                    ? "Qual seu principal objetivo?"
                    : "Quantas vezes por semana deseja se dedicar?"}
                </h2>
                <p className="mb-8 mt-2 text-gray-500">
                  {step === 1
                    ? "Vamos personalizar sua experiência."
                    : "Isso ajuda a estruturar sua rotina dentro da plataforma."}
                </p>

                {step === 1 ? (
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <Card
                        key={goal}
                        onClick={() => setStep(2)}
                        className="cursor-pointer border border-gray-100 p-5 transition-colors hover:border-[#0264af] hover:bg-[#0264af]/6"
                      >
                        <p className="font-medium text-gray-800">{goal}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {frequencies.map((freq) => (
                      <Card
                        key={freq}
                        onClick={() => setStep(3)}
                        className="cursor-pointer p-5 text-center transition-colors hover:border-[#0264af] hover:bg-[#0264af]/6"
                      >
                        <p className="text-2xl font-black text-[#0264af]">{freq}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          frequência
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="pt-8 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 shadow-inner">
                  <CheckCircle size={46} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Tudo pronto</h2>
                <p className="mb-8 mt-3 text-lg text-gray-500">
                  Seu plano foi personalizado com sucesso.
                </p>
                <Button
                  size="lg"
                  onClick={() => router.push(roleRouteMap[selectedRole])}
                >
                  Começar a usar
                </Button>
              </div>
            )}

            <div className="mt-6 text-right text-xs font-semibold text-[#0264af]">
              {progress}% concluído
            </div>
          </div>
        )}
      </div>

      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[#0264af] via-[#0381d7] to-[#fd3a83] p-12 md:flex">
        <div className="absolute -right-10 -top-10 h-96 w-96 rounded-full bg-[#fd3a83] opacity-35 blur-3xl mix-blend-multiply" />
        <div className="absolute -bottom-10 -left-10 h-96 w-96 rounded-full bg-[#0264af] opacity-35 blur-3xl mix-blend-multiply" />

        <div className="relative z-10 max-w-xl text-white">
          <span className="mb-6 inline-flex rounded-full border border-white/20 bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
            Plataforma de saúde e bem-estar
          </span>

          <h2 className="mb-6 text-5xl font-black leading-tight">
            Bem-estar, cuidado e evolução em uma experiência contínua.
          </h2>
          <p className="mb-12 text-xl font-medium text-blue-100">
            Agenda com especialistas, atividades, progresso e comunidade em uma única
            plataforma da dr.monitora.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              <Activity size={30} className="mb-4 text-blue-200" />
              <h3 className="text-lg font-bold">Saúde integrada</h3>
              <p className="mt-2 text-sm text-blue-100">
                Acompanhamento contínuo e jornadas preventivas.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              <Trophy size={30} className="mb-4 text-amber-300" />
              <h3 className="text-lg font-bold">Gamificação real</h3>
              <p className="mt-2 text-sm text-blue-100">
                Recompensas por consistência e participação.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              <CalendarDays size={30} className="mb-4 text-cyan-200" />
              <h3 className="text-lg font-bold">Agenda fluida</h3>
              <p className="mt-2 text-sm text-blue-100">
                Agendamentos rápidos com confirmação e lembretes.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              <Users size={30} className="mb-4 text-emerald-200" />
              <h3 className="text-lg font-bold">Cultura viva</h3>
              <p className="mt-2 text-sm text-blue-100">
                Cultura, agenda dr e benefícios centralizados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
