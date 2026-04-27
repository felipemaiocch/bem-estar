"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, HeartPulse, Scale, Smile, Trophy } from "lucide-react";

import { MiniBarChart } from "@/components/charts/mini-bar-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const moodOptions = [
  { label: "Energizado", accent: "bg-emerald-500 text-white" },
  { label: "Equilibrado", accent: "bg-blue-500 text-white" },
  { label: "Sob pressão", accent: "bg-amber-500 text-white" },
  { label: "Cansado", accent: "bg-rose-500 text-white" },
];

type WellnessEntry = {
  id: string;
  weightKg: number | null;
  moodLabel: string | null;
  habitsScore: number | null;
  notes: string | null;
  createdAtIso: string;
  createdAtLabel: string;
};

export function ProgressScreen() {
  const [mood, setMood] = useState("Equilibrado");
  const [weight, setWeight] = useState("79,4");
  const [habitsNotes, setHabitsNotes] = useState(
    "Hidratação ok, pausas ativas concluídas, meditação de 10 minutos feita.",
  );
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [history, setHistory] = useState<WellnessEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Derived data from history
  const streakSummary = [
    { label: "Check-ins totais", value: history.length > 0 ? String(history.length) : "—" },
    { label: "Humor frequente", value: history.length > 0 ? (history[0]?.moodLabel ?? "—") : "—" },
    { label: "Hábitos (média)", value: history.length > 0 ? `${Math.round(history.reduce((acc, e) => acc + (e.habitsScore ?? 0), 0) / history.length)}%` : "—" },
  ];

  // Build weekly bar chart from last entries
  const weeklyProgress = (() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const base = days.map(d => ({ day: d, score: 0 }));
    history.slice(0, 10).forEach((entry) => {
      const date = new Date(entry.createdAtIso);
      const dayIdx = date.getDay();
      if (base[dayIdx]) {
        base[dayIdx].score = Math.min((base[dayIdx].score ?? 0) + 20, 100);
      }
    });
    return base;
  })();

  useEffect(() => {
    async function loadLatestWellness() {
      setIsLoadingHistory(true);
      try {
        const response = await fetch("/api/user/progress/wellness");
        const data = (await response.json()) as {
          ok?: boolean;
          entries?: WellnessEntry[];
        };

        if (!response.ok || !data.ok || !data.entries) {
          return;
        }

        setHistory(data.entries);

        if (data.entries.length > 0) {
          const latest = data.entries[0];
          if (latest.weightKg !== null) {
            setWeight(String(latest.weightKg).replace(".", ","));
          }
          if (latest.moodLabel) {
            setMood(latest.moodLabel);
          }
          if (latest.notes) {
            setHabitsNotes(latest.notes);
          }
        }
      } catch {
        // Falha silenciosa para manter a tela usável mesmo sem API.
      } finally {
        setIsLoadingHistory(false);
      }
    }

    void loadLatestWellness();
  }, []);

  async function handleSaveProgress() {
    if (saving) {
      return;
    }

    setSaving(true);
    setSaveFeedback(null);

    const normalizedWeight = Number(weight.replace(",", ".").replace(/[^\d.]/g, ""));
    const weightKg = Number.isFinite(normalizedWeight) ? normalizedWeight : undefined;

    try {
      const response = await fetch("/api/user/progress/wellness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weightKg,
          moodLabel: mood,
          notes: habitsNotes,
          habitsScore: 80,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string; entry?: WellnessEntry };

      if (!response.ok || !data.ok) {
        setSaveFeedback(data.error ?? "Não foi possível salvar evolução.");
        return;
      }

      setSaveFeedback("Evolução salva com sucesso.");
      
      if (data.entry) {
        setHistory((prev) => [data.entry!, ...prev]);
      }
    } catch {
      setSaveFeedback("Falha de conexão ao salvar evolução.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(239,246,255,0.96))]">
          <CardContent className="space-y-5 px-5 pb-5 pt-6 sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              <Activity className="h-4 w-4" />
              Progresso
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Frequência, metas e histórico visual
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Uma visão clara do que mudou na sua rotina, com inputs rápidos para peso,
                humor e hábitos.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {streakSummary.map((item) => (
                <div key={item.label} className="rounded-[24px] bg-white px-4 py-4 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.2)]">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check-in rápido</CardTitle>
            <CardDescription>
              Atualize peso, humor e hábitos sem sair do fluxo principal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Scale className="h-4 w-4 text-slate-400" />
                Peso (kg)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 79,5"
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
              />
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Smile className="h-4 w-4 text-slate-400" />
                Humor
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {moodOptions.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setMood(item.label)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-all",
                      mood === item.label ? item.accent : "bg-white text-slate-600 ring-1 ring-slate-200",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <HeartPulse className="h-4 w-4 text-slate-400" />
                Hábitos
              </label>
              <textarea
                placeholder="Descreva como foi sua rotina de hidratação, sono, etc..."
                className="mt-3 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                value={habitsNotes}
                onChange={(event) => setHabitsNotes(event.target.value)}
              />
            </div>
            {saveFeedback ? (
              <div className={cn("rounded-2xl border px-4 py-3 text-sm", saveFeedback.includes("sucesso") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700")}>
                {saveFeedback}
              </div>
            ) : null}
            <Button className="w-full" onClick={() => void handleSaveProgress()} disabled={saving}>
              {saving ? "Salvando..." : "Salvar evolução"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_auto]">
        <Card>
          <CardHeader>
            <SectionHeading
              eyebrow="Ritmo"
              title="Frequência semanal"
              description="Acompanhe sua constância de check-ins nos últimos dias."
            />
          </CardHeader>
          <CardContent>
            <MiniBarChart data={weeklyProgress} />
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center bg-blue-600 p-6 text-white sm:min-w-[300px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 mb-4">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold">Resumo da constância</h3>
          <p className="mt-2 text-sm text-blue-100 opacity-90">
             Você realizou {history.length} check-ins no ciclo atual. Continue mantendo o ritmo para acumular mais pontos!
          </p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do momento</CardTitle>
            <CardDescription>Principais sinais de progresso desde a última semana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Peso estável nas últimas 3 semanas",
              "Humor predominante: equilibrado",
              "Hábitos concluídos acima de 80%",
            ].map((item) => (
              <div key={item} className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                {item}
              </div>
            ))}
            <div className="rounded-[24px] bg-blue-50 px-4 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-950">Trajetória positiva</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Seu score consolidado saiu de 68 para 88 nas últimas 6 semanas.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico visual</CardTitle>
            <CardDescription>Timeline com mudanças mais relevantes da rotina.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingHistory ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-[24px] bg-slate-100 p-6" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum check-in registrado ainda.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="relative rounded-[24px] border border-slate-100 bg-slate-50/70 px-4 py-4">
                  <div className="absolute left-4 top-4 h-3 w-3 rounded-full bg-blue-600" />
                  <div className="pl-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-950">Check-in de bem-estar</p>
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {entry.createdAtLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {entry.moodLabel && <span className="font-medium text-slate-700 mr-2">Humor: {entry.moodLabel}.</span>}
                      {entry.weightKg && <span className="font-medium text-slate-700 mr-2">Peso: {entry.weightKg}kg.</span>}
                      {entry.notes && <span>{entry.notes}</span>}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
