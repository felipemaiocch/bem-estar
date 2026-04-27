"use client";

import { useEffect, useState } from "react";
import { Plus, Target, Trophy } from "lucide-react";

import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ScoringRuleItem {
  id: string;
  name: string;
  action: "SESSION" | "EVENT" | "CHECKIN" | "STREAK" | "FEED_ENGAGEMENT" | "TESTIMONIAL";
  points: number;
  isActive: boolean;
  startsAtIso: string | null;
  endsAtIso: string | null;
}

const defaultRuleForm = {
  name: "",
  action: "SESSION" as ScoringRuleItem["action"],
  points: 10,
  startsAtIso: "",
  endsAtIso: "",
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af] focus:bg-white";

export function AdminGamificationScreen() {
  const [rules, setRules] = useState<ScoringRuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState(defaultRuleForm);

  async function loadRules() {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/scoring-rules");
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        rules?: ScoringRuleItem[];
      };

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Falha ao carregar regras de gamificação.");
      } else {
        setRules(data.rules ?? []);
      }
    } catch {
      setFeedback("Falha de conexão ao carregar regras de gamificação.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRules();
  }, []);

  async function handleCreateRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busyAction) {
      return;
    }

    setBusyAction("create-rule");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/scoring-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: ruleForm.name,
          action: ruleForm.action,
          points: ruleForm.points,
          startsAtIso: ruleForm.startsAtIso || null,
          endsAtIso: ruleForm.endsAtIso || null,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível criar a regra.");
        return;
      }

      setRuleForm(defaultRuleForm);
      setFeedback("Regra criada com sucesso.");
      await loadRules();
    } catch {
      setFeedback("Falha de conexão ao criar regra.");
    } finally {
      setBusyAction(null);
    }
  }

  async function toggleRuleStatus(rule: ScoringRuleItem) {
    if (busyAction) {
      return;
    }

    setBusyAction(`toggle-rule-${rule.id}`);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/scoring-rules/${rule.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !rule.isActive,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível atualizar a regra.");
        return;
      }

      setFeedback(`Regra '${rule.name}' atualizada.`);
      await loadRules();
    } catch {
      setFeedback("Falha de conexão ao atualizar regra.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <BackofficeShell
      badge="Gamificação"
      title="Motor de Engajamento"
      description="Crie e gerencie as regras de pontuação que alimentam o ranking e a retenção."
    >
      <div className="flex flex-col gap-6">
        {feedback ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {feedback}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Regras de Pontuação Ativas</h3>
              
              {loading ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Carregando regras...
                </div>
              ) : rules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Nenhuma regra configurada ainda. Crie sua primeira regra ao lado.
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                        rule.isActive ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100 bg-slate-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${rule.isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"}`}>
                          <Trophy size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {rule.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {rule.action} · <span className="font-semibold text-emerald-600">+{rule.points} pts</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={rule.isActive ? "outline" : "secondary"}
                        onClick={() => void toggleRuleStatus(rule)}
                        disabled={busyAction === `toggle-rule-${rule.id}`}
                      >
                        {busyAction === `toggle-rule-${rule.id}`
                          ? "Atualizando..."
                          : rule.isActive
                            ? "Inativar"
                            : "Ativar"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-blue-100 bg-gradient-to-r from-white to-blue-50/40 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="text-blue-600" size={24} />
                <h3 className="text-lg font-bold text-gray-900">Dicas de Engajamento</h3>
              </div>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-sm text-slate-600">
                <li>Sessões de <strong>terapia</strong> e <strong>nutrição</strong> costumam ter pontuação mais alta por exigirem maior comprometimento.</li>
                <li>Criar regras de <strong>streak</strong> (ofensivas) incentiva a recorrência.</li>
                <li>Eventos pontuais podem ter regras com data de <strong>Início</strong> e <strong>Fim</strong> para criar senso de urgência.</li>
              </ul>
            </Card>
          </div>

          <Card className="h-fit p-6">
            <div className="mb-4 flex items-center gap-2">
              <Plus size={20} className="text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900">Nova Regra</h3>
            </div>
            
            <form className="space-y-4" onSubmit={(event) => void handleCreateRule(event)}>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Nome da Regra</label>
                <input
                  className={inputClassName}
                  placeholder="Ex: Terapia concluída, Check-in diário"
                  value={ruleForm.name}
                  onChange={(event) =>
                    setRuleForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Ação Gatilho</label>
                <select
                  className={inputClassName}
                  value={ruleForm.action}
                  onChange={(event) =>
                    setRuleForm((current) => ({
                      ...current,
                      action: event.target.value as ScoringRuleItem["action"],
                    }))
                  }
                >
                  <option value="SESSION">Comparecimento em Sessão</option>
                  <option value="CHECKIN">Check-in de Bem-estar</option>
                  <option value="EVENT">Participação em Evento</option>
                  <option value="FEED_ENGAGEMENT">Engajamento no Feed</option>
                  <option value="TESTIMONIAL">Envio de Depoimento</option>
                  <option value="STREAK">Ofensiva (Streak)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Pontos a atribuir</label>
                <input
                  className={inputClassName}
                  type="number"
                  min={1}
                  max={500}
                  value={ruleForm.points}
                  onChange={(event) =>
                    setRuleForm((current) => ({ ...current, points: Number(event.target.value) }))
                  }
                  required
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Validade: Início (Op)</label>
                  <input
                    className={inputClassName}
                    type="datetime-local"
                    value={ruleForm.startsAtIso}
                    onChange={(event) =>
                      setRuleForm((current) => ({ ...current, startsAtIso: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Validade: Fim (Op)</label>
                  <input
                    className={inputClassName}
                    type="datetime-local"
                    value={ruleForm.endsAtIso}
                    onChange={(event) =>
                      setRuleForm((current) => ({ ...current, endsAtIso: event.target.value }))
                    }
                  />
                </div>
              </div>

              <Button type="submit" disabled={busyAction === "create-rule"} className="w-full mt-2">
                {busyAction === "create-rule" ? "Salvando..." : "Criar Regra"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </BackofficeShell>
  );
}
