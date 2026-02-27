"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { formatRelativeTime, fullName } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types";

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}

export default function CommentSection({
  postId,
  onCommentAdded,
  onCommentDeleted,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then(({ comments }) => {
        setComments(comments);
        setLoading(false);
      });
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    const comment = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setComments((prev) => [...prev, comment]);
      setText("");
      onCommentAdded();
    }
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentDeleted();
    }
  }

  return (
    <div className="px-4 pb-3 border-t border-fb-border">
      {loading ? (
        <p className="text-sm text-fb-text-secondary py-2">Loading comments...</p>
      ) : (
        <div className="space-y-3 pt-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 group">
              <Link href={`/profile/${c.author.id}`} className="shrink-0">
                <Avatar
                  src={c.author.profilePicture}
                  name={fullName(c.author.firstName, c.author.lastName)}
                  size={32}
                />
              </Link>
              <div className="flex-1">
                <div className="bg-fb-gray rounded-2xl px-3 py-2 inline-block max-w-full">
                  <Link
                    href={`/profile/${c.author.id}`}
                    className="text-xs font-semibold hover:underline block"
                  >
                    {fullName(c.author.firstName, c.author.lastName)}
                  </Link>
                  <p className="text-sm break-words">{c.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-0.5 ml-2">
                  <span className="text-xs text-fb-text-secondary">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                  {session?.user.id === c.author.id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {session && (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-3 items-center">
          <Avatar
            src={session.user.image}
            name={session.user.name ?? ""}
            size={32}
          />
          <div className="flex-1 relative">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-fb-gray rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fb-blue pr-10"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-fb-blue disabled:text-fb-gray-mid"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
