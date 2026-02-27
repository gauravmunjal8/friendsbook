"use client";

import { useState, useRef } from "react";
import type { ProfileData } from "@/types";

interface EditProfileModalProps {
  profile: ProfileData;
  onClose: () => void;
  onSave: (updated: Partial<ProfileData>) => void;
}

export default function EditProfileModal({
  profile,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio ?? "",
    hometown: profile.hometown ?? "",
    birthday: profile.birthday
      ? new Date(profile.birthday).toISOString().split("T")[0]
      : "",
    profilePicture: profile.profilePicture ?? "",
    coverPhoto: profile.coverPhoto ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"profile" | "cover" | null>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function uploadImage(file: File, folder: string): Promise<string> {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, folder }),
    });
    const { uploadUrl, fileUrl } = await res.json();
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    return fileUrl;
  }

  async function handleProfilePic(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("profile");
    const url = await uploadImage(file, "profiles");
    set("profilePicture", url);
    setUploading(null);
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("cover");
    const url = await uploadImage(file, "covers");
    set("coverPhoto", url);
    setUploading(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/users/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        birthday: form.birthday || null,
      }),
    });

    const updated = await res.json();
    setSaving(false);

    if (res.ok) {
      onSave(updated);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-fb-border">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-fb-text-secondary text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Profile picture */}
          <div>
            <label className="block text-sm font-semibold mb-2">Profile Picture</label>
            <div className="flex items-center gap-3">
              {form.profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.profilePicture}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
              <button
                type="button"
                onClick={() => profilePicRef.current?.click()}
                disabled={uploading === "profile"}
                className="btn-secondary text-sm"
              >
                {uploading === "profile" ? "Uploading..." : "Change photo"}
              </button>
              <input
                ref={profilePicRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePic}
                className="hidden"
              />
            </div>
          </div>

          {/* Cover photo */}
          <div>
            <label className="block text-sm font-semibold mb-2">Cover Photo</label>
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              disabled={uploading === "cover"}
              className="btn-secondary text-sm w-full"
            >
              {uploading === "cover" ? "Uploading..." : form.coverPhoto ? "Change cover photo" : "Add cover photo"}
            </button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              onChange={handleCover}
              className="hidden"
            />
          </div>

          <hr className="border-fb-border" />

          {/* Name */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1">First name</label>
              <input
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                required
                className="input"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1">Last name</label>
              <input
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                required
                className="input"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Tell people about yourself"
              maxLength={150}
              rows={3}
              className="input resize-none"
            />
            <p className="text-xs text-fb-text-secondary text-right mt-0.5">
              {form.bio.length}/150
            </p>
          </div>

          {/* Hometown */}
          <div>
            <label className="block text-sm font-semibold mb-1">Hometown</label>
            <input
              value={form.hometown}
              onChange={(e) => set("hometown", e.target.value)}
              placeholder="Where are you from?"
              className="input"
            />
          </div>

          {/* Birthday */}
          <div>
            <label className="block text-sm font-semibold mb-1">Birthday</label>
            <input
              type="date"
              value={form.birthday}
              onChange={(e) => set("birthday", e.target.value)}
              className="input"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
