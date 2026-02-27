"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import NotificationBell from "@/components/notifications/NotificationBell";

interface NavbarProps {
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  }

  const navLinks = [
    { href: "/feed", label: "Home", icon: HomeIcon },
    { href: "/friends", label: "Friends", icon: FriendsIcon },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 h-14">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 gap-2">
        {/* Logo */}
        <Link href="/feed" className="text-2xl font-bold text-fb-blue shrink-0">
          friendsbook
        </Link>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xs">
          <div className="relative w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fb-text-secondary" />
            <input
              type="search"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-fb-gray rounded-full pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-fb-blue"
            />
          </div>
        </form>

        {/* Nav tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-fb-blue-light text-fb-blue"
                  : "text-fb-text-secondary hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="relative flex items-center gap-1.5 shrink-0">
          {/* Mobile: search icon */}
          <Link
            href="/search"
            className="sm:hidden w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5 text-fb-text" />
          </Link>

          {/* Chat */}
          <Link
            href="/chat"
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            aria-label="Messages"
          >
            <ChatIcon className="w-5 h-5 text-fb-text" />
          </Link>

          {/* Notification bell */}
          <NotificationBell />

          {/* Profile link */}
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-2 text-sm font-medium text-fb-text hover:bg-gray-100 rounded-full px-2 py-1"
          >
            <Avatar src={user.image} name={user.name ?? ""} size={32} />
            <span className="hidden lg:inline">{user.name?.split(" ")[0]}</span>
          </Link>

          {/* Account dropdown toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4 text-fb-text" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-56 card py-1 shadow-lg z-50">
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                <Avatar src={user.image} name={user.name ?? ""} size={36} />
                <span className="font-medium">{user.name}</span>
              </Link>
              <hr className="my-1 border-fb-border" />
              {/* Mobile nav links shown in dropdown */}
              <div className="md:hidden">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 text-fb-text-secondary" />
                    {label}
                  </Link>
                ))}
                <hr className="my-1 border-fb-border" />
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-sm"
              >
                <LogoutIcon className="w-5 h-5 text-fb-text-secondary" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}
function FriendsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
    </svg>
  );
}
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
