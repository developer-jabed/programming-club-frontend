"use client";

import { useEffect, useState } from "react";

export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return (
      <div className="text-xs text-gray-400 px-3">
        Loading time...
      </div>
    );
  }

  const dateString = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timeString = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
      <span className="text-[11px] text-gray-500">{dateString}</span>
      <span className="text-sm font-bold text-indigo-600 font-mono">
        {timeString}
      </span>
    </div>
  );
}