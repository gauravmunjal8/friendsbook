import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, firstName, lastName, birthday } = body;

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthday: birthday ? new Date(birthday) : null,
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
