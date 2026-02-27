import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

// POST /api/posts - create a new post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, images, timelineOwnerId } = await req.json();

  if (!content?.trim() && (!images || images.length === 0)) {
    return NextResponse.json({ error: "Post must have content or images" }, { status: 400 });
  }

  const ownerId = timelineOwnerId || session.user.id;

  // If posting on someone else's timeline, they must be friends
  if (ownerId !== session.user.id) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: ownerId, status: "ACCEPTED" },
          { requesterId: ownerId, addresseeId: session.user.id, status: "ACCEPTED" },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "You can only post on friends' timelines" },
        { status: 403 }
      );
    }
  }

  const post = await prisma.post.create({
    data: {
      content: content?.trim() || null,
      images: images || [],
      authorId: session.user.id,
      timelineOwnerId: ownerId,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
      timelineOwner: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  // Notify timeline owner if someone posts on their timeline
  if (ownerId !== session.user.id) {
    await prisma.notification.create({
      data: {
        recipientId: ownerId,
        actorId: session.user.id,
        type: "TIMELINE_POST",
        postId: post.id,
      },
    });

    const [owner, actor] = await Promise.all([
      prisma.user.findUnique({
        where: { id: ownerId },
        select: { email: true, firstName: true, lastName: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, lastName: true },
      }),
    ]);
    if (owner && actor) {
      sendNotificationEmail(
        owner.email,
        `${owner.firstName} ${owner.lastName}`,
        `${actor.firstName} ${actor.lastName}`,
        "TIMELINE_POST"
      ).catch(() => {});
    }
  }

  return NextResponse.json({ ...post, liked: false }, { status: 201 });
}
