import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export async function generatePresignedUploadUrl(
  folder: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const ext = contentType.split("/")[1] ?? "jpg";
  const key = `${folder}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  const fileUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
}

export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3Client.send(command);
}
