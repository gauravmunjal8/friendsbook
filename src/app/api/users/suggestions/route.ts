import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/suggestions - friends of friends not yet connected
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all current friend IDs
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: session.user.id, status: "ACCEPTED" },
        { addresseeId: session.user.id, status: "ACCEPTED" },
      ],
    },
    select: { requesterId: true, addresseeId: true },
  });

  const friendIds = friendships.map((f) =>
    f.requesterId === session.user.id ? f.addresseeId : f.requesterId
  );

  // Get all pending/existing relationship IDs (exclude from suggestions)
  const allRelationships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: session.user.id },
        { addresseeId: session.user.id },
      ],
    },
    select: { requesterId: true, addresseeId: true },
  });

  const excludedIds = new Set<string>([session.user.id]);
  allRelationships.forEach((f) => {
    excludedIds.add(f.requesterId);
    excludedIds.add(f.addresseeId);
  });

  let suggestions: { id: string; firstName: string; lastName: string; profilePicture: string | null; mutualCount: number }[] = [];

  if (friendIds.length > 0) {
    // Friends of friends
    const friendsOfFriends = await prisma.friendship.findMany({
      where: {
        AND: [
          {
            OR: [
              { requesterId: { in: friendIds }, status: "ACCEPTED" },
              { addresseeId: { in: friendIds }, status: "ACCEPTED" },
            ],
          },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    });

    // Count mutual friends per candidate
    const mutualMap = new Map<string, number>();
    friendsOfFriends.forEach((f) => {
      const candidate = friendIds.includes(f.requesterId) ? f.addresseeId : f.requesterId;
      if (!excludedIds.has(candidate)) {
        mutualMap.set(candidate, (mutualMap.get(candidate) ?? 0) + 1);
      }
    });

    if (mutualMap.size > 0) {
      const candidateIds = [...mutualMap.keys()].slice(0, 10);
      const users = await prisma.user.findMany({
        where: { id: { in: candidateIds } },
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      });

      suggestions = users.map((u) => ({
        ...u,
        mutualCount: mutualMap.get(u.id) ?? 0,
      })).sort((a, b) => b.mutualCount - a.mutualCount);
    }
  }

  // If not enough, pad with random users
  if (suggestions.length < 5) {
    const existing = new Set([...excludedIds, ...suggestions.map((s) => s.id)]);
    const random = await prisma.user.findMany({
      where: { id: { notIn: [...existing] } },
      select: { id: true, firstName: true, lastName: true, profilePicture: true },
      take: 5 - suggestions.length,
      orderBy: { createdAt: "desc" },
    });
    suggestions = [...suggestions, ...random.map((u) => ({ ...u, mutualCount: 0 }))];
  }

  return NextResponse.json({ suggestions: suggestions.slice(0, 6) });
}
