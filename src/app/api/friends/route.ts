import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/friends - get current user's friends and pending requests
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type"); // "friends" | "requests" | "sent"

  if (type === "requests") {
    // Incoming pending requests
    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: session.user.id,
        status: "PENDING",
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  }

  if (type === "sent") {
    const sent = await prisma.friendship.findMany({
      where: {
        requesterId: session.user.id,
        status: "PENDING",
      },
      include: {
        addressee: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
    });
    return NextResponse.json({ sent });
  }

  // Default: accepted friends
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: session.user.id, status: "ACCEPTED" },
        { addresseeId: session.user.id, status: "ACCEPTED" },
      ],
    },
    include: {
      requester: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
      addressee: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
    },
  });

  const friends = friendships.map((f) =>
    f.requesterId === session.user.id ? f.addressee : f.requester
  );

  return NextResponse.json({ friends });
}

// POST /api/friends - send a friend request
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { addresseeId } = await req.json();

  if (!addresseeId || addresseeId === session.user.id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Check target user exists
  const target = await prisma.user.findUnique({ where: { id: addresseeId } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check no existing friendship
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId },
        { requesterId: addresseeId, addresseeId: session.user.id },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Friendship already exists" }, { status: 409 });
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: session.user.id,
      addresseeId,
      status: "PENDING",
    },
  });

  // Notify the addressee of the friend request
  await prisma.notification.create({
    data: {
      recipientId: addresseeId,
      actorId: session.user.id,
      type: "FRIEND_REQUEST",
    },
  });

  return NextResponse.json({ friendship }, { status: 201 });
}
