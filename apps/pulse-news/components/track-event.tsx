"use client";

import { useEffect } from "react";

type TrackEventProps = {
  event: string;
  params?: Record<string, string | number>;
};

export default function TrackEvent({ event, params }: TrackEventProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  }, [event, params]);

  return null;
}
