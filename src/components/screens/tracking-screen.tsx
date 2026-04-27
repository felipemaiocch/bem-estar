"use client";

import { useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { trackingCards } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function TrackingScreen() {
  const [checkedToday, setCheckedToday] = useState<null | boolean>(null);
  const [syncingCheck, setSyncingCheck] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  async function submitDailyCheck(value: boolean) {
    if (syncingCheck) {
      return;
    }

    setSyncingCheck(true);
    setSyncFeedback(null);

    try {
      const response = await fetch("/api/user/progress/wellness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moodLabel: value ? "Plano seguido" : "Preciso ajustar",
          notes: value
            ? "Check diário: plano seguido."
            : "Check diário: ajuste necessário no plano.",
          habitsScore: value ? 100 : 55,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setSyncFeedback(data.error ?? "Não foi possível salvar o check diário.");
        return;
      }

      setCheckedToday(value);
      setSyncFeedback("Check diário salvo no seu histórico.");
    } catch {
      setSyncFeedback("Falha de conexão ao salvar check diário.");
    } finally {
      setSyncingCheck(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,_rgba(37,99,235,1),_rgba(8,47,73,1))] text-white">
          <CardContent className="space-y-4 px-5 pb-5 pt-6 sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
              Acompanhamento diário
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Plano alimentar, recomendações e check diário
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Tela pensada para reforçar rotina, registrar aderência e centralizar feedback
                do profissional sem fricção.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check diário</CardTitle>
            <CardDescription>Você seguiu seu plano hoje?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant={checkedToday === true ? "primary" : "secondary"}
                onClick={() => void submitDailyCheck(true)}
                disabled={syncingCheck}
              >
                Sim, segui
              </Button>
              <Button
                variant={checkedToday === false ? "outline" : "secondary"}
                onClick={() => void submitDailyCheck(false)}
                disabled={syncingCheck}
              >
                Preciso ajustar
              </Button>
            </div>
            {syncFeedback ? (
              <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                {syncFeedback}
              </div>
            ) : null}
            <div
              className={cn(
                "rounded-[24px] px-4 py-4 text-sm",
                checkedToday === true
                  ? "bg-emerald-50 text-emerald-700"
                  : checkedToday === false
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-50 text-slate-500",
              )}
            >
              {checkedToday === true
                ? "Check-in registrado. Você ganhou pontos de consistência."
                : checkedToday === false
                  ? "Sem problema. O profissional recebe esse feedback para ajustar o plano."
                  : "Marque seu status para manter o histórico atualizado."}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Plano atual"
          title="Cards de acompanhamento"
          description="Informações visuais de alimentação, saúde mental e performance."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {trackingCards.map((item) => (
            <Card key={item.title} className="overflow-hidden">
              <div className={cn("h-24 bg-gradient-to-r", item.accent)} />
              <CardContent className="space-y-3 px-5 pb-5 pt-5">
                <p className="text-xl font-semibold tracking-tight text-slate-950">{item.title}</p>
                <p className="text-sm leading-6 text-slate-500">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recomendações do profissional</CardTitle>
            <CardDescription>Atualizações orientadas por evidência e histórico recente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Aumentar ingestão de água entre 14h e 18h",
              "Reforçar pausa ativa após reuniões longas",
              "Adicionar refeição de recuperação após treino",
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload de feedback</CardTitle>
            <CardDescription>
              Espaço preparado para anexar imagem, áudio ou texto de retorno do dia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex min-h-52 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600">
                <Upload className="h-6 w-6" />
              </div>
              <p className="mt-4 font-medium text-slate-950">Arraste um arquivo ou toque para anexar</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Fluxo pronto para conectar upload real com bucket externo depois.
              </p>
            </div>
            <div className="rounded-[24px] bg-blue-50 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-950">Última devolutiva</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Energia percebida melhorou após reorganização de lanches e sono.
                  </p>
                </div>
              </div>
            </div>
            <Button className="w-full">Enviar feedback</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
