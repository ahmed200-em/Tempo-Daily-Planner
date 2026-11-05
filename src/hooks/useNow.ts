import { useEffect, useState } from "react";
import { dateKeyOf } from "../lib/time";

/** Ticks every 15s; returns current minutes-after-midnight and today's key. */
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return {
    date: now,
    min: now.getHours() * 60 + now.getMinutes(),
    key: dateKeyOf(now),
  };
}
