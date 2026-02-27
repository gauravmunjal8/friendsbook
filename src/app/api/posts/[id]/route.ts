import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/posts/[id] - edit post content
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { content } = await req.json();

  if (!content?.trim() && post.images.length === 0) {
    return NextResponse.json({ error: "Post must have content or images" }, { status: 400 });
  }

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: { content: content?.trim() || null },
    select: { id: true, content: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/posts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the author or the timeline owner can delete
  if (post.authorId !== session.user.id && post.timelineOwnerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
