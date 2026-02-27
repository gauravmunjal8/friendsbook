"use client";

import { useState, useEffect, useCallback } from "react";
import PostComposer from "@/components/posts/PostComposer";
import PostCard from "@/components/posts/PostCard";
import FriendRequestsSidebar from "@/components/friends/FriendRequestsSidebar";
import SuggestedPeople from "@/components/friends/SuggestedPeople";
import type { PostWithDetails } from "@/types";

export default function FeedPage() {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async (cursorParam?: string) => {
    setLoading(true);
    const url = `/api/posts/feed${cursorParam ? `?cursor=${cursorParam}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    setPosts((prev) => (cursorParam ? [...prev, ...data.posts] : data.posts));
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  function handleNewPost(post: PostWithDetails) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleUpdate(id: string, content: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content } : p))
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
      {/* Left sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="card p-4 sticky top-20">
          <h3 className="font-semibold text-fb-text mb-3">Sponsored</h3>
          <p className="text-xs text-fb-text-secondary">
            Your ads could be here.
          </p>
        </div>
      </aside>

      {/* Feed */}
      <div className="flex-1 max-w-xl mx-auto space-y-4">
        <PostComposer onPost={handleNewPost} />

        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-fb-text-secondary text-lg mb-2">No posts yet</p>
            <p className="text-fb-text-secondary text-sm">
              Add friends to see their updates, or post something yourself!
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}

            {hasMore && (
              <button
                onClick={() => loadPosts(cursor ?? undefined)}
                disabled={loading}
                className="w-full btn-secondary py-2.5"
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="hidden xl:block w-72 shrink-0 space-y-4">
        <FriendRequestsSidebar />
        <SuggestedPeople />
      </aside>
    </div>
  );
}
