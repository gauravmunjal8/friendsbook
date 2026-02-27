import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[id]/friends - get the friends of a given user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: params.id, status: "ACCEPTED" },
        { addresseeId: params.id, status: "ACCEPTED" },
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
    take: 9,
  });

  const friends = friendships.map((f) =>
    f.requesterId === params.id ? f.addressee : f.requester
  );

  const total = await prisma.friendship.count({
    where: {
      OR: [
        { requesterId: params.id, status: "ACCEPTED" },
        { addresseeId: params.id, status: "ACCEPTED" },
      ],
    },
  });

  return NextResponse.json({ friends, total });
}
