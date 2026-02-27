"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { fullName } from "@/lib/utils";

interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  hometown: string | null;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      search(q);
    }
  }, [searchParams, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-fb-text">Search People</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name..."
          className="input flex-1"
          autoFocus
        />
        <button type="submit" className="btn-primary px-6">
          Search
        </button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="card p-8 text-center text-fb-text-secondary">
          No people found for &ldquo;{searchParams.get("q")}&rdquo;.
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((user) => (
            <div key={user.id} className="card p-4 flex items-center gap-4">
              <Link href={`/profile/${user.id}`} className="shrink-0">
                <Avatar
                  src={user.profilePicture}
                  name={fullName(user.firstName, user.lastName)}
                  size={64}
                />
              </Link>
              <div className="flex-1">
                <Link
                  href={`/profile/${user.id}`}
                  className="font-semibold hover:underline text-fb-text"
                >
                  {fullName(user.firstName, user.lastName)}
                </Link>
                {user.hometown && (
                  <p className="text-sm text-fb-text-secondary">📍 {user.hometown}</p>
                )}
              </div>
              <Link
                href={`/profile/${user.id}`}
                className="btn-secondary text-sm shrink-0"
              >
                View profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
