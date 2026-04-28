"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock3,
  Heart,
  MapPin,
  Megaphone,
  MessageCircleMore,
  SendHorizontal,
  Star,
  Trophy,
  Medal,
  User,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const baseEngagementCards = [
  { title: "Saúde e bem-estar", cta: "Continuar", href: "/usuario/saude-bem-estar" },
  { title: "Cultura", cta: "Ver ingressos", href: "/usuario/cultura" },
  { title: "Agenda dr", cta: "Acessar link", href: "/usuario/agenda-dr" },
];

type FeedPost = {
  id: string;
  professional: string;
  professionalRole: string;
  activity: string;
  time: string;
  location: string;
  image: string;
  caption: string;
  likes: number;
  likedByUser: boolean;
  comments: { id: string; author: string; text: string }[];
};

type UserBooking = {
  id: string;
  startsAtIso: string;
  endsAtIso: string;
  specialist: string;
  specialty: string;
  focus: string;
  mode: "online" | "presencial";
  location: string;
  meetingUrl?: string;
  status: "SCHEDULED" | "CONFIRMED" | "WAITLIST" | "COMPLETED" | "MISSED" | "CANCELED";
  waitlistPosition?: number | null;
};

const fallbackFeedImage =
  "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1400&q=80";
const feedPageSize = 4;

function formatDateLabel(valueIso: string) {
  const value = new Date(valueIso);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}


export function UserDashboardScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [feedCollapsed, setFeedCollapsed] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedNextOffset, setFeedNextOffset] = useState<number | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [checkInMood, setCheckInMood] = useState("Equilibrado");
  const [checkInEnergy, setCheckInEnergy] = useState(72);
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);
  const feedSentinelRef = useRef<HTMLDivElement | null>(null);

  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [summaryLoaded, setSummaryLoaded] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/user/dashboard-summary", { cache: "no-store" });
      const data = await response.json();
      if (data.ok) {
        setDashboardSummary(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSummaryLoaded(true);
    }
  }, []);

  const [globalAlert, setGlobalAlert] = useState<string | null>(null);

  const loadGlobalAlert = useCallback(async () => {
    try {
      const resp = await fetch("/api/user/global-alert", { cache: "no-store" });
      const data = await resp.json();
      if (data.ok && data.alert) {
        setGlobalAlert(data.alert.message);
      }
    } catch {}
  }, []);



  const nextSession = bookings[0] ?? null;
  const visiblePosts = useMemo(
    () => (feedCollapsed ? posts.slice(0, 1) : posts),
    [feedCollapsed, posts],
  );

  const loadFeedPage = useCallback(async (offset: number, append: boolean) => {
    setFeedError(null);

    if (append) {
      setFeedLoadingMore(true);
    } else {
      setFeedLoading(true);
    }

    try {
      const params = new URLSearchParams({
        limit: String(feedPageSize),
        offset: String(offset),
      });
      const response = await fetch(`/api/user/feed?${params.toString()}`, {
        cache: "no-store",
      });
      const raw = await response.text();
      const data = (raw ? JSON.parse(raw) : {}) as {
        ok?: boolean;
        error?: string;
        posts?: FeedPost[];
        hasMore?: boolean;
        nextOffset?: number | null;
      };

      if (!response.ok || !data.ok) {
        if (!append) {
          setPosts([]);
          setFeedHasMore(false);
          setFeedNextOffset(null);
        }
        setFeedError(data.error ?? "Não foi possível carregar o feed.");
        return;
      }

      const incomingPosts = data.posts ?? [];

      setPosts((current) => {
        if (!append) {
          return incomingPosts;
        }

        const seenIds = new Set(current.map((post) => post.id));
        const merged = [...current];

        for (const post of incomingPosts) {
          if (!seenIds.has(post.id)) {
            merged.push(post);
            seenIds.add(post.id);
          }
        }

        return merged;
      });
      setFeedHasMore(Boolean(data.hasMore));
      setFeedNextOffset(
        typeof data.nextOffset === "number" ? data.nextOffset : null,
      );
    } catch {
      if (!append) {
        setPosts([]);
        setFeedHasMore(false);
        setFeedNextOffset(null);
      }
      setFeedError("Falha de conexão ao carregar o feed.");
    } finally {
      if (append) {
        setFeedLoadingMore(false);
      } else {
        setFeedLoading(false);
      }
    }
  }, []);

  const loadFeed = useCallback(async () => {
    await loadFeedPage(0, false);
  }, [loadFeedPage]);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/user/agenda/bookings?onlyUpcoming=true", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        bookings?: UserBooking[];
      };

      if (!response.ok || !data.ok) {
        setBookings([]);
        setBookingError(data.error ?? "Não foi possível carregar próxima sessão.");
        return;
      }

      setBookings(data.bookings ?? []);
    } catch {
      setBookings([]);
      setBookingError("Falha de conexão ao carregar próxima sessão.");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadFeed(), loadBookings(), loadSummary(), loadGlobalAlert()]);
  }, [loadFeed, loadBookings, loadSummary, loadGlobalAlert]);

  useEffect(() => {
    if (feedCollapsed || !feedHasMore || feedNextOffset === null || feedLoading || feedLoadingMore) {
      return;
    }

    const node = feedSentinelRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting) {
          return;
        }

        void loadFeedPage(feedNextOffset, true);
      },
      {
        root: null,
        rootMargin: "220px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [feedCollapsed, feedHasMore, feedNextOffset, feedLoading, feedLoadingMore, loadFeedPage]);

  async function saveQuickCheckIn() {
    if (checkInSaving) {
      return;
    }

    setCheckInSaving(true);
    setCheckInFeedback(null);

    try {
      const response = await fetch("/api/user/progress/wellness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moodLabel: checkInMood,
          habitsScore: checkInEnergy,
          notes: `Check-in rápido Home · humor: ${checkInMood} · energia: ${checkInEnergy}%`,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setCheckInFeedback(data.error ?? "Não foi possível salvar check-in.");
        return;
      }

      setCheckInFeedback("Check-in salvo com sucesso.");
    } catch {
      setCheckInFeedback("Falha de conexão ao salvar check-in.");
    } finally {
      setCheckInSaving(false);
    }
  }

  async function toggleLike(postId: string) {
    try {
      const response = await fetch(`/api/user/feed/posts/${postId}/like`, {
        method: "POST",
      });
      const raw = await response.text();
      const data = (raw ? JSON.parse(raw) : {}) as {
        ok?: boolean;
        error?: string;
        post?: FeedPost;
      };

      if (!response.ok || !data.ok || !data.post) {
        setFeedError(data.error ?? "Não foi possível curtir o post.");
        return;
      }

      setPosts((current) =>
        current.map((post) => (post.id === postId ? data.post! : post)),
      );
    } catch {
      setFeedError("Falha de conexão ao curtir o post.");
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    const draft = commentDrafts[postId]?.trim();

    if (!draft) {
      return;
    }

    try {
      const response = await fetch(`/api/user/feed/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: draft }),
      });
      const raw = await response.text();
      const data = (raw ? JSON.parse(raw) : {}) as {
        ok?: boolean;
        error?: string;
        post?: FeedPost;
      };

      if (!response.ok || !data.ok || !data.post) {
        setFeedError(data.error ?? "Não foi possível comentar no post.");
        return;
      }

      setPosts((current) =>
        current.map((post) => (post.id === postId ? data.post! : post)),
      );
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    } catch {
      setFeedError("Falha de conexão ao comentar no post.");
    }
  }

  return (
    <div className="relative animate-in fade-in flex flex-col gap-6 pb-24 md:pb-8">
      <section>
        <div className="mb-4 mt-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Para você</h2>
        </div>

        {globalAlert && (
          <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
            <Card className="border-blue-100 bg-blue-50 p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0264af] text-white">
                  <Megaphone size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0264af]">Comunicado Importante</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700 leading-relaxed">
                    {globalAlert}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {baseEngagementCards.map((event) => {
            const colorMap: Record<string, string> = {
              "Saúde e bem-estar": "bg-emerald-500",
              Cultura: "bg-indigo-500",
              "Agenda dr": "bg-gradient-to-br from-[#0264af] via-[#0b75c7] to-[#fd3a83]",
            };

            const iconMap: Record<string, ReactNode> = {
              "Saúde e bem-estar": <Activity className="text-white" />,
              Cultura: <Star className="text-white" />,
              "Agenda dr": <Users className="text-white" />,
            };

            return (
              <Link
                key={event.title}
                href={event.href}
                className="group relative w-72 shrink-0 snap-center overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md md:w-auto"
              >
                <div className={`flex h-36 flex-col justify-between p-5 md:h-44 ${colorMap[event.title] ?? "bg-blue-500"}`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-sm backdrop-blur-sm">
                    {iconMap[event.title]}
                  </div>
                  <div>
                    <span className="mb-2 inline-flex rounded-full border border-white/20 bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                      {event.title}
                    </span>
                    <h3 className="text-lg font-bold leading-tight text-white">{event.title}</h3>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white p-4">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <Clock3 size={14} />
                    {event.title === "Saúde e bem-estar" ?
                      (!summaryLoaded ? "Carregando..." : `${dashboardSummary?.metrics?.healthCount ?? 0} cuidados disponíveis`) :
                     event.title === "Cultura" ?
                      (!summaryLoaded ? "Carregando..." : `${dashboardSummary?.metrics?.cultureCount ?? 0} eventos`) :
                      (!summaryLoaded ? "Carregando..." : `${dashboardSummary?.metrics?.agendaCount ?? 0} eventos`)}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-bold text-[#0264af] transition-transform group-hover:translate-x-1">
                    {event.cta}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="border-blue-100 bg-gradient-to-r from-white to-blue-50/40 p-6 md:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                  O que tenho agora?
                </h3>
                <p className="text-2xl font-black text-gray-900">
                  {bookingsLoading ? "Carregando próxima sessão..." : nextSession ? nextSession.specialty : "Sem sessão agendada"}
                </p>
              </div>
              <span className="rounded-full bg-[#0264af]/10 px-3 py-1.5 text-sm font-semibold text-[#0264af]">
                {nextSession ? "Próxima" : "Livre"}
              </span>
            </div>

            {nextSession ? (
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0264af]/10 text-[#0264af] shadow-inner">
                    <User size={28} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{nextSession.specialist}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                      <Clock3 size={14} />
                      {formatDateLabel(nextSession.startsAtIso)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={14} />
                      {nextSession.mode === "online" ? "Online" : "Presencial"} · {nextSession.location}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  {nextSession.mode === "online" && nextSession.meetingUrl ? (
                    <a href={nextSession.meetingUrl} target="_blank" rel="noreferrer">
                      <Button className="w-full sm:w-auto">Entrar na sala</Button>
                    </a>
                  ) : (
                    <Link href="/usuario/agenda">
                      <Button className="w-full sm:w-auto">Ver detalhes</Button>
                    </Link>
                  )}
                  <Link href="/usuario/agenda">
                    <Button variant="secondary" className="w-full sm:w-auto">Reagendar</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Abra a agenda para reservar seu próximo atendimento.
              </div>
            )}

            {bookingError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {bookingError}
              </div>
            ) : null}
          </Card>

          <div className="grid gap-4 lg:grid-cols-1">
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#0264af]" />
                <p className="text-sm font-semibold text-slate-700">Como estou hoje?</p>
              </div>
              <p className="text-sm text-slate-500">Check-in rápido de humor e energia.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: "Energizado", emoji: "🤩" },
                  { label: "Equilibrado", emoji: "😌" },
                  { label: "Sob pressão", emoji: "🤯" },
                  { label: "Cansado", emoji: "🥱" },
                ].map((moodInfo) => (
                  <button
                    key={moodInfo.label}
                    onClick={() => setCheckInMood(moodInfo.label)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-transform hover:scale-105",
                      checkInMood === moodInfo.label
                        ? "bg-[#0264af] text-white shadow-md ring-2 ring-[#0264af]/30"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                  >
                    <span className="text-xl">{moodInfo.emoji}</span>
                    <span>{moodInfo.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Energia</span>
                  <span>{checkInEnergy}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={checkInEnergy}
                  onChange={(event) => setCheckInEnergy(Number(event.target.value))}
                  className="w-full"
                />
              </div>

              {checkInFeedback ? (
                <p className="mt-3 text-xs text-slate-600">{checkInFeedback}</p>
              ) : null}

              <Button
                className="mt-4 w-full"
                onClick={() => void saveQuickCheckIn()}
                disabled={checkInSaving}
              >
                {checkInSaving ? "Salvando..." : "Salvar check-in"}
              </Button>
            </Card>


          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Link href="/usuario/agenda">
            <Button size="lg" className="h-14 w-full text-base shadow-xl shadow-blue-500/20">
              Agendar atividade
            </Button>
          </Link>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Ranking rápido</h3>
            <div className="space-y-3">
              {dashboardSummary?.leaderboard?.slice(0, 3).map((user: any, index: number) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;

                return (
                  <div
                    key={user.name}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-3 transition-all",
                      isFirst ? "bg-amber-50 ring-1 ring-amber-200" : 
                      isSecond ? "bg-slate-50 ring-1 ring-slate-200" :
                      isThird ? "bg-orange-50/50 ring-1 ring-orange-200/50" : "bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full shadow-sm",
                        isFirst ? "bg-amber-100 text-amber-600" :
                        isSecond ? "bg-slate-200 text-slate-600" :
                        isThird ? "bg-orange-100 text-orange-600" : "bg-gray-200 text-gray-500"
                      )}>
                        {isFirst ? <Trophy size={20} /> : 
                         (isSecond || isThird) ? <Medal size={20} /> : 
                         <span className="text-xs font-bold">#{index + 1}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{user.area}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-black",
                        isFirst ? "text-amber-600" : "text-[#0264af]"
                      )}>
                        {user.points} <span className="text-[10px] font-bold uppercase opacity-70">pts</span>
                      </p>
                    </div>
                  </div>
                );
              })}
              {!summaryLoaded && <p className="text-xs text-gray-500 text-center">Carregando...</p>}
              {summaryLoaded && (!dashboardSummary?.leaderboard?.length) && <p className="text-xs text-gray-500 text-center">Nenhum usuário ranqueado ainda.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Próximos eventos</h3>
            </div>
            <div className="space-y-4">
              {dashboardSummary?.upcomingEvents?.map((event: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-[#0264af]">
                    <span className="text-xs font-bold uppercase">
                      {new Date(event.startsAtIso).toLocaleString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="text-lg font-black">
                      {new Date(event.startsAtIso).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold leading-snug text-gray-900">{event.title}</p>
                    {event.specialist && (
                      <p className="text-[10px] font-bold text-[#0264af] uppercase tracking-wide truncate">
                        Por: {event.specialist}
                      </p>
                    )}
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <Clock3 size={12} />
                      {event.isCard 
                        ? (event.cardDisplayDate || "Recorrente")
                        : new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.startsAtIso))} · {event.location}
                    </p>
                  </div>
                </div>
              ))}
              {!summaryLoaded && <p className="text-xs text-gray-500 text-center">Carregando...</p>}
              {summaryLoaded && (!dashboardSummary?.upcomingEvents?.length) && <p className="text-xs text-gray-500 text-center">Nenhum evento próximo cadastrado.</p>}
            </div>
          </Card>
        </div>
      </section>

      <section>
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <SectionHeading
              eyebrow="Momentos das atividades"
              title="Feed social da equipe"
              description="Agora em coluna secundária: expanda quando quiser foco em comunidade."
            />
            <Button
              variant="secondary"
              onClick={() => setFeedCollapsed((current) => !current)}
            >
              {feedCollapsed ? "Expandir feed" : "Recolher feed"}
              {feedCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>

          <div className="px-5 py-4 max-h-[1000px] overflow-y-auto no-scrollbar">
            {feedError ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {feedError}
              </div>
            ) : null}

            {feedLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                    <div className="h-4 w-48 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-64 rounded bg-slate-200" />
                    <div className="mt-3 h-24 w-full rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : null}

            {!feedLoading && posts.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                O feed ainda não tem publicações. Assim que os profissionais postarem, aparece aqui.
              </div>
            ) : null}

            {!feedLoading && posts.length > 0 ? (
              <div className="space-y-4">
                {visiblePosts.map((post) => (
                  <div key={post.id} className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{post.activity}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {post.professional} · {post.time} · {post.location}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">{post.caption}</p>

                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
                      {feedCollapsed ? (
                        <Image
                          src={post.image || fallbackFeedImage}
                          alt={post.activity}
                          width={1400}
                          height={860}
                          sizes="(min-width: 1280px) 760px, (min-width: 1024px) 640px, 100vw"
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="flex max-h-[520px] items-center justify-center">
                          <Image
                            src={post.image || fallbackFeedImage}
                            alt={post.activity}
                            width={1400}
                            height={860}
                            sizes="(min-width: 1280px) 760px, (min-width: 1024px) 640px, 100vw"
                            className="h-auto max-h-[520px] w-auto max-w-full object-contain"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleLike(post.id)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${post.likedByUser
                          ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
                          : "bg-white text-slate-700 ring-1 ring-slate-200"
                          }`}
                      >
                        <Heart
                          size={14}
                          className={post.likedByUser ? "fill-rose-500 text-rose-500" : ""}
                        />
                        {post.likes} curtidas
                      </button>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        <MessageCircleMore size={14} />
                        {post.comments.length} comentários
                      </span>
                    </div>

                    {!feedCollapsed ? (
                      <>
                        <div className="mt-3 space-y-2 rounded-2xl bg-white p-3">
                          {post.comments.slice(-3).map((comment) => (
                            <div key={comment.id} className="text-xs leading-5 text-slate-600">
                              <span className="font-semibold text-slate-900">{comment.author}</span> {comment.text}
                            </div>
                          ))}
                        </div>

                        <form
                          className="mt-3 flex flex-col gap-2 sm:flex-row"
                          onSubmit={(event) => void submitComment(event, post.id)}
                        >
                          <input
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(event) =>
                              setCommentDrafts((current) => ({
                                ...current,
                                [post.id]: event.target.value,
                              }))
                            }
                            placeholder="Escreva um comentário..."
                            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                          />
                          <Button type="submit" className="sm:w-auto">
                            <SendHorizontal size={14} />
                            Comentar
                          </Button>
                        </form>
                      </>
                    ) : null}
                  </div>
                ))}

                {!feedCollapsed && feedLoadingMore ? (
                  <div className="mx-auto w-full max-w-3xl animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="h-4 w-40 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-56 rounded bg-slate-200" />
                    <div className="mt-3 h-48 w-full rounded bg-slate-200" />
                  </div>
                ) : null}

                {!feedCollapsed && feedHasMore ? (
                  <div ref={feedSentinelRef} className="mx-auto h-10 w-full max-w-3xl" />
                ) : null}

                {!feedCollapsed && !feedHasMore && posts.length >= feedPageSize ? (
                  <p className="mx-auto w-full max-w-3xl text-center text-xs font-medium text-slate-500">
                    Você chegou ao fim do feed.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
