import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/conversations — list all conversations for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, profilePicture: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, profilePicture: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = conversations.map((conv) => {
    const otherParticipant = conv.participants.find((p) => p.userId !== session.user.id);
    return {
      id: conv.id,
      updatedAt: conv.updatedAt,
      otherUser: otherParticipant?.user ?? null,
      lastMessage: conv.messages[0] ?? null,
    };
  });

  return NextResponse.json({ conversations: result });
}

// POST /api/conversations — find or create a 1-on-1 conversation with a friend
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friendId } = await req.json();
  if (!friendId) return NextResponse.json({ error: "friendId required" }, { status: 400 });

  // Must be friends
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId: friendId, status: "ACCEPTED" },
        { requesterId: friendId, addresseeId: session.user.id, status: "ACCEPTED" },
      ],
    },
  });
  if (!friendship) {
    return NextResponse.json({ error: "You can only message friends" }, { status: 403 });
  }

  // Find existing conversation between just these two people
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: friendId } } },
      ],
    },
    include: { participants: true },
  });

  if (existing && existing.participants.length === 2) {
    return NextResponse.json({ conversation: existing });
  }

  // Create a new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: session.user.id }, { userId: friendId }],
      },
    },
    include: { participants: true },
  });

  return NextResponse.json({ conversation });
}
