import Image from "next/image";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export default function Avatar({ src, name, size = 40, className = "" }: AvatarProps) {
  const parts = name.trim().split(/\s+/);
  const initials = getInitials(parts[0] ?? "?", parts[1] ?? "");

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const bg = stringToColor(name);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: bg,
      }}
    >
      {initials}
    </div>
  );
}

function stringToColor(str: string): string {
  const colors = [
    "#1877F2", "#E4405F", "#FF6B6B", "#4ECDC4",
    "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
    "#98D8C8", "#F7DC6F",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
