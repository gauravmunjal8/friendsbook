"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { fullName } from "@/lib/utils";

interface FriendRequest {
  id: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
}

export default function FriendRequestsSidebar() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friends?type=requests")
      .then((r) => r.json())
      .then(({ requests }) => {
        setRequests(requests);
        setLoading(false);
      });
  }, []);

  async function respond(friendshipId: string, action: "accept" | "reject") {
    await fetch(`/api/friends/${friendshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  }

  if (loading) return null;

  return (
    <div className="card p-4 sticky top-20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-fb-text">Friend Requests</h3>
        <Link href="/friends" className="text-fb-blue text-sm hover:underline">
          See all
        </Link>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-fb-text-secondary">No pending requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.slice(0, 5).map((req) => (
            <div key={req.id} className="flex gap-2">
              <Link href={`/profile/${req.requester.id}`} className="shrink-0">
                <Avatar
                  src={req.requester.profilePicture}
                  name={fullName(req.requester.firstName, req.requester.lastName)}
                  size={56}
                />
              </Link>
              <div className="flex-1">
                <Link
                  href={`/profile/${req.requester.id}`}
                  className="text-sm font-semibold hover:underline"
                >
                  {fullName(req.requester.firstName, req.requester.lastName)}
                </Link>
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    onClick={() => respond(req.id, "accept")}
                    className="btn-primary text-xs py-1 px-3"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => respond(req.id, "reject")}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
