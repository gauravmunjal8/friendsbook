"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import type { PostWithDetails } from "@/types";

interface PostComposerProps {
  timelineOwnerId?: string;
  onPost: (post: PostWithDetails) => void;
}

export default function PostComposer({ timelineOwnerId, onPost }: PostComposerProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File): Promise<string> {
    const presignRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, folder: "posts" }),
    });
    const { uploadUrl, fileUrl } = await presignRes.json();

    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    return fileUrl;
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    const urls = await Promise.all(files.map(uploadFile));
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setPosting(true);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        images,
        timelineOwnerId,
      }),
    });

    const post = await res.json();
    setPosting(false);

    if (res.ok) {
      setContent("");
      setImages([]);
      setExpanded(false);
      onPost(post);
    }
  }

  if (!session) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <Avatar
          src={session.user.image}
          name={session.user.name ?? ""}
          size={40}
        />
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 bg-fb-gray rounded-full px-4 py-2.5 text-left text-fb-text-secondary text-sm hover:bg-gray-200 transition-colors"
          >
            What&apos;s on your mind, {session.user.name?.split(" ")[0]}?
          </button>
        ) : (
          <span className="text-sm font-medium">{session.user.name}</span>
        )}
      </div>

      {expanded && (
        <form onSubmit={handleSubmit} className="mt-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${session.user.name?.split(" ")[0]}?`}
            className="w-full resize-none text-lg focus:outline-none min-h-[80px] text-fb-text placeholder:text-fb-text-secondary"
            autoFocus
          />

          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((url, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <hr className="my-3 border-fb-border" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium text-green-600 transition-colors"
              >
                <PhotoIcon className="w-5 h-5" />
                Photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
              {uploading && (
                <span className="text-xs text-fb-text-secondary">Uploading...</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  setContent("");
                  setImages([]);
                }}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={posting || (!content.trim() && images.length === 0)}
                className="btn-primary text-sm px-4 py-1.5 disabled:opacity-60"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      )}

      {!expanded && (
        <>
          <hr className="my-3 border-fb-border" />
          <div className="flex justify-center">
            <button
              onClick={() => {
                setExpanded(true);
                fileRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium text-green-600 transition-colors"
            >
              <PhotoIcon className="w-5 h-5" />
              Photo
            </button>
          </div>
        </>
      )}
      <input
        ref={expanded ? undefined : fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  );
}

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
