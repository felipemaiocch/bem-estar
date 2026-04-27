"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus2, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { agendaFilters } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function getNextDays(startDate: Date, count: number) {
  const daysArray = [];
  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"];

  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    daysArray.push({
      label: dayNames[d.getDay()],
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      dateObj: d,
    });
  }
  return daysArray;
}

const specialistFocusFilters = [
  "Todos focos",
  "Burnout",
  "Ansiedade",
  "Nutrição esportiva",
  "Postura",
  "Sono",
];

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

function formatDateLabel(valueIso: string) {
  const value = new Date(valueIso);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatGoogleDate(valueIso: string) {
  const value = new Date(valueIso);
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function getGoogleCalendarUrl(booking: UserBooking) {
  const title = `${booking.specialty} com ${booking.specialist}`;
  const details = `${booking.focus} · ${booking.mode === "online" ? "Online" : "Presencial"}${booking.meetingUrl ? ` · ${booking.meetingUrl}` : ""
    }`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(booking.startsAtIso)}/${formatGoogleDate(booking.endsAtIso)}`,
    details,
    location: booking.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getOutlookCalendarUrl(booking: UserBooking) {
  const title = `${booking.specialty} com ${booking.specialist}`;
  const body = `${booking.focus} · ${booking.mode === "online" ? "Online" : "Presencial"}${booking.meetingUrl ? ` · ${booking.meetingUrl}` : ""
    }`;

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: booking.startsAtIso,
    enddt: booking.endsAtIso,
    body,
    location: booking.location,
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function AgendaScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [selectedFocusFilter, setSelectedFocusFilter] = useState("Todos focos");
  const [showWaitlist, setShowWaitlist] = useState(true);

  const [baseDate, setBaseDate] = useState(() => new Date());
  const weekDays = useMemo(() => getNextDays(baseDate, 7), [baseDate]);

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
  const [myBookings, setMyBookings] = useState<UserBooking[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
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
        focus: selectedFocusFilter,
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
  }, [selectedDate, selectedFilter, selectedFocusFilter]);

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
    void loadMyBookings();
  }, [loadMyBookings]);

  const nextSession = myBookings[0] ?? null;

  const myBookingsForDay = useMemo(() => {
    return myBookings.filter(b => {
      const d = new Date(b.startsAtIso);
      return d.getDate() === selectedDate.day &&
             (d.getMonth() + 1) === selectedDate.month &&
             d.getFullYear() === selectedDate.year;
    });
  }, [myBookings, selectedDate]);

  const filteredSlots = useMemo(() => slots, [slots]);

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
      await Promise.all([loadSlots(), loadMyBookings()]);
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
    if (response.ok) await loadSlots();
  };

  const handleCardAction = (card: any) => {
    if (card.category) {
      router.push(`/usuario/categoria/${card.category}`);
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

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {specialistFocusFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFocusFilter(filter)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              filter === selectedFocusFilter
                ? "bg-blue-600 text-white"
                : "border border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100",
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="h-fit p-6 md:col-span-5">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">{capitalizedMonth} {baseDate.getFullYear()}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newDate = new Date(baseDate);
                  newDate.setDate(baseDate.getDate() - 7);
                  setBaseDate(newDate);
                }}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  const newDate = new Date(baseDate);
                  newDate.setDate(baseDate.getDate() + 7);
                  setBaseDate(newDate);
                }}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            {weekDays.map((d, index) => {
              const isSelected = selectedDate.day === d.day && selectedDate.month === d.month && selectedDate.year === d.year;
              return (
                <div key={`${d.day}-${d.month}-${index}`} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">{d.label}</span>
                  <button
                    onClick={() => setSelectedDate({ day: d.day, month: d.month, year: d.year })}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors",
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    {d.day}
                  </button>
                  {isSelected ? (
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6 md:col-span-7">
          {/* Section 1: Published Content (Events & Cards) */}
          {(dayEvents.length > 0 || dayCards.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Destaques e Programação</h3>
              <div className="grid gap-4">
                {dayEvents.map((event) => (
                  <Card key={event.id} className="relative overflow-hidden p-4 border-l-4 border-blue-500 bg-blue-50/30">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Evento</span>
                       <span className="text-[10px] font-bold text-slate-500">{event.time}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{event.title}</p>
                        <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                          <MapPin size={12} />
                          {event.location}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={event.isParticipating ? "secondary" : "primary"}
                        className={cn("h-8 rounded-lg", event.isParticipating && "bg-emerald-100 text-emerald-700")}
                        onClick={() => void handleParticipate(event)}
                      >
                        {event.isParticipating ? "Participando" : "Participar"}
                      </Button>
                    </div>
                  </Card>
                ))}
                {dayCards.map((card) => (
                  <Card key={card.id} className="relative overflow-hidden p-4 border-l-4 border-purple-500 bg-purple-50/30">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100 px-2 py-0.5 rounded">{card.category?.replace(/-/g, ' ') || "Conteúdo"}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{card.title}</p>
                        <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-purple-700">
                          <Star size={12} className="fill-purple-500" />
                          Atividade coletiva
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 rounded-lg text-purple-600 hover:bg-purple-100"
                        onClick={() => void handleCardAction(card)}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Personal Sessions */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Meus Agendamentos</h3>
                <span className="text-xs font-semibold text-slate-500">{myBookingsForDay.length} sessão(ões) hoje</span>
             </div>
             
             {loadingBookings ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-20 w-full rounded-xl bg-slate-100" />
                </div>
             ) : myBookingsForDay.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                   <p className="text-sm text-slate-500">Nenhuma sessão marcada para este dia.</p>
                </div>
             ) : (
                <div className="space-y-3">
                  {myBookingsForDay.map((booking) => (
                    <Card key={booking.id} className="p-4 border-l-4 border-emerald-500 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{booking.specialty} · {booking.specialist}</p>
                          <p className="text-xs text-slate-500 mt-1">{booking.focus}</p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                             <span className="flex items-center gap-1"><Clock3 size={12} /> {new Date(booking.startsAtIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                             <span className="flex items-center gap-1"><MapPin size={12} /> {booking.location}</span>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 uppercase">
                          {bookingStatusLabel(booking.status)}
                        </span>
                      </div>
                      {booking.meetingUrl && (
                        <Button size="sm" className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => window.open(booking.meetingUrl, '_blank')}>
                          Entrar na sala online
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
             )}
          </div>

          {/* Section 3: Available Specialists */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold text-gray-900">
              Especialistas Disponíveis
            </h3>
            
            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            {loadingSlots ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="animate-pulse p-4">
                    <div className="h-10 w-full rounded bg-slate-100" />
                  </Card>
                ))}
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white px-4 py-8 text-center text-sm text-gray-500">
                Nenhum horário disponível para os filtros selecionados.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSlots.map((slot) => (
                  <Card
                    key={slot.slotId}
                    className="group flex flex-col gap-4 p-4 transition-all hover:shadow-md hover:border-blue-200 sm:flex-row sm:items-center"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <span className="text-sm">{slot.time}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{slot.specialty}</p>
                        <p className="text-xs text-gray-500">{slot.specialist} · {slot.focus}</p>
                      </div>
                    </div>
                    <Button
                      variant={slot.mineStatus ? "secondary" : "outline"}
                      size="sm"
                      className={cn(
                        "sm:w-auto font-bold",
                        !slot.mineStatus && slot.status === "available" && "border-blue-200 text-blue-600 hover:bg-blue-50"
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
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
