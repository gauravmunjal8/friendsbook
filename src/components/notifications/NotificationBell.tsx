"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { formatRelativeTime, fullName } from "@/lib/utils";

interface NotificationActor {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}

interface Notification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor: NotificationActor;
  post: { id: string; content: string | null } | null;
}

function notificationText(n: Notification): string {
  const name = fullName(n.actor.firstName, n.actor.lastName);
  switch (n.type) {
    case "FRIEND_REQUEST":
      return `${name} sent you a friend request.`;
    case "FRIEND_ACCEPTED":
      return `${name} accepted your friend request.`;
    case "POST_LIKED":
      return `${name} liked your post.`;
    case "POST_COMMENTED":
      return `${name} commented on your post.`;
    case "TIMELINE_POST":
      return `${name} posted on your timeline.`;
    default:
      return `${name} did something.`;
  }
}

function notificationHref(n: Notification): string {
  if (n.type === "FRIEND_REQUEST" || n.type === "FRIEND_ACCEPTED") {
    return `/profile/${n.actor.id}`;
  }
  if (n.post) return `/feed`;
  return `/profile/${n.actor.id}`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
  }

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      setUnreadCount(0);
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5 text-fb-text" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 card shadow-lg z-50 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-fb-border">
            <h3 className="font-bold text-lg">Notifications</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-fb-text-secondary">
              No notifications yet.
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={notificationHref(n)}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !n.read ? "bg-fb-blue-light" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={n.actor.profilePicture}
                      name={fullName(n.actor.firstName, n.actor.lastName)}
                      size={44}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 text-base leading-none">
                      {n.type === "FRIEND_REQUEST" || n.type === "FRIEND_ACCEPTED"
                        ? "👥"
                        : n.type === "POST_LIKED"
                        ? "👍"
                        : n.type === "POST_COMMENTED"
                        ? "💬"
                        : "📝"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-fb-text leading-snug">
                      {notificationText(n)}
                    </p>
                    <p className="text-xs text-fb-blue mt-0.5">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2.5 h-2.5 bg-fb-blue rounded-full shrink-0 mt-1.5" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}
