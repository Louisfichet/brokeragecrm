import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  badRequest,
  serverError,
  isAdmin,
} from "@/lib/api-helpers";

// GET /api/calendar/events — Liste des événements par plage de dates
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const all = searchParams.get("all") === "true";

    if (!start || !end) {
      return badRequest("Les paramètres start et end sont requis");
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Filtrage : soit mes événements, soit tous (admin only)
    const showAll = all && isAdmin(session);

    // Événements ponctuels dans la plage
    const where: Record<string, unknown> = {
      recurrence: "NONE",
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Filtrage par utilisateur (créateur ou participant)
    if (!showAll) {
      where.OR = [
        { createdById: session.user.id },
        { participants: { some: { userId: session.user.id } } },
      ];
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
        externalGuests: {
          include: {
            contact: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        property: { select: { id: true, reference: true, address: true } },
        company: { select: { id: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { date: "asc" },
    });

    // Aussi récupérer les événements récurrents qui pourraient avoir des occurrences dans la plage
    const recurringWhere: Record<string, unknown> = {
      recurrence: { not: "NONE" },
      date: { lte: endDate },
      OR: [
        { recurrenceEnd: null },
        { recurrenceEnd: { gte: startDate } },
      ],
    };

    if (!showAll) {
      recurringWhere.AND = [
        {
          OR: [
            { createdById: session.user.id },
            { participants: { some: { userId: session.user.id } } },
          ],
        },
        {
          OR: [
            { recurrenceEnd: null },
            { recurrenceEnd: { gte: startDate } },
          ],
        },
      ];
      // Rebuild without top-level OR
      delete recurringWhere.OR;
      recurringWhere.recurrence = { not: "NONE" };
      recurringWhere.date = { lte: endDate };
    }

    const recurringEvents = await prisma.calendarEvent.findMany({
      where: recurringWhere,
      include: {
        createdBy: { select: { id: true, name: true } },
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
        externalGuests: {
          include: {
            contact: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        property: { select: { id: true, reference: true, address: true } },
        company: { select: { id: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
        exceptions: true,
      },
      orderBy: { date: "asc" },
    });

    // Expand recurring events into occurrences
    const expandedOccurrences = recurringEvents.flatMap((event) =>
      expandRecurringEvent(event, startDate, endDate)
    );

    // Combine and sort
    const allEvents = [
      ...events.map((e) => ({ ...e, occurrenceDate: e.date.toISOString() })),
      ...expandedOccurrences,
    ].sort(
      (a, b) =>
        new Date(a.occurrenceDate).getTime() -
        new Date(b.occurrenceDate).getTime()
    );

    return NextResponse.json(allEvents);
  } catch (error) {
    return serverError(error);
  }
}

// Expand recurring event into occurrences within the given range
function expandRecurringEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any,
  rangeStart: Date,
  rangeEnd: Date
) {
  const occurrences = [];
  const eventDate = new Date(event.date);
  const recEnd = event.recurrenceEnd
    ? new Date(event.recurrenceEnd)
    : rangeEnd;
  const effectiveEnd = recEnd < rangeEnd ? recEnd : rangeEnd;

  // Build exception map
  const exceptionMap = new Map<string, typeof event.exceptions[0]>();
  for (const ex of event.exceptions || []) {
    const key = new Date(ex.originalDate).toISOString().split("T")[0];
    exceptionMap.set(key, ex);
  }

  let current = new Date(eventDate);

  while (current <= effectiveEnd) {
    if (current >= rangeStart) {
      const dateKey = current.toISOString().split("T")[0];
      const exception = exceptionMap.get(dateKey);

      if (exception?.isCancelled) {
        // Skip cancelled occurrences
      } else {
        const { exceptions, ...eventData } = event;
        occurrences.push({
          ...eventData,
          // Apply exception overrides
          ...(exception && {
            title: exception.title || eventData.title,
            startTime: exception.startTime || eventData.startTime,
            endTime: exception.endTime || eventData.endTime,
            description:
              exception.description !== null
                ? exception.description
                : eventData.description,
            link: exception.link !== null ? exception.link : eventData.link,
            color: exception.color || eventData.color,
          }),
          occurrenceDate: current.toISOString(),
          isRecurringInstance: true,
          exceptionId: exception?.id || null,
        });
      }
    }

    // Advance to next occurrence
    current = getNextOccurrence(current, event.recurrence);
    // Safety: prevent infinite loops
    if (occurrences.length > 366) break;
  }

  return occurrences;
}

function getNextOccurrence(date: Date, recurrence: string): Date {
  const next = new Date(date);
  switch (recurrence) {
    case "QUOTIDIEN":
      next.setDate(next.getDate() + 1);
      break;
    case "HEBDOMADAIRE":
      next.setDate(next.getDate() + 7);
      break;
    case "MENSUEL":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setFullYear(next.getFullYear() + 100); // Never
  }
  return next;
}

// POST /api/calendar/events — Créer un événement
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const {
      title,
      date,
      startTime,
      endTime,
      isAllDay,
      description,
      link,
      color,
      recurrence,
      recurrenceEnd,
      propertyId,
      companyId,
      contactId,
      participantIds,
      externalGuestIds,
    } = body;

    if (!title) return badRequest("Le titre est requis");
    if (!date) return badRequest("La date est requise");

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        date: new Date(date),
        startTime: isAllDay ? null : startTime || null,
        endTime: isAllDay ? null : endTime || null,
        isAllDay: isAllDay || false,
        description: description || null,
        link: link || null,
        color: color || "#3B82F6",
        recurrence: recurrence || "NONE",
        recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
        propertyId: propertyId || null,
        companyId: companyId || null,
        contactId: contactId || null,
        createdById: session.user.id,
        // Auto-add creator as participant
        participants: {
          create: [
            { userId: session.user.id },
            ...(participantIds || [])
              .filter((id: string) => id !== session.user.id)
              .map((id: string) => ({ userId: id })),
          ],
        },
        ...(externalGuestIds?.length && {
          externalGuests: {
            create: externalGuestIds.map((id: string) => ({
              contactId: id,
            })),
          },
        }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
        externalGuests: {
          include: {
            contact: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        property: { select: { id: true, reference: true, address: true } },
        company: { select: { id: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
