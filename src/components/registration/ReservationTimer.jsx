import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

/**
 * Subtle countdown timer showing remaining reservation time.
 *
 * Visual states:
 *   Normal (>2min):   muted text with clock icon
 *   Warning (<2min):  amber text
 *   Expired (0:00):   expiry message with refresh prompt
 */
const ReservationTimer = ({ expiresAt, onExpired }) => {
  const calcRemaining = useCallback(() => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  }, [expiresAt]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    setRemaining(calcRemaining());

    const interval = setInterval(() => {
      const secs = calcRemaining();
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calcRemaining, onExpired]);

  if (remaining <= 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 md:pl-6">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>Your reserved spot has expired. Please refresh to try again.</span>
      </div>
    );
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isWarning = remaining < 120; // < 2 minutes

  return (
    <div
      className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2 md:pl-6 transition-colors ${
        isWarning
          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
          : 'text-neutral-light bg-neutral-bg/50 border border-neutral-dark'
      }`}
    >
      <Clock
        className={`w-4 h-4 flex-shrink-0 ${isWarning ? 'text-amber-400' : 'text-teal-500'}`}
      />
      <span>
        Spot reserved — <span className="font-mono font-medium">{timeStr}</span> remaining
      </span>
    </div>
  );
};

export default ReservationTimer;
