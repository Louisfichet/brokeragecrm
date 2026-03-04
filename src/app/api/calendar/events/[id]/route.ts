import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  serverError,
  isAdmin,
} from "@/lib/api-helpers";

const eventInclude = {
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
};

// GET /api/calendar/events/[id] — Détail d'un événement
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
      include: eventInclude,
    });

    if (!event) return notFound("Événement introuvable");

    // Vérifier accès : créateur, participant, ou admin
    const isParticipant = event.participants.some(
      (p) => p.userId === session.user.id
    );
    if (
      event.createdById !== session.user.id &&
      !isParticipant &&
      !isAdmin(session)
    ) {
      return notFound("Événement introuvable");
    }

    return NextResponse.json(event);
  } catch (error) {
    return serverError(error);
  }
}

// PUT /api/calendar/events/[id] — Modifier un événement
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const existing = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
      include: { participants: true },
    });

    if (!existing) return notFound("Événement introuvable");

    // Permission : créateur ou admin
    if (existing.createdById !== session.user.id && !isAdmin(session)) {
      return forbidden();
    }

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

    if (title !== undefined && !title) {
      return badRequest("Le titre est requis");
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = new Date(date);
    if (isAllDay !== undefined) {
      updateData.isAllDay = isAllDay;
      if (isAllDay) {
        updateData.startTime = null;
        updateData.endTime = null;
      }
    }
    if (startTime !== undefined) updateData.startTime = startTime || null;
    if (endTime !== undefined) updateData.endTime = endTime || null;
    if (description !== undefined) updateData.description = description || null;
    if (link !== undefined) updateData.link = link || null;
    if (color !== undefined) updateData.color = color;
    if (recurrence !== undefined) updateData.recurrence = recurrence;
    if (recurrenceEnd !== undefined)
      updateData.recurrenceEnd = recurrenceEnd ? new Date(recurrenceEnd) : null;
    if (propertyId !== undefined) updateData.propertyId = propertyId || null;
    if (companyId !== undefined) updateData.companyId = companyId || null;
    if (contactId !== undefined) updateData.contactId = contactId || null;

    // Update participants if provided
    if (participantIds !== undefined) {
      // Ensure creator is always a participant
      const allParticipants = Array.from(
        new Set([existing.createdById, ...participantIds])
      );

      await prisma.eventParticipant.deleteMany({
        where: { eventId: params.id },
      });

      await prisma.eventParticipant.createMany({
        data: allParticipants.map((userId: string) => ({
          eventId: params.id,
          userId,
        })),
      });
    }

    // Update external guests if provided
    if (externalGuestIds !== undefined) {
      await prisma.eventExternalGuest.deleteMany({
        where: { eventId: params.id },
      });

      if (externalGuestIds.length > 0) {
        await prisma.eventExternalGuest.createMany({
          data: externalGuestIds.map((contactId: string) => ({
            eventId: params.id,
            contactId,
          })),
        });
      }
    }

    const event = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: updateData,
      include: eventInclude,
    });

    return NextResponse.json(event);
  } catch (error) {
    return serverError(error);
  }
}

// DELETE /api/calendar/events/[id] — Supprimer un événement
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const existing = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
    });

    if (!existing) return notFound("Événement introuvable");

    // Permission : créateur ou admin
    if (existing.createdById !== session.user.id && !isAdmin(session)) {
      return forbidden();
    }

    await prisma.calendarEvent.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
