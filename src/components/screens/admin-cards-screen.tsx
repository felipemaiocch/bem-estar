"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Image as ImageIcon, Trash2 } from "lucide-react";

import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EngagementCardItem {
  id: string;
  category: string;
  title: string;
  date: string;
  location: string;
  status: string;
  points: number;
  imageUrl: string | null;
  publishedBy: { name: string };
  slots?: string | null;
  availableDays?: string | null;
  responsibleName?: string | null;
  responsibleId?: string | null;
}

const defaultCardForm = {
  category: "saude-bem-estar",
  title: "",
  date: "",
  location: "",
  status: "Agenda aberta",
  points: "" as unknown as number,
  imageUrl: "",
  responsibleName: "",
  responsibleId: "",
  slots: "",
  availableDays: "",
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af] focus:bg-white";

const DAYS_OF_WEEK = [
  { id: "Monday", label: "Seg" },
  { id: "Tuesday", label: "Ter" },
  { id: "Wednesday", label: "Qua" },
  { id: "Thursday", label: "Qui" },
  { id: "Friday", label: "Sex" },
  { id: "Saturday", label: "Sáb" },
  { id: "Sunday", label: "Dom" },
];

export function AdminCardsScreen() {
  const [cards, setCards] = useState<EngagementCardItem[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState(defaultCardForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadCards() {
    setLoading(true);
    setFeedback(null);

    try {
      const [cardsRes, profRes] = await Promise.all([
        fetch("/api/admin/cards"),
        fetch("/api/admin/professionals"),
      ]);
      
      const cardsData = await cardsRes.json();
      const profData = await profRes.json();

      if (cardsData.ok) {
        setCards(cardsData.cards ?? []);
      }
      if (profData.ok) {
        setProfessionals(profData.professionals ?? []);
      }
    } catch {
      setFeedback("Falha de conexão ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCards();
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Você tem certeza que deseja excluir permanentemente este card?")) {
      return;
    }

    setBusyAction(`delete-${id}`);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/cards/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error();
      setFeedback("Card deletado com sucesso.");
      await loadCards();
    } catch {
      setFeedback("Falha ao deletar card.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busyAction) return;
    setBusyAction("create");
    setFeedback(null);

    try {
      const url = editingId ? `/api/admin/cards/${editingId}` : "/api/admin/cards";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          points: Number(form.points),
          responsibleName: form.responsibleName,
          responsibleId: form.responsibleId,
          slots: form.slots,
          availableDays: form.availableDays,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível criar o card.");
        return;
      }

      setForm(defaultCardForm);
      setEditingId(null);
      setFeedback(editingId ? "Card atualizado com sucesso." : "Card criado com sucesso.");
      await loadCards();
    } catch {
      setFeedback("Falha de conexão ao salvar card.");
    } finally {
      setBusyAction(null);
    }
  }

  function handleStartEdit(card: any) {
     setForm({
        category: card.category,
        title: card.title,
        date: card.date,
        location: card.location,
        status: card.status,
        points: card.points,
        imageUrl: card.imageUrl || "",
        responsibleName: card.responsibleName || "",
        responsibleId: card.responsibleId || "",
        slots: card.slots || "",
        availableDays: card.availableDays || "",
     });
     setEditingId(card.id);
     setFeedback(null);
     window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
     setForm(defaultCardForm);
     setEditingId(null);
  }

  function toggleDay(dayId: string) {
    const current = form.availableDays.split(",").filter(Boolean).map(d => d.trim());
    let next: string[];
    if (current.includes(dayId)) {
      next = current.filter(d => d !== dayId);
    } else {
      next = [...current, dayId];
    }
    setForm(f => ({ ...f, availableDays: next.join(", ") }));
  }

  return (
    <BackofficeShell
      badge="Gerenciamento CMS"
      title="Cards de Categoria"
      description="Crie os blocos com imagens exibidos nas telas de Saúde, Cultura e Agenda do usuário."
    >
      <div className="flex flex-col gap-6">
        {feedback ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {feedback}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_2fr]">
          <Card className="p-6 h-fit">
            <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-blue-600" />
              {editingId ? "Editar card" : "Novo card"}
            </h3>
            <form className="grid gap-3" onSubmit={(event) => void handleCreate(event)}>
               <select
                  className={inputClassName}
                  value={form.category}
                  onChange={(event) => setForm((c) => ({ ...c, category: event.target.value }))}
                >
                  <option value="saude-bem-estar">Saúde e bem-estar (Ex: Psicologia)</option>
                  <option value="cultura">Cultura (Ex: Filosofia)</option>
                  <option value="agenda-dr">Agenda dr (Ex: Sunset e Festas)</option>
                </select>

              <input
                className={inputClassName}
                placeholder="Título principal"
                value={form.title}
                onChange={(event) => setForm((c) => ({ ...c, title: event.target.value }))}
                required
              />
              <input
                className={inputClassName}
                type="date"
                placeholder="Data"
                value={form.date}
                onChange={(event) => setForm((c) => ({ ...c, date: event.target.value }))}
              />
              <input
                className={inputClassName}
                placeholder="Local / Disponibilidade"
                value={form.location}
                onChange={(event) => setForm((c) => ({ ...c, location: event.target.value }))}
                required
              />
              
              <div className="grid gap-3 grid-cols-2">
                 <select
                  className={inputClassName}
                  value={form.status}
                  onChange={(event) => setForm((c) => ({ ...c, status: event.target.value }))}
                  required
                >
                  <option value="Agenda aberta">Agenda aberta</option>
                  <option value="Atendimento contínuo">Atendimento contínuo</option>
                  <option value="Vagas limitadas">Vagas limitadas</option>
                  <option value="Breve">Em breve</option>
                  <option value="Ativo">Ativo</option>
                </select>
                 <input
                  className={inputClassName}
                  type="number"
                  min={0}
                  placeholder="Pontos (ex: 80)"
                  value={form.points}
                  onChange={(event) => setForm((c) => ({ ...c, points: event.target.value as unknown as number }))}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                </div>
                 <input
                  className={`${inputClassName} pl-10`}
                  placeholder="URL da Imagem (Opcional)"
                  value={form.imageUrl}
                  onChange={(event) => setForm((c) => ({ ...c, imageUrl: event.target.value }))}
                  type="url"
                />
              </div>

              {form.category === "saude-bem-estar" ? (
                <select
                  className={inputClassName}
                  value={form.responsibleId}
                  onChange={(event) => setForm((f) => ({ ...f, responsibleId: event.target.value, responsibleName: professionals.find(p => p.id === event.target.value)?.name || "" }))}
                  required
                >
                  <option value="">Selecione o Profissional Responsável...</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.specialty})</option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClassName}
                  placeholder="Nome do Responsável / Palestrante"
                  value={form.responsibleName}
                  onChange={(event) => setForm((f) => ({ ...f, responsibleName: event.target.value, responsibleId: "" }))}
                />
              )}

              <div className="grid gap-3 grid-cols-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Horários Individuais (ex: 09:00, 10:00, 16:00)
                    <input
                      className={inputClassName}
                      placeholder="09:00, 10:00..."
                      value={form.slots}
                      onChange={(event) => setForm((f) => ({ ...f, slots: event.target.value }))}
                    />
                 </label>
                 
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                       Dias da Semana Recorrentes
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                       {DAYS_OF_WEEK.map((day) => {
                          const isActive = form.availableDays.toLowerCase().includes(day.id.toLowerCase());
                          return (
                             <button
                                key={day.id}
                                type="button"
                                onClick={() => toggleDay(day.id)}
                                className={`h-10 w-10 rounded-full border text-[11px] font-bold uppercase transition-all ${
                                   isActive 
                                   ? "bg-[#0264af] border-[#0264af] text-white shadow-md scale-105" 
                                   : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                                }`}
                             >
                                {day.label}
                             </button>
                          );
                       })}
                    </div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                       Data Fixa ou Manual (opcional)
                       <input
                         className={`${inputClassName} mt-1`}
                         placeholder="Ex: 2026-04-27"
                         value={form.availableDays}
                         onChange={(event) => setForm((f) => ({ ...f, availableDays: event.target.value }))}
                       />
                    </label>
                 </div>
              </div>

              <Button type="submit" disabled={busyAction === "create"} className="mt-2">
                {editingId ? "Atualizar Card" : "Publicar Card"}
              </Button>
              {editingId && (
                <Button 
                   type="button" 
                   variant="outline" 
                   className="mt-1"
                   onClick={handleCancelEdit}
                >
                   Cancelar Edição
                </Button>
              )}
            </form>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Cards Cadastrados</h3>
             {loading ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Carregando...
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                     <div className="h-32 bg-slate-100 relative group flex items-center justify-center">
                        {card.imageUrl ? (
                           <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                             <ImageIcon className="h-4 w-4"/> Sem imagem
                           </span>
                        )}
                        <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase font-bold text-white tracking-widest">{card.category}</span>
                     </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                           <div className="cursor-pointer group flex-1" onClick={() => handleStartEdit(card)}>
                             <p className="font-bold text-slate-900 leading-tight group-hover:text-[#0264af] transition-colors">{card.title}</p>
                             <p className="text-xs text-slate-500 mt-1">{card.status} · {card.points} pts</p>
                             {card.slots && (
                                <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase">Grade Ativa</p>
                             )}
                           </div>
                           <button
                             type="button"
                             onClick={() => void handleDelete(card.id)}
                             disabled={busyAction === `delete-${card.id}`}
                             className="text-slate-400 hover:text-red-500 transition-colors p-1"
                             title="Excluir card"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                      </div>
                  </div>
                ))}
                {cards.length === 0 && !loading && (
                   <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center col-span-2">
                      <p className="text-slate-500">Nenhum card cadastrado. Comece a criar os pacotes ao lado.</p>
                   </div>
                )}
              </div>
          </Card>
        </div>
      </div>
    </BackofficeShell>
  );
}
