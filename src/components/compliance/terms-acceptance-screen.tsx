"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, FileText, ImageIcon, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { appMeta } from "@/lib/constants";

interface TermsAcceptanceScreenProps {
  userName: string;
  nextPath: string;
  requiredVersion: string;
  initialImageConsent: boolean;
}

export function TermsAcceptanceScreen({
  userName,
  nextPath,
  requiredVersion,
  initialImageConsent,
}: TermsAcceptanceScreenProps) {
  const router = useRouter();
  const [acceptPlatformTerms, setAcceptPlatformTerms] = useState(false);
  const [acceptImagePublication, setAcceptImagePublication] =
    useState(initialImageConsent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!acceptPlatformTerms) {
      setError("Para continuar, aceite o termo principal da plataforma.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/compliance/acceptance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acceptPlatformTerms,
          acceptImagePublication,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Não foi possível registrar o aceite agora.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Falha de conexão ao registrar o aceite.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="flex flex-col justify-between rounded-lg bg-[#0264af] p-6 text-white shadow-xl shadow-[#0264af]/20 md:p-8">
            <div>
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-white/12 ring-1 ring-white/20">
                <ShieldCheck size={26} />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                {appMeta.name}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Aceite de uso da plataforma
              </h1>
              <p className="mt-4 text-sm leading-6 text-white/78">
                Antes de acessar sua área, precisamos registrar ciência sobre o uso
                da plataforma de bem-estar e suas regras principais.
              </p>
            </div>

            <div className="mt-10 space-y-3 text-sm text-white/82">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                Termo versionado para auditoria.
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                Consentimento de imagem separado.
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                Registro vinculado ao primeiro acesso.
              </div>
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] md:p-7"
          >
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fd3a83]/10 text-[#fd3a83]">
                <FileText size={22} />
              </div>
              <p className="text-sm font-medium text-slate-500">Olá, {userName}</p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Termo de consentimento de saúde
              </h2>
              <p className="text-sm text-slate-500">Versão {requiredVersion}</p>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <p>
                A plataforma se.monitora é um benefício de bem-estar oferecido por
                mera liberalidade da empresa, com foco em engajamento,
                acompanhamento preventivo e conteúdos de apoio.
              </p>
              <p>
                As informações, atividades, campanhas e orientações registradas aqui
                não substituem consulta, diagnóstico, acompanhamento ou tratamento
                médico, psicológico, nutricional ou de qualquer profissional de saúde.
              </p>
              <p>
                Dados de saúde e bem-estar poderão ser tratados para operação da
                plataforma, segurança, histórico individual e métricas administrativas,
                respeitando a LGPD e as permissões aplicáveis.
              </p>
              <p>
                Em caso de urgência, sintoma relevante ou decisão clínica, procure um
                serviço de saúde ou profissional habilitado.
              </p>
            </div>

            <label className="mt-6 flex cursor-pointer gap-3 rounded-lg border border-[#0264af]/20 bg-[#0264af]/5 p-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={acceptPlatformTerms}
                onChange={(event) => setAcceptPlatformTerms(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0264af] focus:ring-[#0264af]"
              />
              <span>
                Li e aceito o termo principal da plataforma, incluindo a ciência de que
                o programa é um benefício por mera liberalidade e não substitui cuidado
                médico ou assistencial.
              </span>
            </label>

            <label className="mt-3 flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={acceptImagePublication}
                onChange={(event) => setAcceptImagePublication(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#fd3a83] focus:ring-[#fd3a83]"
              />
              <span className="flex-1">
                <span className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
                  <ImageIcon size={16} />
                  Autorizo uso de imagem e publicações
                </span>
                Permito o uso da minha imagem e de publicações enviadas por mim em
                campanhas internas de bem-estar da plataforma.
              </span>
            </label>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                O aceite principal é obrigatório para usar a plataforma.
              </p>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Aceitar e continuar"}
                <ArrowRight size={18} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
