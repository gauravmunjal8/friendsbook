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

  if (!process.env.AWS_S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID) {
    return NextResponse.json(
      { error: "Image uploads are not configured yet." },
      { status: 503 }
    );
  }

  const result = await generatePresignedUploadUrl(safeFolder, contentType);
  return NextResponse.json(result);
}
