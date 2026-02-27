import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const terms = q.split(/\s+/).filter(Boolean);

  const users = await prisma.user.findMany({
    where: {
      AND: terms.map((term) => ({
        OR: [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
        ],
      })),
      NOT: { id: session.user.id },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePicture: true,
      hometown: true,
    },
    take: 20,
  });

  return NextResponse.json({ users });
}
