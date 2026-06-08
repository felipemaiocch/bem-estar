"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, BookOpen, CheckCircle2, Clock3, Library, Plus, Search, Undo2 } from "lucide-react";

import { BackofficeShell } from "@/components/layout/backoffice-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KindOption = {
  value: string;
  label: string;
  description: string;
};

type AdminLibraryItem = {
  id: string;
  title: string;
  author: string | null;
  mainAuthor: string | null;
  entityAuthor: string | null;
  secondaryAuthor: string | null;
  secondaryEntity: string | null;
  originalTitle: string | null;
  translatedTitle: string | null;
  originalLanguage: string | null;
  translationLanguage: string | null;
  edition: string | null;
  publisher: string | null;
  publicationPlace: string | null;
  year: number | null;
  isbn: string | null;
  category: string;
  subject: string | null;
  kind: string;
  kindLabel: string;
  description: string | null;
  physicalDescription: string | null;
  seriesCollection: string | null;
  generalNote: string | null;
  bibliography: string | null;
  summary: string | null;
  coverUrl: string | null;
  materialUrl: string | null;
  location: string | null;
  totalCopies: number;
  availableCopies: number;
  isDigital: boolean;
  isReservable: boolean;
  status: string;
  reservationsCount: number;
};

type AdminReservation = {
  id: string;
  status: string;
  statusLabel: string;
  reservedAt: string;
  dueAt: string | null;
  item: AdminLibraryItem;
  user: {
    name: string;
    email: string;
    department: string | null;
  };
};

const defaultForm = {
  title: "",
  author: "",
  mainAuthor: "",
  entityAuthor: "",
  secondaryAuthor: "",
  secondaryEntity: "",
  originalTitle: "",
  translatedTitle: "",
  originalLanguage: "",
  translationLanguage: "",
  edition: "",
  publisher: "",
  publicationPlace: "",
  year: "",
  isbn: "",
  category: "",
  subject: "",
  kind: "BOOK",
  description: "",
  physicalDescription: "",
  seriesCollection: "",
  generalNote: "",
  bibliography: "",
  summary: "",
  coverUrl: "",
  materialUrl: "",
  location: "",
  totalCopies: "1",
  availableCopies: "1",
  isDigital: false,
  isReservable: true,
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-[#0264af] focus:bg-white";

export function AdminLibraryScreen() {
  const [items, setItems] = useState<AdminLibraryItem[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [kindOptions, setKindOptions] = useState<KindOption[]>([]);
  const [report, setReport] = useState({
    totalItems: 0,
    totalReservations: 0,
    activeReservations: 0,
    borrowed: 0,
    returned: 0,
  });
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (kindFilter !== "ALL") params.set("kind", kindFilter);

      const response = await fetch(`/api/admin/library?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível carregar a biblioteca.");
        return;
      }

      setItems(data.items ?? []);
      setReservations(data.reservations ?? []);
      setKindOptions(data.kindOptions ?? []);
      setReport(data.report ?? {
        totalItems: 0,
        totalReservations: 0,
        activeReservations: 0,
        borrowed: 0,
        returned: 0,
      });
    } catch {
      setFeedback("Falha de conexão ao carregar a biblioteca.");
    } finally {
      setLoading(false);
    }
  }, [kindFilter, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadLibrary();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadLibrary]);

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction) return;

    setBusyAction("create");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          author: form.author || undefined,
          mainAuthor: form.mainAuthor || undefined,
          entityAuthor: form.entityAuthor || undefined,
          secondaryAuthor: form.secondaryAuthor || undefined,
          secondaryEntity: form.secondaryEntity || undefined,
          originalTitle: form.originalTitle || undefined,
          translatedTitle: form.translatedTitle || undefined,
          originalLanguage: form.originalLanguage || undefined,
          translationLanguage: form.translationLanguage || undefined,
          edition: form.edition || undefined,
          publisher: form.publisher || undefined,
          publicationPlace: form.publicationPlace || undefined,
          year: form.year ? Number(form.year) : undefined,
          isbn: form.isbn || undefined,
          category: form.category,
          subject: form.subject || undefined,
          kind: form.kind,
          description: form.description || undefined,
          physicalDescription: form.physicalDescription || undefined,
          seriesCollection: form.seriesCollection || undefined,
          generalNote: form.generalNote || undefined,
          bibliography: form.bibliography || undefined,
          summary: form.summary || undefined,
          coverUrl: form.coverUrl || undefined,
          materialUrl: form.materialUrl || undefined,
          location: form.location || undefined,
          totalCopies: Number(form.totalCopies || 0),
          availableCopies: Number(form.availableCopies || 0),
          isDigital: form.isDigital,
          isReservable: form.isReservable,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível catalogar material.");
        return;
      }

      setFeedback("Material catalogado com sucesso.");
      setForm(defaultForm);
      await loadLibrary();
    } catch {
      setFeedback("Falha de conexão ao catalogar material.");
    } finally {
      setBusyAction(null);
    }
  }

  async function archiveItem(itemId: string) {
    setBusyAction(itemId);

    try {
      await fetch(`/api/admin/library/items/${itemId}`, { method: "DELETE" });
      await loadLibrary();
    } finally {
      setBusyAction(null);
    }
  }

  async function updateReservation(reservationId: string, status: string) {
    setBusyAction(reservationId);

    try {
      const response = await fetch(`/api/admin/library/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível atualizar reserva.");
        return;
      }

      await loadLibrary();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <BackofficeShell
      badge="Biblioteca"
      title="Biblioteca e repositório"
      description="Catálogo de livros físicos, materiais de capacitação, treinamentos e reservas."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Materiais", value: report.totalItems, icon: Library, color: "text-blue-600" },
            { label: "Reservas", value: report.totalReservations, icon: BookOpen, color: "text-purple-600" },
            { label: "Retirados", value: report.borrowed, icon: Clock3, color: "text-amber-600" },
            { label: "Devolvidos", value: report.returned, icon: CheckCircle2, color: "text-emerald-600" },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="p-5">
                <Icon className={metric.color} size={24} />
                <p className="mt-4 text-3xl font-black text-slate-950">{metric.value}</p>
                <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
              </Card>
            );
          })}
        </div>

        {feedback ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            {feedback}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Plus className="text-[#0264af]" size={20} />
              <h2 className="text-lg font-black text-slate-950">Catalogar material</h2>
            </div>
            <form className="space-y-3" onSubmit={(event) => void createItem(event)}>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Identificação</p>
              <input className={inputClassName} placeholder="Título para exibição no card" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="SBN / ISBN" value={form.isbn} onChange={(event) => setForm((current) => ({ ...current, isbn: event.target.value }))} />
                <input className={inputClassName} placeholder="Edição" value={form.edition} onChange={(event) => setForm((current) => ({ ...current, edition: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Título original" value={form.originalTitle} onChange={(event) => setForm((current) => ({ ...current, originalTitle: event.target.value }))} />
                <input className={inputClassName} placeholder="Título traduzido" value={form.translatedTitle} onChange={(event) => setForm((current) => ({ ...current, translatedTitle: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Idioma original" value={form.originalLanguage} onChange={(event) => setForm((current) => ({ ...current, originalLanguage: event.target.value }))} />
                <input className={inputClassName} placeholder="Idioma da tradução" value={form.translationLanguage} onChange={(event) => setForm((current) => ({ ...current, translationLanguage: event.target.value }))} />
              </div>

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Autoria</p>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Autor principal" value={form.mainAuthor} onChange={(event) => setForm((current) => ({ ...current, mainAuthor: event.target.value, author: event.target.value || current.author }))} />
                <input className={inputClassName} placeholder="Autor entidade" value={form.entityAuthor} onChange={(event) => setForm((current) => ({ ...current, entityAuthor: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Autor secundário" value={form.secondaryAuthor} onChange={(event) => setForm((current) => ({ ...current, secondaryAuthor: event.target.value }))} />
                <input className={inputClassName} placeholder="Entidade secundária" value={form.secondaryEntity} onChange={(event) => setForm((current) => ({ ...current, secondaryEntity: event.target.value }))} />
              </div>

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Publicação</p>
              <div className="grid grid-cols-3 gap-3">
                <input className={inputClassName} placeholder="Local" value={form.publicationPlace} onChange={(event) => setForm((current) => ({ ...current, publicationPlace: event.target.value }))} />
                <input className={inputClassName} placeholder="Editora" value={form.publisher} onChange={(event) => setForm((current) => ({ ...current, publisher: event.target.value }))} />
                <input className={inputClassName} placeholder="Ano" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value.replace(/\D/g, "").slice(0, 4) }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select className={inputClassName} value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}>
                  {kindOptions.map((kind) => (
                    <option key={kind.value} value={kind.value}>{kind.label}</option>
                  ))}
                </select>
                <input className={inputClassName} placeholder="Categoria" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required />
              </div>
              <input className={inputClassName} placeholder="Assunto" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Descrição física e notas</p>
              <input className={inputClassName} placeholder="Descrição física (paginação, ilustração, dimensão)" value={form.physicalDescription} onChange={(event) => setForm((current) => ({ ...current, physicalDescription: event.target.value }))} />
              <input className={inputClassName} placeholder="Série ou Coleção" value={form.seriesCollection} onChange={(event) => setForm((current) => ({ ...current, seriesCollection: event.target.value }))} />
              <textarea className={cn(inputClassName, "min-h-20 resize-none")} placeholder="Nota geral" value={form.generalNote} onChange={(event) => setForm((current) => ({ ...current, generalNote: event.target.value }))} />
              <textarea className={cn(inputClassName, "min-h-20 resize-none")} placeholder="Bibliografia" value={form.bibliography} onChange={(event) => setForm((current) => ({ ...current, bibliography: event.target.value }))} />

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Conteúdo</p>
              <textarea className={cn(inputClassName, "min-h-24 resize-none")} placeholder="Sumário" value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
              <textarea className={cn(inputClassName, "min-h-24 resize-none")} placeholder="Resumo" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />

              <p className="pt-2 text-xs font-black uppercase tracking-wider text-slate-400">Capa, link e controle físico</p>
              <input className={inputClassName} placeholder="URL da capa" value={form.coverUrl} onChange={(event) => setForm((current) => ({ ...current, coverUrl: event.target.value }))} />
              <input className={inputClassName} placeholder="URL do arquivo/link do repositório" value={form.materialUrl} onChange={(event) => setForm((current) => ({ ...current, materialUrl: event.target.value }))} />
              <input className={inputClassName} placeholder="Local físico / prateleira" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClassName} placeholder="Total" value={form.totalCopies} onChange={(event) => setForm((current) => ({ ...current, totalCopies: event.target.value.replace(/\D/g, "") }))} />
                <input className={inputClassName} placeholder="Disponíveis" value={form.availableCopies} onChange={(event) => setForm((current) => ({ ...current, availableCopies: event.target.value.replace(/\D/g, "") }))} />
              </div>
              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" checked={form.isDigital} onChange={(event) => setForm((current) => ({ ...current, isDigital: event.target.checked, isReservable: event.target.checked ? false : current.isReservable }))} />
                Material digital/repositório
              </label>
              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" checked={form.isReservable} disabled={form.isDigital} onChange={(event) => setForm((current) => ({ ...current, isReservable: event.target.checked }))} />
                Permitir reserva física
              </label>
              <Button type="submit" className="w-full" disabled={busyAction === "create"}>
                {busyAction === "create" ? "Salvando..." : "Catalogar"}
              </Button>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-lg font-black text-slate-950">Acervo catalogado</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input className={cn(inputClassName, "pl-9")} placeholder="Buscar" value={search} onChange={(event) => setSearch(event.target.value)} />
                  </div>
                  <select className={inputClassName} value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}>
                    <option value="ALL">Todos</option>
                    {kindOptions.map((kind) => (
                      <option key={kind.value} value={kind.value}>{kind.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-950">{item.title}</p>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">{item.kindLabel}</span>
                        {item.isDigital ? <span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-black uppercase text-purple-700">Repositório</span> : null}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {item.author ?? "Sem autor"} · {item.category} · {item.availableCopies}/{item.totalCopies} disponível(is) · {item.reservationsCount} reserva(s)
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled={busyAction === item.id} onClick={() => void archiveItem(item.id)}>
                      Arquivar
                    </Button>
                  </div>
                ))}
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    {loading ? "Carregando..." : "Nenhum material catalogado ainda."}
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="text-[#0264af]" size={20} />
                <h2 className="text-lg font-black text-slate-950">Reservas e devoluções</h2>
              </div>
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-black text-slate-950">{reservation.item.title}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {reservation.user.name} · {reservation.user.email} · {reservation.statusLabel}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={busyAction === reservation.id} onClick={() => void updateReservation(reservation.id, "BORROWED")}>
                          <Clock3 size={14} />
                          Retirou
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyAction === reservation.id} onClick={() => void updateReservation(reservation.id, "RETURNED")}>
                          <Undo2 size={14} />
                          Devolveu
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyAction === reservation.id} onClick={() => void updateReservation(reservation.id, "CANCELED")}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {reservations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    Nenhuma reserva registrada ainda.
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </BackofficeShell>
  );
}
