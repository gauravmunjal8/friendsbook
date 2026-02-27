"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import PostComposer from "@/components/posts/PostComposer";
import PostCard from "@/components/posts/PostCard";
import Avatar from "@/components/ui/Avatar";
import EditProfileModal from "@/components/profile/EditProfileModal";
import FriendsWidget from "@/components/profile/FriendsWidget";
import { fullName } from "@/lib/utils";
import type { ProfileData, PostWithDetails } from "@/types";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsRestricted, setPostsRestricted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);

  const isOwnProfile = session?.user.id === id;

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then(setProfile);
  }, [id]);

  const loadPosts = useCallback(
    async (cursorParam?: string) => {
      setLoadingPosts(true);
      if (!cursorParam) setPostsRestricted(false);
      const url = `/api/posts/timeline/${id}${cursorParam ? `?cursor=${cursorParam}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.restricted) {
        setPostsRestricted(true);
        setLoadingPosts(false);
        return;
      }
      setPosts((prev) => (cursorParam ? [...prev, ...data.posts] : data.posts));
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setLoadingPosts(false);
    },
    [id]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function sendFriendRequest() {
    setFriendLoading(true);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresseeId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile((p) =>
        p
          ? {
              ...p,
              friendshipStatus: {
                status: "PENDING_SENT",
                friendshipId: data.friendship.id,
              },
            }
          : p
      );
    }
    setFriendLoading(false);
  }

  async function cancelOrUnfriend() {
    if (!profile?.friendshipStatus.friendshipId) return;
    setFriendLoading(true);
    await fetch(`/api/friends/${profile.friendshipStatus.friendshipId}`, {
      method: "DELETE",
    });
    setProfile((p) =>
      p ? { ...p, friendshipStatus: { status: "NONE" } } : p
    );
    setFriendLoading(false);
  }

  async function acceptRequest() {
    if (!profile?.friendshipStatus.friendshipId) return;
    setFriendLoading(true);
    await fetch(`/api/friends/${profile.friendshipStatus.friendshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    setProfile((p) =>
      p
        ? {
            ...p,
            friendshipStatus: {
              status: "ACCEPTED",
              friendshipId: p.friendshipStatus.friendshipId,
            },
          }
        : p
    );
    loadPosts();
    setFriendLoading(false);
  }

  function handleNewPost(post: PostWithDetails) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleDelete(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleUpdate(postId: string, content: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content } : p))
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
        <div className="h-48 bg-gray-300 rounded-b-lg mb-16" />
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
      </div>
    );
  }

  const friendStatus = profile.friendshipStatus.status;
  const canPost =
    isOwnProfile || friendStatus === "ACCEPTED";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover photo */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-br from-fb-blue to-blue-400 rounded-b-lg overflow-hidden">
        {profile.coverPhoto && (
          <Image
            src={profile.coverPhoto}
            alt="Cover"
            fill
            className="object-cover"
          />
        )}
        {isOwnProfile && (
          <button
            onClick={() => setEditOpen(true)}
            className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-sm font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow"
          >
            <CameraIcon className="w-4 h-4" />
            Edit cover
          </button>
        )}
      </div>

      {/* Profile header */}
      <div className="px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16 mb-4">
          <div className="relative shrink-0">
            <Avatar
              src={profile.profilePicture}
              name={fullName(profile.firstName, profile.lastName)}
              size={120}
              className="ring-4 ring-white"
            />
            {isOwnProfile && (
              <button
                onClick={() => setEditOpen(true)}
                className="absolute bottom-1 right-1 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center shadow"
              >
                <CameraIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-fb-text">
              {fullName(profile.firstName, profile.lastName)}
            </h1>
            {profile.bio && (
              <p className="text-fb-text-secondary text-sm mt-0.5">{profile.bio}</p>
            )}
            {profile.hometown && (
              <p className="text-fb-text-secondary text-sm">
                📍 {profile.hometown}
              </p>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            {isOwnProfile ? (
              <button
                onClick={() => setEditOpen(true)}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <EditIcon className="w-4 h-4" />
                Edit profile
              </button>
            ) : (
              <>
                {friendStatus === "NONE" && (
                  <button
                    onClick={sendFriendRequest}
                    disabled={friendLoading}
                    className="btn-primary flex items-center gap-1.5 text-sm"
                  >
                    <AddFriendIcon className="w-4 h-4" />
                    Add Friend
                  </button>
                )}
                {friendStatus === "PENDING_SENT" && (
                  <button
                    onClick={cancelOrUnfriend}
                    disabled={friendLoading}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                  >
                    Cancel Request
                  </button>
                )}
                {friendStatus === "PENDING_RECEIVED" && (
                  <div className="flex gap-2">
                    <button
                      onClick={acceptRequest}
                      disabled={friendLoading}
                      className="btn-primary text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={cancelOrUnfriend}
                      disabled={friendLoading}
                      className="btn-secondary text-sm"
                    >
                      Decline
                    </button>
                  </div>
                )}
                {friendStatus === "ACCEPTED" && (
                  <>
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/conversations", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ friendId: id }),
                        });
                        const data = await res.json();
                        router.push(`/chat/${data.conversation.id}`);
                      }}
                      className="btn-primary flex items-center gap-1.5 text-sm"
                    >
                      <MessageIcon className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={cancelOrUnfriend}
                      disabled={friendLoading}
                      className="btn-secondary flex items-center gap-1.5 text-sm"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Friends
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <hr className="border-fb-border mb-6" />
      </div>

      {/* Main content */}
      <div className="px-4 sm:px-8 pb-8 flex gap-6">
        {/* Intro sidebar */}
        <aside className="hidden md:block w-64 shrink-0 space-y-4">
          <FriendsWidget userId={id} />
          <div className="card p-4">
            <h3 className="font-bold text-fb-text text-lg mb-3">Intro</h3>
            {profile.bio && (
              <p className="text-sm text-fb-text text-center mb-3">{profile.bio}</p>
            )}
            <div className="space-y-2 text-sm text-fb-text-secondary">
              {profile.hometown && (
                <div className="flex items-center gap-2">
                  <span>📍</span> Lives in {profile.hometown}
                </div>
              )}
              {profile.birthday && (
                <div className="flex items-center gap-2">
                  <span>🎂</span>{" "}
                  {new Date(profile.birthday).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span>📅</span> Joined{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Timeline */}
        <div className="flex-1 space-y-4">
          {canPost && (
            <PostComposer
              timelineOwnerId={id}
              onPost={handleNewPost}
            />
          )}

          {loadingPosts && posts.length === 0 ? (
            <div className="card p-4 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ) : postsRestricted ? (
            <div className="card p-8 text-center space-y-2">
              <LockIcon className="w-8 h-8 text-fb-text-secondary mx-auto" />
              <p className="font-semibold text-fb-text">
                {fullName(profile.firstName, profile.lastName)}&apos;s posts are friends only
              </p>
              <p className="text-sm text-fb-text-secondary">
                Add {profile.firstName} as a friend to see their posts and updates.
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-fb-text-secondary">No posts yet.</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={handleDelete} onUpdate={handleUpdate} />
              ))}
              {hasMore && (
                <button
                  onClick={() => loadPosts(cursor ?? undefined)}
                  disabled={loadingPosts}
                  className="w-full btn-secondary py-2.5"
                >
                  {loadingPosts ? "Loading..." : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={(updated) => {
            setProfile((p) => (p ? { ...p, ...updated } : p));
            update({ name: `${updated.firstName} ${updated.lastName}`, image: updated.profilePicture });
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4z" />
      <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function AddFriendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );
}
