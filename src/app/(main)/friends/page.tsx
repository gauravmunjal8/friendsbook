"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { fullName } from "@/lib/utils";

interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}

interface FriendRequest {
  id: string;
  requester: UserSummary;
}

type Tab = "requests" | "friends";

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === "requests") {
      fetch("/api/friends?type=requests")
        .then((r) => r.json())
        .then(({ requests }) => {
          setRequests(requests);
          setLoading(false);
        });
    } else {
      fetch("/api/friends")
        .then((r) => r.json())
        .then(({ friends }) => {
          setFriends(friends);
          setLoading(false);
        });
    }
  }, [tab]);

  async function respond(friendshipId: string, action: "accept" | "reject") {
    await fetch(`/api/friends/${friendshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-fb-text">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["requests", "friends"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? "bg-fb-blue-light text-fb-blue"
                : "bg-white text-fb-text-secondary hover:bg-gray-100"
            }`}
          >
            {t === "requests" ? "Friend Requests" : "All Friends"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="w-full h-28 bg-gray-200 rounded-md mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto" />
            </div>
          ))}
        </div>
      ) : tab === "requests" ? (
        requests.length === 0 ? (
          <div className="card p-8 text-center text-fb-text-secondary">
            No pending friend requests.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {requests.map((req) => (
              <div key={req.id} className="card p-4 flex flex-col items-center">
                <Link href={`/profile/${req.requester.id}`}>
                  <Avatar
                    src={req.requester.profilePicture}
                    name={fullName(req.requester.firstName, req.requester.lastName)}
                    size={80}
                  />
                </Link>
                <Link
                  href={`/profile/${req.requester.id}`}
                  className="mt-2 text-sm font-semibold text-center hover:underline"
                >
                  {fullName(req.requester.firstName, req.requester.lastName)}
                </Link>
                <div className="flex flex-col gap-1.5 mt-3 w-full">
                  <button
                    onClick={() => respond(req.id, "accept")}
                    className="btn-primary text-sm w-full"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => respond(req.id, "reject")}
                    className="btn-secondary text-sm w-full"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : friends.length === 0 ? (
        <div className="card p-8 text-center text-fb-text-secondary">
          <p className="mb-2">No friends yet.</p>
          <Link href="/search" className="text-fb-blue hover:underline text-sm">
            Search for people you know
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <div key={friend.id} className="card p-4 flex flex-col items-center">
              <Link href={`/profile/${friend.id}`}>
                <Avatar
                  src={friend.profilePicture}
                  name={fullName(friend.firstName, friend.lastName)}
                  size={80}
                />
              </Link>
              <Link
                href={`/profile/${friend.id}`}
                className="mt-2 text-sm font-semibold text-center hover:underline"
              >
                {fullName(friend.firstName, friend.lastName)}
              </Link>
              <Link
                href={`/profile/${friend.id}`}
                className="btn-secondary text-sm w-full text-center mt-3"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
