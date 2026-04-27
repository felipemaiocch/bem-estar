"use client";

import { Bell, CalendarClock, NotebookPen, Sparkles, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  careRecordCategoryOptions,
} from "@/lib/mock-data";
import type { CareRecordCategory, UserCareRecord } from "@/types";
import { cn } from "@/lib/utils";

interface PreferenceItem {
  key: "REMINDER_DAY_BEFORE" | "REMINDER_HOUR_BEFORE" | "SLOT_RELEASED" | "AGENDA_NEWS";
  label: string;
  description: string;
  enabled: boolean;
}

export function ProfileScreen() {
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [records, setRecords] = useState<UserCareRecord[]>([]);
  const [activeTab, setActiveTab] = useState<CareRecordCategory | "todos">("todos");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; score: number; area: string } | null>(null);
  const [apiFeedback, setApiFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      setLoadingRecords(true);
      setLoadingPreferences(true);
      setApiFeedback(null);

      try {
        const [recordsResponse, preferencesResponse] = await Promise.all([
          fetch("/api/user/profile/care-records"),
          fetch("/api/user/notification-preferences"),
        ]);

        const recordsData = (await recordsResponse.json()) as {
          ok?: boolean;
          error?: string;
          records?: UserCareRecord[];
          user?: { name: string; score: number; area: string };
        };
        const preferencesData = (await preferencesResponse.json()) as {
          ok?: boolean;
          error?: string;
          preferences?: PreferenceItem[];
        };

        if (recordsResponse.ok && recordsData.ok) {
          setRecords(recordsData.records ?? []);
          if (recordsData.user) {
            setCurrentUser(recordsData.user);
          }
        } else {
          setApiFeedback(recordsData.error ?? "Falha ao carregar histórico de acompanhamento.");
        }

        if (preferencesResponse.ok && preferencesData.ok) {
          setPreferences(preferencesData.preferences ?? []);
        } else {
          setApiFeedback(
            preferencesData.error ?? "Falha ao carregar preferências de notificação.",
          );
        }
      } catch {
        setApiFeedback("Falha de conexão ao carregar dados do perfil.");
      } finally {
        setLoadingRecords(false);
        setLoadingPreferences(false);
      }
    }

    void loadProfileData();
  }, []);

  const userPoints = currentUser?.score ?? 0;
  const userLevel = userPoints >= 3000 ? "Ouro" : userPoints >= 1000 ? "Prata" : "Bronze";
  const levelColor = userPoints >= 3000 ? "text-amber-500 bg-amber-50 border-amber-100" : userPoints >= 1000 ? "text-slate-400 bg-slate-50 border-slate-200" : "text-orange-700 bg-orange-50 border-orange-100";

  const currentUserRecords = useMemo(
    () =>
      records
        .sort((left, right) => right.recordedAtIso.localeCompare(left.recordedAtIso)),
    [records],
  );

  const filteredRecords = useMemo(
    () =>
      activeTab === "todos"
        ? currentUserRecords
        : currentUserRecords.filter((item) => item.category === activeTab),
    [activeTab, currentUserRecords],
  );

  const activeAreas = new Set(currentUserRecords.map((item) => item.category)).size;
  const latestRecord = currentUserRecords[0];

  async function togglePreference(key: PreferenceItem["key"], enabled: boolean) {
    setApiFeedback(null);

    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, enabled }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        preferences?: PreferenceItem[];
      };

      if (!response.ok || !data.ok || !data.preferences) {
        setApiFeedback(data.error ?? "Não foi possível salvar preferência.");
        return;
      }

      setPreferences(data.preferences);
    } catch {
      setApiFeedback("Falha de conexão ao salvar preferência.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="overflow-hidden p-6">
          <CardContent className="space-y-5 px-0 pb-0 pt-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-[#0264af]/10">
              <UserRound className="h-9 w-9 text-[#0264af]" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                {currentUser?.name || "Carregando..." }
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {currentUser?.area || "—"} · se.monitora · Colaborador
              </p>
            </div>
            <div className="grid gap-3">
              <div className={cn("rounded-[24px] border px-4 py-4 text-sm font-bold flex justify-between items-center", levelColor)}>
                <span>Nível atual</span>
                <span>Nível {userLevel}</span>
              </div>
              <div className="rounded-[24px] bg-slate-900 text-white px-4 py-4 text-sm font-bold flex justify-between items-center shadow-lg">
                <span>Pontuação acumulada</span>
                <span>{userPoints} pts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading
              eyebrow="Meu acompanhamento"
              title="Tudo o que os profissionais registrarem aparece aqui"
              description="Receitas, medidas, orientações e próximos passos ficam organizados por frente de atendimento."
              action={
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <NotebookPen className="h-4 w-4" />
                </div>
              }
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingRecords ? (
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Carregando histórico...
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Frentes com histórico</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {activeAreas}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Registros recebidos</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {currentUserRecords.length}
                </p>
              </div>
              <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Última atualização</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {latestRecord?.recordedAtLabel ?? "Sem registros ainda"}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-dashed border-[#0264af]/25 bg-[#0264af]/5 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0264af]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Fluxo pronto entre profissional e usuário</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Quando o profissional salva um atendimento no painel dele, o conteúdo já entra nas abas abaixo para o usuário acompanhar.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <SectionHeading
              eyebrow="Histórico por frente"
              title="Acompanhamento por atividade"
              description="Abra cada aba para ver o que foi feito, o que foi entregue e qual o próximo passo de cada atendimento."
              action={
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <CalendarClock className="h-4 w-4" />
                </div>
              }
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("todos")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                  activeTab === "todos"
                    ? "bg-[#0264af] text-white shadow-[0_10px_24px_-16px_rgba(2,100,175,0.55)]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                Tudo
              </button>
              {careRecordCategoryOptions.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                    activeTab === item.value
                      ? "bg-[#fd3a83] text-white shadow-[0_10px_24px_-16px_rgba(253,58,131,0.55)]"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filteredRecords.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredRecords.map((record) => {
                  const category =
                    careRecordCategoryOptions.find((item) => item.value === record.category) ??
                    careRecordCategoryOptions[0];

                  return (
                    <div
                      key={record.id}
                      className="rounded-[28px] border border-slate-100 bg-slate-50/80 px-5 py-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", category.accent)}>
                            {category.label}
                          </span>
                          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
                            {record.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.professional} · {record.professionalRole}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                          {record.recordedAtLabel}
                        </span>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            O que foi feito
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{record.summary}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Entrega para você
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{record.delivery}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Próximo passo
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{record.nextStep}</p>
                        </div>

                        {record.metrics.length ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {record.metrics.map((metric) => (
                              <div
                                key={`${record.id}-${metric.label}`}
                                className="rounded-[22px] border border-white bg-white px-4 py-4"
                              >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  {metric.label}
                                </p>
                                <p className="mt-2 text-base font-semibold text-slate-950">
                                  {metric.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                <p className="text-base font-semibold text-slate-950">
                  Ainda não há registros nessa aba.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Assim que o profissional lançar uma atualização, ela aparece aqui automaticamente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="max-w-2xl">
        <Card>
          <CardHeader>
            <SectionHeading
              eyebrow="Central de notificações"
              title="Preferências de push"
              description="Ative ou desative lembretes, agenda dr e alertas de vagas."
              action={
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Bell className="h-4 w-4" />
                </div>
              }
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingPreferences ? (
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Carregando preferências...
              </div>
            ) : null}
            {apiFeedback ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                {apiFeedback}
              </div>
            ) : null}
            {preferences.map((item) => (
              <button
                key={item.label}
                onClick={() => void togglePreference(item.key, !item.enabled)}
                className="flex w-full items-start justify-between gap-4 rounded-[24px] border border-slate-100 bg-slate-50/70 px-4 py-4 text-left"
              >
                <div>
                  <p className="font-medium text-slate-950">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
                <div
                  className={cn(
                    "mt-1 flex h-7 w-12 items-center rounded-full px-1 transition-all",
                    item.enabled ? "justify-end bg-[#0264af]" : "justify-start bg-slate-300",
                  )}
                >
                  <span className="h-5 w-5 rounded-full bg-white" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

      </section>

    </div>
  );
}
