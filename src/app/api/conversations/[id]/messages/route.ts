import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPusherServer } from "@/lib/pusher";

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!participant;
}

// GET /api/conversations/[id]/messages — paginated message history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await assertParticipant(params.id, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = 30;

  const messages = await prisma.message.findMany({
    where: {
      conversationId: params.id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Mark unread messages (sent by others) as read
  await prisma.message.updateMany({
    where: {
      conversationId: params.id,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  const nextCursor =
    messages.length === limit ? messages[messages.length - 1].createdAt.toISOString() : null;

  return NextResponse.json({ messages: messages.reverse(), nextCursor });
}

// POST /api/conversations/[id]/messages — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await assertParticipant(params.id, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: session.user.id,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
    }),
    prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  // Trigger real-time event
  getPusherServer()
    .trigger(`private-conversation-${params.id}`, "new-message", message)
    .catch(() => {});

  return NextResponse.json({ message });
}
