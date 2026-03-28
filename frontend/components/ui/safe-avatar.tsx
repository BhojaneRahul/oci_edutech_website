"use client";

import { useMemo, useState } from "react";
import { resolveMediaUrl } from "@/lib/utils";

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
    return resolveMediaUrl(src);
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
