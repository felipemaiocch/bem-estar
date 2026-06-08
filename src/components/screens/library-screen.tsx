"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Bookmark, Clock3, ExternalLink, FileText, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LibraryKindOption = {
  value: string;
  label: string;
  description: string;
};

type LibraryItem = {
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
  isReservable: boolean;
  isDigital: boolean;
  activeReservationsCount: number;
};

type LibraryReservation = {
  id: string;
  status: string;
  statusLabel: string;
  reservedAt: string;
  dueAt: string | null;
  item: LibraryItem;
};

type TopItem = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  reservationsCount: number;
};

export function LibraryScreen() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [myReservations, setMyReservations] = useState<LibraryReservation[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [kindOptions, setKindOptions] = useState<LibraryKindOption[]>([]);
  const [selectedKind, setSelectedKind] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  const physicalItems = useMemo(() => items.filter((item) => !item.isDigital), [items]);
  const repositoryItems = useMemo(() => items.filter((item) => item.isDigital || item.materialUrl), [items]);
  const featuredItems = physicalItems.slice(0, 8);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedKind !== "ALL") params.set("kind", selectedKind);
      if (selectedCategory !== "Todas") params.set("category", selectedCategory);

      const response = await fetch(`/api/user/library?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível carregar a biblioteca.");
        return;
      }

      setItems(data.items ?? []);
      setMyReservations(data.myReservations ?? []);
      setCategories(data.categories ?? []);
      setTopItems(data.topItems ?? []);
      setKindOptions(data.kindOptions ?? []);
    } catch {
      setFeedback("Falha de conexão ao carregar a biblioteca.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedKind]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadLibrary();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadLibrary]);

  async function reserveItem(itemId: string) {
    if (pendingItemId) return;

    setPendingItemId(itemId);
    setFeedback(null);

    try {
      const response = await fetch("/api/user/library/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setFeedback(data.error ?? "Não foi possível reservar.");
        return;
      }

      setFeedback(data.message ?? "Reserva criada.");
      await loadLibrary();
    } catch {
      setFeedback("Falha de conexão ao reservar.");
    } finally {
      setPendingItemId(null);
    }
  }

  return (
    <div className="animate-in fade-in space-y-6 pb-24 md:pb-8">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0264af]">Biblioteca</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Repositório + biblioteca</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Reserve livros físicos e consulte materiais de treinamento, capacitação e aprendizagem corporativa.
              </p>
            </div>
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busque por título, autor, categoria ou ISBN..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition-colors focus:border-[#0264af]"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-100 via-blue-50 to-amber-50 p-8 shadow-sm">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl font-black leading-tight text-slate-950">Descubra conteúdos que transformam</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Explore livros, apostilas, artigos, vídeos e materiais de educação corporativa da Dr.
              </p>
            </div>
            <BookOpen className="absolute -right-6 bottom-0 h-44 w-44 rotate-[-8deg] text-white/80" />
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedKind("ALL")}
              className={cn(
                "whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                selectedKind === "ALL" ? "bg-[#0264af] text-white shadow-md" : "border border-slate-200 bg-white text-slate-600",
              )}
            >
              Todos
            </button>
            {kindOptions.map((kind) => (
              <button
                key={kind.value}
                onClick={() => setSelectedKind(kind.value)}
                className={cn(
                  "whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                  selectedKind === kind.value ? "bg-[#0264af] text-white shadow-md" : "border border-slate-200 bg-white text-slate-600",
                )}
              >
                {kind.label}
              </button>
            ))}
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {["Todas", ...categories].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors",
                  selectedCategory === category ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200",
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {feedback ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
              {feedback}
            </div>
          ) : null}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">Destaques</h2>
              <span className="text-xs font-bold text-slate-400">{loading ? "Carregando..." : `${featuredItems.length} item(ns)`}</span>
            </div>
            {featuredItems.length === 0 ? (
              <Card className="p-8 text-center text-sm text-slate-500">Nenhum livro físico encontrado para os filtros atuais.</Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featuredItems.map((item) => (
                  <LibraryCard
                    key={item.id}
                    item={item}
                    pending={pendingItemId === item.id}
                    onReserve={reserveItem}
                    onOpen={setSelectedItem}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">Repositório de materiais</h2>
              <span className="text-xs font-bold text-slate-400">{repositoryItems.length} material(is)</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {repositoryItems.map((item) => (
                <Card key={item.id} className="flex items-start gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0264af]">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.kindLabel} · {item.category}</p>
                    {item.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p> : null}
                  </div>
                  {item.materialUrl ? (
                    <Button size="sm" variant="outline" onClick={() => window.open(item.materialUrl!, "_blank")}>
                      <ExternalLink size={14} />
                      Abrir
                    </Button>
                  ) : null}
                </Card>
              ))}
              {repositoryItems.length === 0 ? (
                <Card className="p-8 text-center text-sm text-slate-500 lg:col-span-2">Nenhum material digital encontrado.</Card>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h3 className="text-lg font-black text-slate-950">Minhas reservas</h3>
            <div className="mt-4 space-y-3">
              {myReservations.map((reservation) => (
                <div key={reservation.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-black text-slate-950">{reservation.item.title}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{reservation.item.mainAuthor ?? reservation.item.author ?? "Sem autor"}</p>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">{reservation.statusLabel}</span>
                    {reservation.dueAt ? (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock3 size={12} />
                        {new Date(reservation.dueAt).toLocaleDateString("pt-BR")}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
              {myReservations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Você ainda não possui reservas ativas.
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-black text-slate-950">Mais reservados</h3>
            <div className="mt-4 space-y-4">
              {topItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-black text-slate-400">{index + 1}</span>
                  <BookCover title={item.title} coverUrl={item.coverUrl} compact />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{item.title}</p>
                    <p className="truncate text-xs text-slate-500">{item.author ?? "Sem autor"}</p>
                    <p className="text-xs font-bold text-[#0264af]">{item.reservationsCount} reservas</p>
                  </div>
                </div>
              ))}
              {topItems.length === 0 ? <p className="text-sm text-slate-500">Sem reservas ainda.</p> : null}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0264af] shadow-sm">
                <Bookmark size={22} />
              </div>
              <div>
                <p className="font-black text-slate-950">Reserve seu livro</p>
                <p className="text-xs leading-5 text-slate-500">Faça a reserva online e retire na biblioteca da empresa.</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0264af]">{selectedItem.kindLabel}</p>
                <h2 className="text-xl font-black text-slate-950">{selectedItem.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid max-h-[78vh] gap-6 overflow-y-auto p-6 md:grid-cols-[260px_minmax(0,1fr)]">
              <BookCover title={selectedItem.title} coverUrl={selectedItem.coverUrl} />
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-black text-slate-950">Sobre este material</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {selectedItem.description ||
                      "Resumo ainda não cadastrado. O admin pode adicionar uma descrição para explicar o conteúdo, objetivo e indicação deste material."}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="SBN / ISBN" value={selectedItem.isbn ?? "Não informado"} />
                  <InfoRow label="Edição" value={selectedItem.edition ?? "Não informado"} />
                  <InfoRow label="Título original" value={selectedItem.originalTitle ?? "Não informado"} />
                  <InfoRow label="Título traduzido" value={selectedItem.translatedTitle ?? "Não informado"} />
                  <InfoRow label="Idioma original" value={selectedItem.originalLanguage ?? "Não informado"} />
                  <InfoRow label="Idioma da tradução" value={selectedItem.translationLanguage ?? "Não informado"} />
                  <InfoRow label="Autor principal" value={selectedItem.mainAuthor ?? selectedItem.author ?? "Não informado"} />
                  <InfoRow label="Autor entidade" value={selectedItem.entityAuthor ?? "Não informado"} />
                  <InfoRow label="Autor secundário" value={selectedItem.secondaryAuthor ?? "Não informado"} />
                  <InfoRow label="Entidade secundária" value={selectedItem.secondaryEntity ?? "Não informado"} />
                  <InfoRow
                    label="Publicação"
                    value={[
                      selectedItem.publicationPlace,
                      selectedItem.publisher,
                      selectedItem.year ? String(selectedItem.year) : null,
                    ].filter(Boolean).join(", ") || "Não informado"}
                  />
                  <InfoRow label="Descrição física" value={selectedItem.physicalDescription ?? "Não informado"} />
                  <InfoRow label="Série ou coleção" value={selectedItem.seriesCollection ?? "Não informado"} />
                  <InfoRow label="Categoria" value={selectedItem.category} />
                  <InfoRow label="Assunto" value={selectedItem.subject ?? "Não informado"} />
                  <InfoRow label="Local" value={selectedItem.location ?? "Biblioteca da empresa"} />
                  <InfoRow label="Disponibilidade" value={`${selectedItem.availableCopies}/${selectedItem.totalCopies} exemplar(es)`} />
                  <InfoRow label="Reservas ativas" value={String(selectedItem.activeReservationsCount)} />
                </div>
                <LongInfo label="Nota geral" value={selectedItem.generalNote} />
                <LongInfo label="Bibliografia" value={selectedItem.bibliography} />
                <LongInfo label="Sumário" value={selectedItem.summary} />
                <div className="flex flex-wrap gap-3">
                  {selectedItem.materialUrl ? (
                    <Button variant="outline" onClick={() => window.open(selectedItem.materialUrl!, "_blank")}>
                      <ExternalLink size={16} />
                      Abrir material
                    </Button>
                  ) : null}
                  <Button
                    disabled={!selectedItem.isReservable || selectedItem.availableCopies <= 0 || pendingItemId === selectedItem.id}
                    onClick={() => void reserveItem(selectedItem.id)}
                  >
                    <Bookmark size={16} />
                    {pendingItemId === selectedItem.id ? "Reservando..." : "Reservar livro"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LibraryCard({
  item,
  pending,
  onReserve,
  onOpen,
}: {
  item: LibraryItem;
  pending: boolean;
  onReserve: (itemId: string) => void;
  onOpen: (item: LibraryItem) => void;
}) {
  const available = item.availableCopies > 0 && item.isReservable;

  return (
    <Card className="overflow-hidden p-0">
      <button type="button" onClick={() => onOpen(item)} className="block w-full text-left">
        <BookCover title={item.title} coverUrl={item.coverUrl} />
      </button>
      <div className="space-y-3 p-4">
        <button type="button" onClick={() => onOpen(item)} className="block w-full text-left">
          <p className="line-clamp-2 font-black leading-tight text-slate-950">{item.title}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{item.mainAuthor ?? item.author ?? "Sem autor"}</p>
        </button>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-[#0264af]">{item.category}</span>
          <span className={cn("rounded-full px-2 py-1 text-[10px] font-black uppercase", available ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
            {available ? "Disponível" : "Reservado"}
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full border-[#0264af]/30 text-[#0264af]"
          disabled={!available || pending}
          onClick={() => onReserve(item.id)}
        >
          <Bookmark size={15} />
          {pending ? "Reservando..." : "Reservar"}
        </Button>
      </div>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function LongInfo({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{value}</p>
    </div>
  );
}

function BookCover({ title, coverUrl, compact = false }: { title: string; coverUrl: string | null; compact?: boolean }) {
  if (coverUrl) {
    return (
      <div className={cn("overflow-hidden bg-slate-100", compact ? "h-14 w-10 rounded-lg" : "aspect-[3/4] w-full")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center bg-gradient-to-br from-slate-900 to-[#0264af] p-3 text-center text-white", compact ? "h-14 w-10 rounded-lg" : "aspect-[3/4] w-full")}>
      {compact ? <BookOpen size={18} /> : <p className="text-lg font-black leading-tight">{title}</p>}
    </div>
  );
}
