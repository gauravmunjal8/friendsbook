"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { fullName } from "@/lib/utils";

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}

interface FriendsWidgetProps {
  userId: string;
}

export default function FriendsWidget({ userId }: FriendsWidgetProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}/friends`)
      .then((r) => r.json())
      .then(({ friends, total }) => {
        setFriends(friends ?? []);
        setTotal(total ?? 0);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="bg-gray-200 rounded-md w-full aspect-square mb-1" />
              <div className="h-2 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (friends.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-fb-text">Friends</h3>
          <p className="text-sm text-fb-text-secondary">{total} friends</p>
        </div>
        {total > 9 && (
          <Link
            href={`/profile/${userId}`}
            className="text-fb-blue text-sm hover:underline font-medium"
          >
            See all
          </Link>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {friends.map((f) => (
          <Link key={f.id} href={`/profile/${f.id}`} className="group">
            <Avatar
              src={f.profilePicture}
              name={fullName(f.firstName, f.lastName)}
              size={80}
              className="w-full rounded-md object-cover aspect-square group-hover:opacity-90 transition-opacity"
            />
            <p className="text-xs font-medium mt-1 text-fb-text leading-tight line-clamp-2">
              {fullName(f.firstName, f.lastName)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
