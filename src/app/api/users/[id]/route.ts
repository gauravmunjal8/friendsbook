import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      birthday: true,
      hometown: true,
      bio: true,
      profilePicture: true,
      coverPhoto: true,
      createdAt: true,
      _count: {
        select: {
          sentRequests: {
            where: { status: "ACCEPTED" },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Determine friendship status between viewer and this profile
  let friendshipStatus: {
    status: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED";
    friendshipId?: string;
  } = { status: "NONE" };

  if (id !== session.user.id) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: id },
          { requesterId: id, addresseeId: session.user.id },
        ],
      },
    });

    if (friendship) {
      if (friendship.status === "ACCEPTED") {
        friendshipStatus = { status: "ACCEPTED", friendshipId: friendship.id };
      } else if (friendship.requesterId === session.user.id) {
        friendshipStatus = {
          status: "PENDING_SENT",
          friendshipId: friendship.id,
        };
      } else {
        friendshipStatus = {
          status: "PENDING_RECEIVED",
          friendshipId: friendship.id,
        };
      }
    }
  }

  return NextResponse.json({ ...user, friendshipStatus });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.id !== params.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { firstName, lastName, birthday, hometown, bio, profilePicture, coverPhoto } = body;

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(firstName && { firstName: firstName.trim() }),
      ...(lastName && { lastName: lastName.trim() }),
      ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
      ...(hometown !== undefined && { hometown }),
      ...(bio !== undefined && { bio }),
      ...(profilePicture !== undefined && { profilePicture }),
      ...(coverPhoto !== undefined && { coverPhoto }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePicture: true,
      coverPhoto: true,
      hometown: true,
      bio: true,
      birthday: true,
    },
  });

  return NextResponse.json(updated);
}
