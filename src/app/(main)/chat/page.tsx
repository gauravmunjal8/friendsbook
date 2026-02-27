"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { fullName, formatRelativeTime } from "@/lib/utils";
import type { ConversationData, UserSummary } from "@/types";

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function openNewChat() {
    setShowNewChat(true);
    if (friends.length === 0) {
      const res = await fetch("/api/friends");
      const data = await res.json();
      setFriends(
        (data.friends ?? []).map((f: { id: string; firstName: string; lastName: string; profilePicture: string | null }) => ({
          id: f.id,
          firstName: f.firstName,
          lastName: f.lastName,
          profilePicture: f.profilePicture,
        }))
      );
    }
  }

  async function startChat(friendId: string) {
    setStarting(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
    const data = await res.json();
    router.push(`/chat/${data.conversation.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-fb-text">Messages</h1>
        <button
          onClick={openNewChat}
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          <PencilIcon className="w-4 h-4" />
          New Message
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <ChatBubbleIcon className="w-10 h-10 text-fb-text-secondary mx-auto" />
          <p className="font-semibold text-fb-text">No messages yet</p>
          <p className="text-sm text-fb-text-secondary">
            Start a conversation with one of your friends.
          </p>
          <button onClick={openNewChat} className="btn-primary text-sm mx-auto">
            Start a Chat
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-fb-border">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <Avatar
                src={conv.otherUser?.profilePicture}
                name={fullName(conv.otherUser?.firstName ?? "", conv.otherUser?.lastName ?? "")}
                size={48}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-fb-text truncate">
                  {fullName(conv.otherUser?.firstName ?? "", conv.otherUser?.lastName ?? "")}
                </p>
                {conv.lastMessage && (
                  <p className="text-sm text-fb-text-secondary truncate">
                    {conv.lastMessage.content}
                  </p>
                )}
              </div>
              {conv.lastMessage && (
                <span className="text-xs text-fb-text-secondary shrink-0">
                  {formatRelativeTime(conv.lastMessage.createdAt)}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* New chat modal */}
      {showNewChat && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewChat(false)}
        >
          <div
            className="card w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-fb-text text-lg">New Message</h2>
            {friends.length === 0 ? (
              <p className="text-sm text-fb-text-secondary text-center py-4">
                No friends yet. Add some friends first!
              </p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {friends.map((f) => (
                  <button
                    key={f.id}
                    disabled={starting}
                    onClick={() => startChat(f.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-left"
                  >
                    <Avatar
                      src={f.profilePicture}
                      name={fullName(f.firstName, f.lastName)}
                      size={40}
                    />
                    <span className="font-medium text-fb-text text-sm">
                      {fullName(f.firstName, f.lastName)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowNewChat(false)}
              className="btn-secondary w-full text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.46c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  );
}
