"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { fullName, formatRelativeTime } from "@/lib/utils";
import { getPusherClient } from "@/lib/pusherClient";
import type { MessageData, UserSummary } from "@/types";

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [otherUser, setOtherUser] = useState<UserSummary | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(
    async (cursor?: string) => {
      const url = `/api/conversations/${id}/messages${cursor ? `?cursor=${cursor}` : ""}`;
      const res = await fetch(url);
      if (res.status === 403) {
        router.push("/chat");
        return;
      }
      const data = await res.json();
      return data;
    },
    [id, router]
  );

  // Initial load — also get conversation participants to find otherUser
  useEffect(() => {
    async function init() {
      setLoading(true);

      // Fetch conversations list to identify the other user
      const convRes = await fetch("/api/conversations");
      const convData = await convRes.json();
      const conv = (convData.conversations ?? []).find((c: { id: string }) => c.id === id);
      if (conv) setOtherUser(conv.otherUser);

      const data = await fetchMessages();
      if (data) {
        setMessages(data.messages);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    }
    init();
  }, [id, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Pusher subscription
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-conversation-${id}`);
    channel.bind("new-message", (msg: MessageData) => {
      // Only add if the message is from the other person (sender added own messages optimistically)
      if (msg.senderId !== session?.user.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-conversation-${id}`);
    };
  }, [id, session?.user.id]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchMessages(nextCursor);
    if (data) {
      setMessages((prev) => [...data.messages, ...prev]);
      setNextCursor(data.nextCursor);
    }
    setLoadingMore(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);

    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok && data.message) {
      // Optimistically add own message
      setMessages((prev) => [...prev, data.message]);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  const otherName = fullName(otherUser?.firstName ?? "", otherUser?.lastName ?? "");

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-fb-border bg-white shrink-0">
        <Link href="/chat" className="text-fb-text-secondary hover:text-fb-text mr-1">
          <BackIcon className="w-5 h-5" />
        </Link>
        {otherUser && (
          <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-3">
            <Avatar src={otherUser.profilePicture} name={otherName} size={40} />
            <span className="font-semibold text-fb-text">{otherName}</span>
          </Link>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {nextCursor && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full text-center text-xs text-fb-text-secondary hover:text-fb-text py-2"
          >
            {loadingMore ? "Loading..." : "Load earlier messages"}
          </button>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div className="h-8 bg-gray-200 rounded-2xl animate-pulse w-40" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-10">
            <Avatar src={otherUser?.profilePicture} name={otherName} size={64} />
            <p className="font-semibold text-fb-text">{otherName}</p>
            <p className="text-sm text-fb-text-secondary">
              Say hi to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.senderId === session?.user.id;
            const showTime =
              i === messages.length - 1 ||
              new Date(messages[i + 1].createdAt).getTime() -
                new Date(msg.createdAt).getTime() >
                5 * 60 * 1000;
            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-xs sm:max-w-sm px-4 py-2 rounded-2xl text-sm break-words ${
                    isOwn
                      ? "bg-fb-blue text-white rounded-br-sm"
                      : "bg-gray-100 text-fb-text rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {showTime && (
                  <span className="text-xs text-fb-text-secondary mt-1 px-1">
                    {formatRelativeTime(msg.createdAt)}
                  </span>
                )}
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-4 py-3 border-t border-fb-border bg-white shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${otherUser?.firstName ?? ""}...`}
          className="flex-1 bg-fb-gray rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fb-blue"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-full bg-fb-blue text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors shrink-0"
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
