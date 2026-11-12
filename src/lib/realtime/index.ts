"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The single realtime surface in Huddle. v1 polls; swapping to Neon realtime later
 * keeps this signature so no feature code changes.
 */
export function useLive<T>(url: string, intervalMs = 3000, initial?: T): { data: T | undefined; refresh: () => void } {
  const [data, setData] = useState<T | undefined>(initial);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setData((await res.json()) as T);
    } catch {
      /* offline — try again next tick */
    } finally {
      inflight.current = false;
    }
  }, [url]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      stop();
      timer = setInterval(refresh, intervalMs);
    };
    const stop = () => timer && clearInterval(timer);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        start();
      } else stop();
    };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh, intervalMs]);

  return { data, refresh: () => void refresh() };
}
