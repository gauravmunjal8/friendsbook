import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = params;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = 15;

  const posts = await prisma.post.findMany({
    where: {
      timelineOwnerId: userId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
      timelineOwner: {
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      },
      _count: { select: { likes: true, comments: true } },
      likes: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const postsWithLiked = posts.map(({ likes, ...post }) => ({
    ...post,
    liked: likes.length > 0,
  }));

  const nextCursor =
    posts.length === limit
      ? posts[posts.length - 1].createdAt.toISOString()
      : null;

  return NextResponse.json({ posts: postsWithLiked, nextCursor });
}
