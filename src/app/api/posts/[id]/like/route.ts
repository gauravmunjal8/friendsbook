import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

// POST /api/posts/[id]/like - toggle like
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    const count = await prisma.like.count({ where: { postId: params.id } });
    return NextResponse.json({ liked: false, count });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });

  await prisma.like.create({
    data: { postId: params.id, userId: session.user.id },
  });

  // Notify post author (not self-likes)
  if (post && post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        recipientId: post.authorId,
        actorId: session.user.id,
        type: "POST_LIKED",
        postId: params.id,
      },
    });

    const [author, actor] = await Promise.all([
      prisma.user.findUnique({
        where: { id: post.authorId },
        select: { email: true, firstName: true, lastName: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, lastName: true },
      }),
    ]);
    if (author && actor) {
      sendNotificationEmail(
        author.email,
        `${author.firstName} ${author.lastName}`,
        `${actor.firstName} ${actor.lastName}`,
        "POST_LIKED"
      ).catch(() => {});
    }
  }

  const count = await prisma.like.count({ where: { postId: params.id } });
  return NextResponse.json({ liked: true, count });
}
