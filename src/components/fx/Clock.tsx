"use client";

import { useSyncExternalStore } from "react";

// 상단 가운데 서울 현재 시각. 서버에서는 비워 두고 브라우저에서만 그린다.
const fmt = () =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(
    new Date(),
  );
const subscribe = (cb: () => void) => {
  const id = window.setInterval(cb, 10_000);
  return () => window.clearInterval(id);
};

export default function Clock() {
  const time = useSyncExternalStore(subscribe, fmt, () => "");
  const [hh, mm] = time ? time.split(":") : ["", ""];
  return (
    <span className="label tabular-nums" suppressHydrationWarning>
      Seoul{" "}
      {time && (
        <>
          {hh}
          <span className="animate-[blink_2s_steps(1)_infinite]">:</span>
          {mm}
        </>
      )}
    </span>
  );
}
