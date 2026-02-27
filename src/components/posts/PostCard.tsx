"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import ImageLightbox from "@/components/ui/ImageLightbox";
import CommentSection from "./CommentSection";
import { formatRelativeTime, fullName } from "@/lib/utils";
import type { PostWithDetails } from "@/types";

interface PostCardProps {
  post: PostWithDetails;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, content: string) => void;
}

export default function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? "");
  const [currentContent, setCurrentContent] = useState(post.content ?? "");
  const [saving, setSaving] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function toggleLike() {
    setLiked((l) => !l);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.count);
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    onDelete?.(post.id);
  }

  async function handleSaveEdit() {
    if (!editContent.trim() && post.images.length === 0) return;
    setSaving(true);
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) {
      const trimmed = editContent.trim();
      setCurrentContent(trimmed);
      onUpdate?.(post.id, trimmed);
      setEditing(false);
    }
    setSaving(false);
  }

  const canDelete =
    session?.user.id === post.author.id ||
    session?.user.id === post.timelineOwner.id;
  const canEdit = session?.user.id === post.author.id;
  const showTimelineContext = post.timelineOwner.id !== post.author.id;

  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-0">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar
                src={post.author.profilePicture}
                name={fullName(post.author.firstName, post.author.lastName)}
                size={40}
              />
            </Link>
            <div>
              <div className="text-sm">
                <Link
                  href={`/profile/${post.author.id}`}
                  className="font-semibold hover:underline"
                >
                  {fullName(post.author.firstName, post.author.lastName)}
                </Link>
                {showTimelineContext && (
                  <>
                    {" "}
                    <span className="text-fb-text-secondary">wrote on</span>{" "}
                    <Link
                      href={`/profile/${post.timelineOwner.id}`}
                      className="font-semibold hover:underline"
                    >
                      {fullName(
                        post.timelineOwner.firstName,
                        post.timelineOwner.lastName
                      )}
                      &apos;s timeline
                    </Link>
                  </>
                )}
              </div>
              <div className="text-xs text-fb-text-secondary">
                {formatRelativeTime(post.createdAt)}
              </div>
            </div>
          </div>

          {(canEdit || canDelete) && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <DotsIcon className="w-5 h-5 text-fb-text-secondary" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 w-44 card py-1 shadow-lg z-10">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditing(true);
                        setEditContent(currentContent);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Edit post
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Delete post
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pt-3">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-none border border-fb-border rounded-md px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-fb-blue min-h-[80px]"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditContent(currentContent);
                  }}
                  className="btn-secondary text-sm px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="btn-primary text-sm px-4 py-1.5 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            currentContent && (
              <p className="text-fb-text whitespace-pre-wrap text-[15px] mb-3">
                {currentContent}
              </p>
            )
          )}

          {/* Images grid */}
          {post.images.length > 0 && (
            <div
              className={`grid gap-1 mb-3 ${
                post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {post.images.slice(0, 4).map((url, i) => (
                <div
                  key={i}
                  className={`relative cursor-pointer overflow-hidden rounded-md ${
                    post.images.length === 3 && i === 0 ? "col-span-2" : ""
                  }`}
                  onClick={() => setLightboxIndex(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="w-full max-h-80 object-cover hover:brightness-90 transition-[filter]"
                  />
                  {post.images.length > 4 && i === 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold rounded-md">
                      +{post.images.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Counts row */}
        {(likeCount > 0 || commentCount > 0) && (
          <div className="flex items-center justify-between px-4 py-1 text-sm text-fb-text-secondary">
            {likeCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-flex w-5 h-5 bg-fb-blue rounded-full items-center justify-center text-white text-[10px]">
                  👍
                </span>
                {likeCount}
              </span>
            )}
            {commentCount > 0 && (
              <button
                onClick={() => setShowComments((s) => !s)}
                className="hover:underline ml-auto"
              >
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex border-t border-fb-border mx-4">
          <button
            onClick={toggleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors ${
              liked ? "text-fb-blue" : "text-fb-text-secondary"
            }`}
          >
            <ThumbIcon className="w-5 h-5" />
            Like
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-fb-text-secondary hover:bg-gray-100 transition-colors"
          >
            <CommentIcon className="w-5 h-5" />
            Comment
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <CommentSection
            postId={post.id}
            onCommentAdded={() => setCommentCount((c) => c + 1)}
            onCommentDeleted={() => setCommentCount((c) => Math.max(0, c - 1))}
          />
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={post.images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex((i) =>
              i! > 0 ? i! - 1 : post.images.length - 1
            )
          }
          onNext={() =>
            setLightboxIndex((i) =>
              i! < post.images.length - 1 ? i! + 1 : 0
            )
          }
        />
      )}
    </>
  );
}

function ThumbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}
function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
    </svg>
  );
}
function DotsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}
