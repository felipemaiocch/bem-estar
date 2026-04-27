"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus2, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin } from "lucide-react";

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
      };

      if (!response.ok || !data.ok) {
        setSlots([]);
        setErrorMessage(data.error ?? "Não foi possível carregar os horários.");
        return;
      }

      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
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

        <div className="space-y-5 md:col-span-7">
          {showWaitlist && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 p-4 font-medium text-white shadow-lg shadow-amber-500/20 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-100">Fila inteligente</p>
                  <p className="mt-0.5 text-sm">Vaga liberada! Psicologia com Camila hoje às 14h. Deseja adiantar sua sessão?</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="bg-white text-orange-600 hover:bg-orange-50" onClick={() => setShowWaitlist(false)}>Adiantar para 14h</Button>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setShowWaitlist(false)}>Manter atual</Button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <div>
                <p className="font-semibold text-blue-900">Pré-consulta sugerida</p>
                <p className="mt-0.5 text-sm text-blue-700">Preencha um check-in rápido de 1 minuto para o seu psicólogo ler antes da sua próxima sessão.</p>
                <Button size="sm" className="mt-3 h-8 bg-blue-600 hover:bg-blue-700">Preencher Check-in</Button>
              </div>
            </div>
          </div>
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-700">
              <CalendarPlus2 className="h-4 w-4" />
              <p className="text-sm font-semibold">Minhas próximas sessões</p>
            </div>

            {loadingBookings ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="h-4 w-48 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-60 rounded bg-slate-200" />
                    <div className="mt-3 h-8 w-full rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : null}

            {!loadingBookings && !myBookings.length ? (
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                Você ainda não possui sessões agendadas.
              </p>
            ) : null}

            <div className="space-y-3">
              {myBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {booking.specialty} · {booking.specialist}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateLabel(booking.startsAtIso)} · {booking.focus}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.mode === "online" ? "Online" : "Presencial"} · {booking.location}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      {bookingStatusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {booking.mode === "online" && booking.meetingUrl ? (
                      <a href={booking.meetingUrl} target="_blank" rel="noreferrer">
                        <Button size="sm">
                          Entrar na sala
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    ) : null}
                    <a href={getGoogleCalendarUrl(booking)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81z" /></svg>
                        Google Calendar
                      </Button>
                    </a>
                    <a href={getOutlookCalendarUrl(booking)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2h12c1.1 0 2-.9 2-2V8l-6-6zm-4 14.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5s-1.57 3.5-3.5 3.5z" /></svg>
                        Outlook
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <h3 className="text-lg font-bold text-gray-900">
            Disponíveis em {String(selectedDate.day).padStart(2, "0")}/{String(selectedDate.month).padStart(2, "0")}
          </h3>
          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {loadingSlots ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="animate-pulse p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 rounded bg-slate-200" />
                      <div className="h-3 w-56 rounded bg-slate-200" />
                      <div className="h-3 w-32 rounded bg-slate-200" />
                    </div>
                    <div className="h-9 w-24 rounded-lg bg-slate-200" />
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          {!loadingSlots && !filteredSlots.length ? (
            <div className="rounded-xl border border-gray-100 bg-white px-4 py-6 text-sm text-gray-500">
              Nenhum horário disponível para este filtro ou data.
            </div>
          ) : null}

          <div className="space-y-4">
            {filteredSlots.map((slot) => (
              <Card
                key={slot.slotId}
                className="flex flex-col gap-4 p-4 transition-colors hover:border-blue-200 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <span className="text-sm font-black">{slot.time}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{slot.specialty}</p>
                    <p className="text-sm text-gray-500">{slot.specialist} · {slot.focus}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <MapPin size={12} />
                      {slot.mode === "online" ? "Online" : "Presencial"} · {slot.location}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <Clock3 size={12} />
                      {slot.status === "available"
                        ? "Disponível agora"
                        : slot.status === "waitlist"
                          ? "Lista de espera"
                          : "Horário ocupado"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={
                    slot.mineStatus
                      ? "secondary"
                      : slot.status === "available"
                        ? "outline"
                        : "secondary"
                  }
                  className="sm:w-auto"
                  onClick={() => void handleBookingAction(slot)}
                  disabled={Boolean(slot.mineStatus) || pendingSlotId === slot.slotId}
                >
                  {slot.mineStatus === "booked"
                    ? "Reservado"
                    : slot.mineStatus === "waitlist"
                      ? "Na fila"
                      : pendingSlotId === slot.slotId
                        ? "Processando..."
                        : slot.status === "available"
                          ? "Reservar"
                          : "Entrar na fila"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
