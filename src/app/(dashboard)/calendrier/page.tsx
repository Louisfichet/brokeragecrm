"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Link as LinkIcon,
  X,
  Pencil,
  Trash2,
  Users,
  ExternalLink,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  description: string | null;
  link: string | null;
  color: string;
  recurrence: string;
  recurrenceEnd: string | null;
  occurrenceDate: string;
  isRecurringInstance?: boolean;
  createdById: string;
  createdBy: { id: string; name: string };
  participants: { user: { id: string; name: string } }[];
  externalGuests: {
    contact: {
      id: string;
      firstName: string;
      lastName: string | null;
      email: string | null;
    };
  }[];
  property: { id: string; reference: string; address: string } | null;
  company: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string | null } | null;
}

// ─── Constants ───────────────────────────────────────────
const HOUR_HEIGHT = 64; // px per hour (desktop)
const HOUR_HEIGHT_MOBILE = 56; // px per hour (mobile)
const START_HOUR = 0;
const END_HOUR = 23;
const getScrollToHour = () => {
  const now = new Date();
  const h = now.getHours();
  // 1h de marge avant l'heure actuelle, minimum 0
  return Math.max(0, h - 1);
};
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_NAMES_FULL = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const EVENT_COLORS = [
  "#3B82F6", "#EF4444", "#22C55E", "#EAB308",
  "#8B5CF6", "#EC4899", "#F97316", "#6B7280",
];

// ─── Helpers ─────────────────────────────────────────────
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ─── Main Component ──────────────────────────────────────
export default function CalendrierPage() {
  const { data: session } = useSession();
  const admin = session?.user?.role === "ADMIN";
  const userId = session?.user?.id;

  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailPopover, setShowDetailPopover] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Create form
  const [form, setForm] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    isAllDay: false,
    description: "",
    link: "",
    color: "#3B82F6",
    recurrence: "NONE",
    recurrenceEnd: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // Participant & entity search
  const [participantIds, setParticipantIds] = useState<{ id: string; name: string }[]>([]);
  const [externalGuestIds, setExternalGuestIds] = useState<{ id: string; name: string }[]>([]);
  const [linkedEntity, setLinkedEntity] = useState<{
    type: "property" | "company" | "contact";
    id: string;
    label: string;
  } | null>(null);

  // Search states
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ id: string; name: string }[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<{ id: string; firstName: string; lastName: string | null }[]>([]);
  const [entitySearch, setEntitySearch] = useState("");
  const [entityResults, setEntityResults] = useState<{ type: string; id: string; label: string }[]>([]);

  // Mobile day selector (0-6 = Mon-Sun)
  const [mobileDay, setMobileDay] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    return day === 0 ? 6 : day - 1; // Convert Sun=0..Sat=6 to Mon=0..Sun=6
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const weekDays = getWeekDays(currentMonday);
  const gridRef = useRef<HTMLDivElement>(null);

  // ─── Search functions ────────────────────────────────
  const searchUsers = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setUserResults([]); return; }
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setUserResults(
        (data.data || data)
          .filter((u: { id: string }) => u.id !== userId && !participantIds.some((p) => p.id === u.id))
          .slice(0, 5)
      );
    } catch { setUserResults([]); }
  }, [userId, participantIds]);

  const searchContacts = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setContactResults([]); return; }
    try {
      const res = await fetch(`/api/contacts?search=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setContactResults(
        (data.data || []).filter(
          (c: { id: string }) => !externalGuestIds.some((g) => g.id === c.id)
        )
      );
    } catch { setContactResults([]); }
  }, [externalGuestIds]);

  const searchEntities = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setEntityResults([]); return; }
    try {
      const results: { type: string; id: string; label: string }[] = [];
      const [propsRes, compsRes, contsRes] = await Promise.all([
        fetch(`/api/properties?search=${encodeURIComponent(q)}&limit=3`),
        fetch(`/api/companies?search=${encodeURIComponent(q)}&limit=3`),
        fetch(`/api/contacts?search=${encodeURIComponent(q)}&limit=3`),
      ]);
      const [propsData, compsData, contsData] = await Promise.all([
        propsRes.json(), compsRes.json(), contsRes.json(),
      ]);
      for (const p of (propsData.data || [])) {
        results.push({ type: "property", id: p.id, label: `${p.reference} — ${p.address}` });
      }
      for (const c of (compsData.data || [])) {
        results.push({ type: "company", id: c.id, label: c.name });
      }
      for (const c of (contsData.data || [])) {
        results.push({ type: "contact", id: c.id, label: `${c.firstName} ${c.lastName || ""}`.trim() });
      }
      setEntityResults(results.slice(0, 6));
    } catch { setEntityResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch, searchUsers]);

  useEffect(() => {
    const t = setTimeout(() => searchContacts(contactSearch), 300);
    return () => clearTimeout(t);
  }, [contactSearch, searchContacts]);

  useEffect(() => {
    const t = setTimeout(() => searchEntities(entitySearch), 300);
    return () => clearTimeout(t);
  }, [entitySearch, searchEntities]);

  // ─── Fetch events ────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = formatDate(currentMonday);
      const endDay = new Date(currentMonday);
      endDay.setDate(endDay.getDate() + 6);
      const end = formatDate(endDay);

      const params = new URLSearchParams({ start, end });
      if (showAll && admin) params.set("all", "true");

      const res = await fetch(`/api/calendar/events?${params}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentMonday, showAll, admin]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Scroll to current hour once grid is rendered (after loading finishes)
  const hasScrolled = useRef(false);
  useEffect(() => {
    if (!loading && gridRef.current && !hasScrolled.current) {
      hasScrolled.current = true;
      requestAnimationFrame(() => {
        if (gridRef.current) {
          const scrollHour = getScrollToHour();
          const h = isMobile ? HOUR_HEIGHT_MOBILE : HOUR_HEIGHT;
          gridRef.current.scrollTop = (scrollHour - START_HOUR) * h;
        }
      });
    }
  }, [loading, isMobile]);

  // ─── Navigation ──────────────────────────────────────
  const prevWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() - 7);
    setCurrentMonday(d);
  };

  const nextWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + 7);
    setCurrentMonday(d);
  };

  const goToday = () => {
    setCurrentMonday(getMonday(new Date()));
    const todayDow = new Date().getDay();
    setMobileDay(todayDow === 0 ? 6 : todayDow - 1);
  };

  // ─── Week title ──────────────────────────────────────
  const weekTitle = (() => {
    const endDay = new Date(currentMonday);
    endDay.setDate(endDay.getDate() + 6);
    if (currentMonday.getMonth() === endDay.getMonth()) {
      return `${currentMonday.getDate()} - ${endDay.getDate()} ${MONTH_NAMES[currentMonday.getMonth()]} ${currentMonday.getFullYear()}`;
    }
    return `${currentMonday.getDate()} ${MONTH_NAMES[currentMonday.getMonth()]} - ${endDay.getDate()} ${MONTH_NAMES[endDay.getMonth()]} ${endDay.getFullYear()}`;
  })();

  // ─── Event helpers ───────────────────────────────────
  const getEventsForDay = (day: Date) => {
    return events.filter((e) => {
      const eventDate = new Date(e.occurrenceDate);
      return isSameDay(eventDate, day);
    });
  };

  const getTimedEvents = (day: Date) =>
    getEventsForDay(day).filter((e) => !e.isAllDay && e.startTime);

  const getAllDayEvents = (day: Date) =>
    getEventsForDay(day).filter((e) => e.isAllDay || !e.startTime);

  // ─── Click on empty slot ─────────────────────────────
  const resetFormExtras = () => {
    setParticipantIds([]);
    setExternalGuestIds([]);
    setLinkedEntity(null);
    setUserSearch("");
    setContactSearch("");
    setEntitySearch("");
    setUserResults([]);
    setContactResults([]);
    setEntityResults([]);
  };

  const handleSlotClick = (day: Date, hour: number) => {
    setEditingEvent(null);
    resetFormExtras();
    setForm({
      title: "",
      date: formatDate(day),
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(hour + 1).padStart(2, "0")}:00`,
      isAllDay: false,
      description: "",
      link: "",
      color: "#3B82F6",
      recurrence: "NONE",
      recurrenceEnd: "",
    });
    setShowCreateModal(true);
  };

  // ─── Event click ─────────────────────────────────────
  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowDetailPopover(true);
  };

  // ─── Edit event ──────────────────────────────────────
  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    const eventDate = new Date(event.occurrenceDate || event.date);
    setForm({
      title: event.title,
      date: formatDate(eventDate),
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      isAllDay: event.isAllDay,
      description: event.description || "",
      link: event.link || "",
      color: event.color,
      recurrence: event.recurrence,
      recurrenceEnd: event.recurrenceEnd
        ? event.recurrenceEnd.split("T")[0]
        : "",
    });
    // Populate participants (excluding creator)
    setParticipantIds(
      event.participants
        .filter((p) => p.user.id !== event.createdById)
        .map((p) => ({ id: p.user.id, name: p.user.name }))
    );
    setExternalGuestIds(
      event.externalGuests.map((g) => ({
        id: g.contact.id,
        name: `${g.contact.firstName} ${g.contact.lastName || ""}`.trim(),
      }))
    );
    if (event.property) {
      setLinkedEntity({
        type: "property",
        id: event.property.id,
        label: `${event.property.reference} — ${event.property.address}`,
      });
    } else if (event.company) {
      setLinkedEntity({
        type: "company",
        id: event.company.id,
        label: event.company.name,
      });
    } else if (event.contact) {
      setLinkedEntity({
        type: "contact",
        id: event.contact.id,
        label: `${event.contact.firstName} ${event.contact.lastName || ""}`.trim(),
      });
    } else {
      setLinkedEntity(null);
    }
    setUserSearch("");
    setContactSearch("");
    setEntitySearch("");
    setShowDetailPopover(false);
    setShowCreateModal(true);
  };

  // ─── Submit form ─────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        title: form.title,
        date: form.date,
        startTime: form.isAllDay ? null : form.startTime || null,
        endTime: form.isAllDay ? null : form.endTime || null,
        isAllDay: form.isAllDay,
        description: form.description || null,
        link: form.link || null,
        color: form.color,
        recurrence: form.recurrence,
        recurrenceEnd: form.recurrenceEnd || null,
        propertyId: linkedEntity?.type === "property" ? linkedEntity.id : null,
        companyId: linkedEntity?.type === "company" ? linkedEntity.id : null,
        contactId: linkedEntity?.type === "contact" ? linkedEntity.id : null,
        participantIds: participantIds.map((p) => p.id),
        externalGuestIds: externalGuestIds.map((g) => g.id),
      };

      if (editingEvent) {
        await fetch(`/api/calendar/events/${editingEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowCreateModal(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete event ────────────────────────────────────
  const handleDelete = async (eventId: string) => {
    if (!confirm("Supprimer cet événement ?")) return;
    try {
      await fetch(`/api/calendar/events/${eventId}`, { method: "DELETE" });
      setShowDetailPopover(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const canEdit = (event: CalendarEvent) =>
    event.createdById === userId || admin;

  // ─── Render ──────────────────────────────────────────
  const today = new Date();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Calendrier</h1>
          {/* Desktop: week range, Mobile: full day name */}
          <p className="text-navy-500 text-sm mt-0.5 hidden lg:block">{weekTitle}</p>
          <p className="text-navy-500 text-sm mt-0.5 lg:hidden">
            {DAY_NAMES_FULL[mobileDay]} {weekDays[mobileDay]?.getDate()}{" "}
            {MONTH_NAMES[weekDays[mobileDay]?.getMonth()]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {admin && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                showAll
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "bg-white border-navy-200 text-navy-600 hover:bg-navy-50"
              }`}
            >
              {showAll ? "Tous" : "Mes événements"}
            </button>
          )}
          <div className="flex rounded-xl border border-navy-200 overflow-hidden">
            <button
              onClick={prevWeek}
              className="p-2 bg-white text-navy-600 hover:bg-navy-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-2 bg-white text-navy-600 hover:bg-navy-50 text-xs font-medium transition-colors border-x border-navy-200"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={nextWeek}
              className="p-2 bg-white text-navy-600 hover:bg-navy-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => {
            setEditingEvent(null);
            resetFormExtras();
            setForm({
              title: "",
              date: formatDate(today),
              startTime: "",
              endTime: "",
              isAllDay: false,
              description: "",
              link: "",
              color: "#3B82F6",
              recurrence: "NONE",
              recurrenceEnd: "",
            });
            setShowCreateModal(true);
          }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Événement</span>
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile day tabs */}
        <div className="lg:hidden flex border-b border-navy-100 flex-shrink-0 overflow-x-auto">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            const isSelected = mobileDay === i;
            return (
              <button
                key={i}
                onClick={() => setMobileDay(i)}
                className={`flex-1 min-w-0 flex flex-col items-center py-2 px-1 transition-colors relative ${
                  isSelected
                    ? "bg-primary-50"
                    : isToday
                    ? "bg-primary-50/30"
                    : ""
                }`}
              >
                <span className={`text-[10px] font-medium ${
                  isSelected ? "text-primary-600" : "text-navy-400"
                }`}>
                  {DAY_NAMES[i]}
                </span>
                <span
                  className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday && isSelected
                      ? "bg-primary-500 text-white"
                      : isToday
                      ? "bg-primary-100 text-primary-700"
                      : isSelected
                      ? "text-primary-700"
                      : "text-navy-700"
                  }`}
                >
                  {day.getDate()}
                </span>
                {isSelected && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop day headers */}
        <div className="hidden lg:grid grid-cols-[60px_repeat(7,1fr)] border-b border-navy-100 flex-shrink-0">
          <div className="border-r border-navy-100" />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className={`text-center py-2.5 border-r border-navy-100 last:border-r-0 ${
                  isToday ? "bg-primary-50/50" : ""
                }`}
              >
                <p className="text-xs text-navy-500 font-medium">
                  {DAY_NAMES[i]}
                </p>
                <p
                  className={`text-lg font-semibold mt-0.5 ${
                    isToday
                      ? "text-white bg-primary-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                      : "text-navy-900"
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* All-day events row — Mobile (single day) */}
        {isMobile && getAllDayEvents(weekDays[mobileDay]).length > 0 && (
          <div className="border-b border-navy-100 flex-shrink-0 p-2">
            {getAllDayEvents(weekDays[mobileDay]).map((event) => (
              <button
                key={event.id + event.occurrenceDate}
                onClick={(e) => handleEventClick(e, event)}
                className="w-full text-left text-xs font-medium px-2.5 py-1.5 rounded-lg truncate mb-1"
                style={{
                  backgroundColor: event.color + "20",
                  color: event.color,
                  borderLeft: `3px solid ${event.color}`,
                }}
              >
                {event.title}
              </button>
            ))}
          </div>
        )}

        {/* All-day events row — Desktop (7 columns) */}
        {!isMobile && weekDays.some((day) => getAllDayEvents(day).length > 0) && (
          <div className="hidden lg:grid grid-cols-[60px_repeat(7,1fr)] border-b border-navy-100 flex-shrink-0">
            <div className="border-r border-navy-100 flex items-center justify-center">
              <span className="text-[10px] text-navy-400">Journée</span>
            </div>
            {weekDays.map((day, i) => {
              const dayAllDay = getAllDayEvents(day);
              return (
                <div
                  key={i}
                  className="border-r border-navy-100 last:border-r-0 p-1 min-h-[32px]"
                >
                  {dayAllDay.map((event) => (
                    <button
                      key={event.id + event.occurrenceDate}
                      onClick={(e) => handleEventClick(e, event)}
                      className="w-full text-left text-[11px] font-medium px-1.5 py-0.5 rounded truncate mb-0.5"
                      style={{
                        backgroundColor: event.color + "20",
                        color: event.color,
                        borderLeft: `3px solid ${event.color}`,
                      }}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Time grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div ref={gridRef} className="flex-1 overflow-y-auto">
            {/* ──── MOBILE: Single day view ──── */}
            <div className="lg:hidden pt-3">
              <div className="grid grid-cols-[48px_1fr] relative">
                {/* Hour labels */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-navy-100/60 border-r border-navy-100 relative"
                      style={{ height: HOUR_HEIGHT_MOBILE }}
                    >
                      <span className="absolute -top-2 left-1 text-[11px] text-navy-500 font-semibold tabular-nums">
                        {String(hour).padStart(2, "0")}h
                      </span>
                      {/* Half-hour line marker */}
                      <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-navy-100/40" />
                    </div>
                  ))}
                </div>

                {/* Single day column */}
                {(() => {
                  const day = weekDays[mobileDay];
                  const isToday = isSameDay(day, today);
                  const timedEvents = getTimedEvents(day);

                  return (
                    <div
                      className={`relative ${
                        isToday ? "bg-primary-50/20" : ""
                      }`}
                    >
                      {/* Hour slots (clickable) */}
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="border-b border-navy-100/60 cursor-pointer hover:bg-navy-50/50 transition-colors relative"
                          style={{ height: HOUR_HEIGHT_MOBILE }}
                          onClick={() => handleSlotClick(day, hour)}
                        >
                          {/* Half-hour dashed line */}
                          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-navy-100/40" />
                        </div>
                      ))}

                      {/* Events overlay */}
                      {timedEvents.map((event) => {
                        const startMin = event.startTime
                          ? timeToMinutes(event.startTime)
                          : START_HOUR * 60;
                        const endMin = event.endTime
                          ? timeToMinutes(event.endTime)
                          : END_HOUR * 60 + 59;

                        const top =
                          ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT_MOBILE;
                        const height =
                          ((endMin - startMin) / 60) * HOUR_HEIGHT_MOBILE;
                        const isOwn = event.createdById === userId ||
                          event.participants.some((p) => p.user.id === userId);

                        return (
                          <button
                            key={event.id + event.occurrenceDate}
                            className={`absolute left-1.5 right-1.5 rounded-xl px-3 py-1.5 text-left overflow-hidden cursor-pointer transition-opacity hover:opacity-90 ${
                              !isOwn ? "opacity-50" : ""
                            }`}
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 28)}px`,
                              backgroundColor: event.color + "20",
                              borderLeft: `3px solid ${event.color}`,
                            }}
                            onClick={(e) => handleEventClick(e, event)}
                          >
                            <p
                              className="text-xs font-semibold truncate"
                              style={{ color: event.color }}
                            >
                              {event.title}
                            </p>
                            {height >= 36 && (
                              <p className="text-[11px] text-navy-500 mt-0.5">
                                {event.startTime}
                                {event.endTime ? ` – ${event.endTime}` : ""}
                              </p>
                            )}
                            {height >= 56 && event.description && (
                              <p className="text-[10px] text-navy-400 mt-0.5 line-clamp-1">
                                {event.description}
                              </p>
                            )}
                          </button>
                        );
                      })}

                      {/* Current time line */}
                      {isToday && (() => {
                        const now = new Date();
                        const nowMin = now.getHours() * 60 + now.getMinutes();
                        if (nowMin < START_HOUR * 60 || nowMin > END_HOUR * 60 + 59) return null;
                        const top = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT_MOBILE;
                        return (
                          <div
                            className="absolute left-0 right-0 z-10 pointer-events-none"
                            style={{ top: `${top}px` }}
                          >
                            <div className="flex items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                              <div className="flex-1 h-[2px] bg-red-500" />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ──── DESKTOP: Week view ──── */}
            <div className="hidden lg:block pt-3">
              <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
                {/* Hour labels + grid lines */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-navy-100/60 border-r border-navy-100 relative"
                      style={{ height: HOUR_HEIGHT }}
                    >
                      <span className="absolute -top-2.5 right-2 text-[11px] text-navy-500 font-semibold tabular-nums">
                        {String(hour).padStart(2, "0")}:00
                      </span>
                      {/* Half-hour dashed line */}
                      <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-navy-100/40" />
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                  const isToday = isSameDay(day, today);
                  const timedEvents = getTimedEvents(day);

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-r border-navy-100 last:border-r-0 ${
                        isToday ? "bg-primary-50/30" : ""
                      }`}
                    >
                      {/* Hour slots (clickable) */}
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="border-b border-navy-100/60 cursor-pointer hover:bg-navy-50/50 transition-colors relative"
                          style={{ height: HOUR_HEIGHT }}
                          onClick={() => handleSlotClick(day, hour)}
                        >
                          {/* Half-hour dashed line */}
                          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-navy-100/40" />
                        </div>
                      ))}

                      {/* Events overlay */}
                      {timedEvents.map((event) => {
                        const startMin = event.startTime
                          ? timeToMinutes(event.startTime)
                          : START_HOUR * 60;
                        const endMin = event.endTime
                          ? timeToMinutes(event.endTime)
                          : END_HOUR * 60 + 59;

                        const top =
                          ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                        const height =
                          ((endMin - startMin) / 60) * HOUR_HEIGHT;
                        const isOwn = event.createdById === userId ||
                          event.participants.some((p) => p.user.id === userId);

                        return (
                          <button
                            key={event.id + event.occurrenceDate}
                            className={`absolute left-1 right-1 rounded-lg px-2 py-1 text-left overflow-hidden cursor-pointer transition-opacity hover:opacity-90 ${
                              !isOwn ? "opacity-50" : ""
                            }`}
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 24)}px`,
                              backgroundColor: event.color + "20",
                              borderLeft: `3px solid ${event.color}`,
                            }}
                            onClick={(e) => handleEventClick(e, event)}
                          >
                            <p
                              className="text-[11px] font-semibold truncate"
                              style={{ color: event.color }}
                            >
                              {event.title}
                            </p>
                            {height >= 40 && (
                              <p className="text-[10px] text-navy-500 mt-0.5">
                                {event.startTime}
                                {event.endTime ? ` - ${event.endTime}` : ""}
                              </p>
                            )}
                          </button>
                        );
                      })}

                      {/* Current time line */}
                      {isToday && (() => {
                        const now = new Date();
                        const nowMin = now.getHours() * 60 + now.getMinutes();
                        if (nowMin < START_HOUR * 60 || nowMin > END_HOUR * 60 + 59) return null;
                        const top = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                        return (
                          <div
                            className="absolute left-0 right-0 z-10 pointer-events-none"
                            style={{ top: `${top}px` }}
                          >
                            <div className="flex items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                              <div className="flex-1 h-[2px] bg-red-500" />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Detail Popover ─────────────────────────────── */}
      {showDetailPopover && selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={() => setShowDetailPopover(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-navy-100 w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Color bar */}
            <div
              className="h-2"
              style={{ backgroundColor: selectedEvent.color }}
            />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-navy-900">
                  {selectedEvent.title}
                </h3>
                <div className="flex gap-1 flex-shrink-0">
                  {canEdit(selectedEvent) && (
                    <>
                      <button
                        onClick={() => openEditModal(selectedEvent)}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-primary-600 hover:bg-navy-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedEvent.id)}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowDetailPopover(false)}
                    className="p-1.5 rounded-lg text-navy-400 hover:text-navy-600 hover:bg-navy-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Date & time */}
              <div className="flex items-center gap-2 mt-3 text-sm text-navy-600">
                <Clock className="w-4 h-4 text-navy-400" />
                {selectedEvent.isAllDay ? (
                  <span>
                    {new Date(selectedEvent.occurrenceDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })} — Journée entière
                  </span>
                ) : (
                  <span>
                    {new Date(selectedEvent.occurrenceDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    {selectedEvent.startTime}
                    {selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ""}
                  </span>
                )}
              </div>

              {selectedEvent.recurrence !== "NONE" && (
                <p className="text-xs text-navy-400 mt-1 ml-6">
                  Récurrent :{" "}
                  {selectedEvent.recurrence === "QUOTIDIEN"
                    ? "Tous les jours"
                    : selectedEvent.recurrence === "HEBDOMADAIRE"
                    ? "Chaque semaine"
                    : "Chaque mois"}
                </p>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <p className="text-sm text-navy-600 mt-3 whitespace-pre-wrap">
                  {selectedEvent.description}
                </p>
              )}

              {/* Link */}
              {selectedEvent.link && (
                <a
                  href={selectedEvent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary-600 hover:underline mt-3"
                >
                  <LinkIcon className="w-4 h-4" />
                  {selectedEvent.link}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Linked entity */}
              {(selectedEvent.property ||
                selectedEvent.company ||
                selectedEvent.contact) && (
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <MapPin className="w-4 h-4 text-navy-400" />
                  {selectedEvent.property && (
                    <Link
                      href={`/biens/${selectedEvent.property.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {selectedEvent.property.reference} —{" "}
                      {selectedEvent.property.address}
                    </Link>
                  )}
                  {selectedEvent.company && (
                    <Link
                      href={`/societes/${selectedEvent.company.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {selectedEvent.company.name}
                    </Link>
                  )}
                  {selectedEvent.contact && (
                    <Link
                      href={`/contacts/${selectedEvent.contact.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {selectedEvent.contact.firstName}{" "}
                      {selectedEvent.contact.lastName || ""}
                    </Link>
                  )}
                </div>
              )}

              {/* Participants */}
              {selectedEvent.participants.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-sm text-navy-500">
                    <Users className="w-4 h-4 text-navy-400" />
                    <span>Participants</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 ml-6">
                    {selectedEvent.participants.map((p) => (
                      <span
                        key={p.user.id}
                        className="text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full"
                      >
                        {p.user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External guests */}
              {selectedEvent.externalGuests.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-sm text-navy-500 ml-6">
                    <span>Contacts externes</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1 ml-6">
                    {selectedEvent.externalGuests.map((g) => (
                      <Link
                        key={g.contact.id}
                        href={`/contacts/${g.contact.id}`}
                        className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full hover:bg-primary-100 transition-colors"
                      >
                        {g.contact.firstName} {g.contact.lastName || ""}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Created by */}
              <p className="text-xs text-navy-400 mt-4">
                Créé par {selectedEvent.createdBy.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create/Edit Modal ──────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingEvent(null);
        }}
        title={editingEvent ? "Modifier l'événement" : "Créer un événement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titre *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date *"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAllDay}
                  onChange={(e) =>
                    setForm({ ...form, isAllDay: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-navy-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-navy-700">Journée entière</span>
              </label>
            </div>
          </div>

          {!form.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Heure début"
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
              <Input
                label="Heure fin"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
              placeholder="Notes, détails..."
            />
          </div>

          <Input
            label="Lien (URL)"
            type="url"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="https://..."
          />

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Couleur
            </label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === c
                      ? "ring-2 ring-offset-2 ring-navy-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">
              Récurrence
            </label>
            <select
              value={form.recurrence}
              onChange={(e) =>
                setForm({ ...form, recurrence: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="NONE">Aucune</option>
              <option value="QUOTIDIEN">Tous les jours</option>
              <option value="HEBDOMADAIRE">Chaque semaine</option>
              <option value="MENSUEL">Chaque mois</option>
            </select>
          </div>

          {form.recurrence !== "NONE" && (
            <Input
              label="Fin de récurrence"
              type="date"
              value={form.recurrenceEnd}
              onChange={(e) =>
                setForm({ ...form, recurrenceEnd: e.target.value })
              }
              placeholder="Illimité si vide"
            />
          )}

          {/* Linked entity */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">
              Rattacher à (optionnel)
            </label>
            {linkedEntity ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-navy-50 rounded-xl">
                <span className="text-xs px-1.5 py-0.5 rounded bg-navy-200 text-navy-600 font-medium uppercase">
                  {linkedEntity.type === "property" ? "Bien" : linkedEntity.type === "company" ? "Société" : "Contact"}
                </span>
                <span className="text-sm text-navy-700 truncate flex-1">
                  {linkedEntity.label}
                </span>
                <button
                  type="button"
                  onClick={() => setLinkedEntity(null)}
                  className="text-navy-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={entitySearch}
                  onChange={(e) => setEntitySearch(e.target.value)}
                  placeholder="Rechercher un bien, société, contact..."
                  className="w-full px-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                {entityResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-navy-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {entityResults.map((r) => (
                      <button
                        key={r.type + r.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-navy-50 transition-colors flex items-center gap-2"
                        onClick={() => {
                          setLinkedEntity({ type: r.type as "property" | "company" | "contact", id: r.id, label: r.label });
                          setEntitySearch("");
                          setEntityResults([]);
                        }}
                      >
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-100 text-navy-500 font-medium uppercase">
                          {r.type === "property" ? "Bien" : r.type === "company" ? "Société" : "Contact"}
                        </span>
                        <span className="truncate">{r.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Participants CRM */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">
              Participants CRM
            </label>
            {participantIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {participantIds.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 pl-2 pr-1 py-0.5 rounded-full"
                  >
                    {p.name}
                    <button
                      type="button"
                      onClick={() =>
                        setParticipantIds(participantIds.filter((x) => x.id !== p.id))
                      }
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full px-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              {userResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-navy-200 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-navy-50 transition-colors"
                      onClick={() => {
                        setParticipantIds([...participantIds, { id: u.id, name: u.name }]);
                        setUserSearch("");
                        setUserResults([]);
                      }}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* External guests */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">
              Contacts externes
            </label>
            {externalGuestIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {externalGuestIds.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 pl-2 pr-1 py-0.5 rounded-full"
                  >
                    {g.name}
                    <button
                      type="button"
                      onClick={() =>
                        setExternalGuestIds(externalGuestIds.filter((x) => x.id !== g.id))
                      }
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Rechercher un contact..."
                className="w-full px-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              {contactResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-navy-200 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                  {contactResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-navy-50 transition-colors"
                      onClick={() => {
                        setExternalGuestIds([
                          ...externalGuestIds,
                          { id: c.id, name: `${c.firstName} ${c.lastName || ""}`.trim() },
                        ]);
                        setContactSearch("");
                        setContactResults([]);
                      }}
                    >
                      {c.firstName} {c.lastName || ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setEditingEvent(null);
              }}
            >
              Annuler
            </Button>
            <Button type="submit" loading={formLoading}>
              {editingEvent ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
