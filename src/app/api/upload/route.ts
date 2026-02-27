import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generatePresignedUploadUrl } from "@/lib/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contentType, folder } = await req.json();

  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const allowedFolders = ["profiles", "covers", "posts"];
  const safeFolder = allowedFolders.includes(folder) ? folder : "posts";

  const result = await generatePresignedUploadUrl(safeFolder, contentType);
  return NextResponse.json(result);
}
