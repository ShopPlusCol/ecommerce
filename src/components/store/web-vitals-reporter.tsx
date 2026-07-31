"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    void fetch("/api/observability/vitals", {
      method: "POST",
      body: JSON.stringify({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
      }),
      headers: { "content-type": "application/json" },
      keepalive: true,
    });
  });
  return null;
}
