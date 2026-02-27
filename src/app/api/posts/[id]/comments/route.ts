import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/posts/[id]/comments
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comments = await prisma.comment.findMany({
    where: { postId: params.id },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

// POST /api/posts/[id]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId: params.id,
      authorId: session.user.id,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
    },
  });

  // Notify post author (not self-comments)
  if (post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        recipientId: post.authorId,
        actorId: session.user.id,
        type: "POST_COMMENTED",
        postId: params.id,
      },
    });
  }

  return NextResponse.json(comment, { status: 201 });
}

// DELETE /api/posts/[id]/comments/[commentId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await req.json();

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (comment.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ success: true });
}
