// Hook: useCountdown
// Returns time remaining (in seconds) until a target timestamp
// Also returns isLocked (boolean) when time <= 0

import { useState, useEffect } from 'react';

export function useCountdown(targetTimestamp) {
  const getRemaining = () => {
    if (!targetTimestamp) return null;
    return Math.floor(targetTimestamp - Date.now() / 1000);
  };

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (!targetTimestamp) return;

    const tick = () => setRemaining(getRemaining());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp]);

  if (remaining === null) return { isLocked: false, remaining: null, display: null };

  const isLocked = remaining <= 0;
  const abs = Math.abs(remaining);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;

  let display = null;
  if (!isLocked && remaining <= 3600) {
    // Only show when less than 1 hour left
    if (hours > 0) {
      display = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      display = `${minutes}m ${seconds}s`;
    } else {
      display = `${seconds}s`;
    }
  }

  return { isLocked, remaining, display };
}

export default useCountdown;
