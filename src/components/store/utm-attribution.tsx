"use client";

import { useEffect } from "react";

const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;

export function UtmAttribution() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const attribution = Object.fromEntries(
      UTM_KEYS.map((key) => [key, searchParams.get(`utm_${key}`)])
        .filter((entry): entry is [string, string] => Boolean(entry[1]))
        .map(([key, value]) => [key, value.slice(0, 160)]),
    );
    if (!Object.keys(attribution).length) return;
    const value = encodeURIComponent(JSON.stringify(attribution));
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const attributes = `; Path=/; Max-Age=${60 * 60 * 24 * 90}; SameSite=Lax${secure}`;
    if (!document.cookie.split("; ").some((cookie) => cookie.startsWith("shoppluscol_utm_first="))) {
      document.cookie = `shoppluscol_utm_first=${value}${attributes}`;
    }
    document.cookie = `shoppluscol_utm_last=${value}${attributes}`;
  }, []);

  return null;
}
