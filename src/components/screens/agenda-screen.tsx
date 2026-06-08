"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Lock, MapPin, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { agendaFilters } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthGridDays(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      key: toDateKey(date),
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      isCurrentMonth: date.getMonth() === month,
      isToday: toDateKey(date) === toDateKey(new Date()),
    };
  });
}

type AgendaSlot = {
  slotId: string;
  time: string;
  specialist: string;
  specialty: string;
  focus: string;
  mode: "online" | "presencial";
  location: string;
  status: "available" | "occupied" | "waitlist";
  mineStatus?: "booked" | "waitlist";
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

type MonthAgendaDay = {
  day: number;
  dateKey: string;
  slotsCount: number;
  availableSlotsCount: number;
  eventsCount: number;
  cardsCount: number;
  myBookingsCount: number;
  labels: Array<{
    title: string;
    kind: "event" | "card";
  }>;
};

function bookingStatusLabel(status: UserBooking["status"]) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmado";
    case "WAITLIST":
      return "Fila de espera";
    case "COMPLETED":
      return "Concluído";
    case "MISSED":
      return "Falta";
    case "CANCELED":
      return "Cancelado";
    default:
      return "Agendado";
  }
}

export function AgendaScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("Todos");

  const [baseDate, setBaseDate] = useState(() => new Date());
  const monthGridDays = useMemo(() => getMonthGridDays(baseDate), [baseDate]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return {
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    };
  });

  const [slots, setSlots] = useState<AgendaSlot[]>([]);
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const [dayCards, setDayCards] = useState<any[]>([]);
  const [monthDays, setMonthDays] = useState<MonthAgendaDay[]>([]);
  const [myBookings, setMyBookings] = useState<UserBooking[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        day: String(selectedDate.day),
        month: String(selectedDate.month),
        year: String(selectedDate.year),
        filter: selectedFilter,
      });
      const response = await fetch(`/api/user/agenda/slots?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        slots?: AgendaSlot[];
        events?: any[];
        cards?: any[];
      };

      if (!response.ok || !data.ok) {
        setSlots([]);
        setDayEvents([]);
        setDayCards([]);
        setErrorMessage(data.error ?? "Não foi possível carregar os horários.");
        return;
      }

      setSlots(data.slots ?? []);
      setDayEvents(data.events ?? []);
      setDayCards(data.cards ?? []);
    } catch {
      setSlots([]);
      setDayEvents([]);
      setDayCards([]);
      setErrorMessage("Falha de conexão ao carregar a agenda.");
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedFilter]);

  const loadMonthDays = useCallback(async () => {
    setLoadingMonth(true);

    try {
      const params = new URLSearchParams({
        month: String(baseDate.getMonth() + 1),
        year: String(baseDate.getFullYear()),
        filter: selectedFilter,
      });
      const response = await fetch(`/api/user/agenda/month?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        days?: MonthAgendaDay[];
      };

      if (!response.ok || !data.ok) {
        setMonthDays([]);
        setErrorMessage((current) => current ?? data.error ?? "Não foi possível carregar o mês.");
        return;
      }

      setMonthDays(data.days ?? []);
    } catch {
      setMonthDays([]);
      setErrorMessage((current) => current ?? "Falha de conexão ao carregar o mês.");
    } finally {
      setLoadingMonth(false);
    }
  }, [baseDate, selectedFilter]);

  const loadMyBookings = useCallback(async () => {
    setLoadingBookings(true);

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
        setMyBookings([]);
        setErrorMessage((current) => current ?? data.error ?? "Não foi possível carregar suas sessões.");
        return;
      }

      setMyBookings(data.bookings ?? []);
    } catch {
      setMyBookings([]);
      setErrorMessage((current) => current ?? "Falha de conexão ao carregar suas sessões.");
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    void loadMonthDays();
  }, [loadMonthDays]);

  useEffect(() => {
    void loadMyBookings();
  }, [loadMyBookings]);

  const myBookingsForDay = useMemo(() => {
    return myBookings.filter(b => {
      const d = new Date(b.startsAtIso);
      return d.getDate() === selectedDate.day &&
             (d.getMonth() + 1) === selectedDate.month &&
             d.getFullYear() === selectedDate.year;
    });
  }, [myBookings, selectedDate]);

  const filteredSlots = useMemo(() => slots, [slots]);
  const monthDayMap = useMemo(() => {
    return new Map(monthDays.map((day) => [day.dateKey, day]));
  }, [monthDays]);

  async function handleBookingAction(slot: AgendaSlot) {
    if (pendingSlotId) {
      return;
    }

    setPendingSlotId(slot.slotId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const action =
        slot.status === "available" ? "reserve" : ("waitlist" as const);

      const response = await fetch("/api/user/agenda/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: slot.slotId,
          action,
          day: selectedDate.day,
          month: selectedDate.month,
          year: selectedDate.year,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        setErrorMessage(data.error ?? "Não foi possível concluir a ação.");
        return;
      }

      setSuccessMessage(data.message ?? "Ação concluída com sucesso.");
      await Promise.all([loadSlots(), loadMyBookings(), loadMonthDays()]);
      router.refresh();
    } catch {
      setErrorMessage("Falha de conexão ao concluir a ação.");
    } finally {
      setPendingSlotId(null);
    }
  }

  const handleParticipate = async (event: any) => {
    const response = await fetch("/api/user/events/participate", {
      method: "POST",
      body: JSON.stringify({ eventId: event.id }),
    });
    if (response.ok) await Promise.all([loadSlots(), loadMonthDays()]);
  };

  const handleCardAction = (card: any) => {
    if (card.category) {
      router.push(`/usuario/${card.category}`);
    }
  };

  const monthName = baseDate.toLocaleString("pt-BR", { month: "long" });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="animate-in fade-in flex flex-col gap-6 pb-24 md:pb-8">
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
          <p className="mt-1 text-sm text-gray-500">
            Escolha um horário, entre em fila e sincronize com Google/Outlook.
          </p>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {agendaFilters.map((filter, index) => (
          <button
            key={filter.label}
            onClick={() => setSelectedFilter(filter.label)}
            className={cn(
              "whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
              filter.label === selectedFilter || (index === 0 && selectedFilter === "Todos")
                ? "bg-gray-900 text-white shadow-md"
                : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-blue-600">
                <CalendarDays size={15} />
                Calendário mensal
              </div>
              <h3 className="mt-2 text-2xl font-black text-slate-950">
                {capitalizedMonth} de {baseDate.getFullYear()}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newDate = new Date(baseDate);
                  newDate.setMonth(baseDate.getMonth() - 1);
                  setBaseDate(newDate);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Mes anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setBaseDate(today);
                  setSelectedDate({
                    day: today.getDate(),
                    month: today.getMonth() + 1,
                    year: today.getFullYear(),
                  });
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  const newDate = new Date(baseDate);
                  newDate.setMonth(baseDate.getMonth() + 1);
                  setBaseDate(newDate);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Proximo mes"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-800 text-center text-[11px] font-black uppercase tracking-widest text-white">
            {["Dom.", "Seg.", "Ter.", "Qua.", "Qui.", "Sex.", "Sáb."].map((day) => (
              <div key={day} className="border-r border-white/10 px-2 py-3 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthGridDays.map((day) => {
              const info = monthDayMap.get(day.key);
              const isSelected =
                selectedDate.day === day.day &&
                selectedDate.month === day.month &&
                selectedDate.year === day.year;
              const hasContent =
                Boolean(info?.slotsCount) ||
                Boolean(info?.eventsCount) ||
                Boolean(info?.cardsCount) ||
                Boolean(info?.myBookingsCount);

              return (
                <button
                  type="button"
                  key={day.key}
                  onClick={() => {
                    setSelectedDate({ day: day.day, month: day.month, year: day.year });
                    if (day.month !== baseDate.getMonth() + 1 || day.year !== baseDate.getFullYear()) {
                      setBaseDate(new Date(day.year, day.month - 1, 1));
                    }
                  }}
                  className={cn(
                    "group min-h-[118px] border-b border-r border-slate-200 p-2 text-left transition-colors last:border-r-0 sm:min-h-[136px] sm:p-3",
                    !day.isCurrentMonth && "bg-slate-100/70 text-slate-400",
                    day.isCurrentMonth && "bg-white hover:bg-blue-50/60",
                    isSelected && "bg-blue-50 ring-2 ring-inset ring-blue-500",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-black",
                        day.isToday && "bg-slate-900 text-white",
                        isSelected && !day.isToday && "bg-blue-600 text-white",
                      )}
                    >
                      {day.day}
                    </span>
                    {info?.myBookingsCount ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
                        {info.myBookingsCount} meu
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-1">
                    {loadingMonth && day.isCurrentMonth ? (
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    ) : null}
                    {info?.labels.map((label, index) => (
                      <div
                        key={`${label.kind}-${label.title}-${index}`}
                        className={cn(
                          "truncate rounded-md px-2 py-1 text-[11px] font-bold",
                          label.kind === "event"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700",
                        )}
                      >
                        {label.title}
                      </div>
                    ))}
                    {info?.availableSlotsCount ? (
                      <div className="truncate rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                        {info.availableSlotsCount} horário(s)
                      </div>
                    ) : null}
                  </div>

                  {hasContent ? (
                    <div className="mt-3 flex gap-1">
                      {info?.eventsCount ? <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> : null}
                      {info?.cardsCount ? <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> : null}
                      {info?.slotsCount ? <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> : null}
                      {info?.myBookingsCount ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Dia selecionado</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  {String(selectedDate.day).padStart(2, "0")}/{String(selectedDate.month).padStart(2, "0")}/{selectedDate.year}
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {filteredSlots.length} horário(s)
              </span>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}
            {successMessage ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950">Meus agendamentos</h3>
              <span className="text-xs font-bold text-slate-500">{myBookingsForDay.length}</span>
            </div>

            {loadingBookings ? (
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ) : myBookingsForDay.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Nenhuma sessão marcada para este dia.
              </div>
            ) : (
              <div className="space-y-3">
                {myBookingsForDay.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{booking.specialty}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{booking.specialist}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">
                        {bookingStatusLabel(booking.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock3 size={12} />
                        {new Date(booking.startsAtIso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {booking.location}
                      </span>
                    </div>
                    {booking.meetingUrl ? (
                      <Button size="sm" className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => window.open(booking.meetingUrl, "_blank")}>
                        Entrar na sala online
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {(dayEvents.length > 0 || dayCards.length > 0) ? (
            <Card className="p-5">
              <h3 className="mb-4 text-base font-black text-slate-950">Destaques do dia</h3>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase text-blue-700">Evento</span>
                      <span className="text-xs font-black text-slate-500">{event.time}</span>
                    </div>
                    <p className="font-black leading-tight text-slate-950">{event.title}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-700">
                      <MapPin size={12} />
                      {event.location}
                    </div>
                    <Button
                      size="sm"
                      variant={event.isParticipating ? "secondary" : "primary"}
                      className={cn("mt-3 h-9 w-full rounded-xl", event.isParticipating && "bg-emerald-100 text-emerald-700")}
                      disabled={event.isLocked}
                      onClick={() => void handleParticipate(event)}
                    >
                      {event.isLocked ? (
                        <>
                          <Lock size={13} />
                          Fechado
                        </>
                      ) : event.isParticipating ? "Participando" : "Participar"}
                    </Button>
                  </div>
                ))}
                {dayCards.map((card) => (
                  <div key={card.id} className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-black uppercase text-purple-700">
                        {card.category?.replace(/-/g, " ") || "Conteúdo"}
                      </span>
                      {card.slots ? <span className="text-xs font-black text-slate-500">{card.slots.split(",")[0]}</span> : null}
                    </div>
                    <p className="font-black leading-tight text-slate-950">{card.title}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-700">
                      <Star size={12} className="fill-purple-500" />
                      {card.slots ? "Sessão com horários" : "Evento / Atividade"}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-3 h-9 w-full rounded-xl text-purple-700 hover:bg-purple-100"
                      disabled={card.isLocked}
                      onClick={() => void handleCardAction(card)}
                    >
                      {card.isLocked ? "Turma fechada" : "Ver detalhes"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="p-5">
            <h3 className="mb-4 text-base font-black text-slate-950">Horários disponíveis</h3>
            {loadingSlots ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Nenhum horário disponível para este dia.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSlots.map((slot) => (
                  <div key={slot.slotId} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
                        {slot.time}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black leading-tight text-slate-950">{slot.specialty}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{slot.specialist} · {slot.focus}</p>
                      </div>
                    </div>
                    <Button
                      variant={slot.mineStatus ? "secondary" : "outline"}
                      size="sm"
                      className={cn(
                        "mt-3 w-full font-black",
                        !slot.mineStatus && slot.status === "available" && "border-blue-200 text-blue-700 hover:bg-blue-50",
                      )}
                      onClick={() => void handleBookingAction(slot)}
                      disabled={Boolean(slot.mineStatus) || pendingSlotId === slot.slotId}
                    >
                      {slot.mineStatus === "booked"
                        ? "Agendado"
                        : slot.mineStatus === "waitlist"
                          ? "Na fila"
                          : pendingSlotId === slot.slotId
                            ? "..."
                            : slot.status === "available"
                              ? "Agendar"
                              : "Fila de espera"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
