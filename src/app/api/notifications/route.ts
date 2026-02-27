import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications - fetch latest notifications for current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: session.user.id },
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
        post: {
          select: { id: true, content: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({
      where: { recipientId: session.user.id, read: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
