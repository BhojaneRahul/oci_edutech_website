import { clsx, type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

const mediaBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return null;
  }

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    try {
      const absoluteUrl = new URL(trimmed);
      const shouldUpgradeToHttps =
        absoluteUrl.protocol === "http:" &&
        absoluteUrl.hostname !== "localhost" &&
        absoluteUrl.hostname !== "127.0.0.1";

      if (shouldUpgradeToHttps) {
        absoluteUrl.protocol = "https:";
        return absoluteUrl.toString();
      }
    } catch {
      // Keep the original value if URL parsing fails.
    }

    return trimmed;
  }

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return encodeURI(`${mediaBaseUrl}${normalized}`);
};
