"use client";

import { useMemo, useState } from "react";

type SafeAvatarProps = {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  fallbackClassName?: string;
};

export function SafeAvatar({
  src,
  alt,
  fallback,
  className = "",
  fallbackClassName = ""
}: SafeAvatarProps) {
  const [failed, setFailed] = useState(false);

  const normalizedSrc = useMemo(() => {
    if (!src) return null;
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
      return src;
    }
    return `/${src.replace(/^\/+/, "")}`;
  }, [src]);

  if (!normalizedSrc || failed) {
    return (
      <div className={`flex items-center justify-center ${fallbackClassName}`}>
        {fallback}
      </div>
    );
  }

  return <img src={normalizedSrc} alt={alt} className={className} onError={() => setFailed(true)} />;
}
