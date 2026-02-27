import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/friends/[id] - accept or reject a friend request
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json(); // "accept" | "reject"

  const friendship = await prisma.friendship.findUnique({
    where: { id: params.id },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the addressee can accept/reject
  if (friendship.addresseeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "accept") {
    const updated = await prisma.friendship.update({
      where: { id: params.id },
      data: { status: "ACCEPTED" },
    });

    // Notify the original requester that their request was accepted
    await prisma.notification.create({
      data: {
        recipientId: friendship.requesterId,
        actorId: session.user.id,
        type: "FRIEND_ACCEPTED",
      },
    });

    return NextResponse.json({ friendship: updated });
  }

  if (action === "reject") {
    await prisma.friendship.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// DELETE /api/friends/[id] - unfriend or cancel request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friendship = await prisma.friendship.findUnique({
    where: { id: params.id },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    friendship.requesterId !== session.user.id &&
    friendship.addresseeId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.friendship.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
