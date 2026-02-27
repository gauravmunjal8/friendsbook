"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { fullName } from "@/lib/utils";

interface Suggestion {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  mutualCount: number;
}

export default function SuggestedPeople() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/suggestions")
      .then((r) => r.json())
      .then(({ suggestions }) => {
        setSuggestions(suggestions ?? []);
        setLoading(false);
      });
  }, []);

  async function addFriend(id: string) {
    setSent((prev) => new Set([...prev, id]));
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresseeId: id }),
    });
  }

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="card p-4 sticky top-20">
      <h3 className="font-bold text-fb-text mb-3">People You May Know</h3>
      <div className="space-y-4">
        {suggestions.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <Link href={`/profile/${s.id}`} className="shrink-0">
              <Avatar
                src={s.profilePicture}
                name={fullName(s.firstName, s.lastName)}
                size={44}
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${s.id}`}
                className="text-sm font-semibold hover:underline block truncate"
              >
                {fullName(s.firstName, s.lastName)}
              </Link>
              {s.mutualCount > 0 && (
                <p className="text-xs text-fb-text-secondary">
                  {s.mutualCount} mutual {s.mutualCount === 1 ? "friend" : "friends"}
                </p>
              )}
              {sent.has(s.id) ? (
                <span className="text-xs text-fb-text-secondary mt-1 inline-block">
                  Request sent
                </span>
              ) : (
                <button
                  onClick={() => addFriend(s.id)}
                  className="mt-1 text-xs font-semibold text-fb-blue hover:underline"
                >
                  + Add Friend
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
