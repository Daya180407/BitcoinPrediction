import React, { useEffect, useState, useRef } from 'react';

export default function CountdownTimer({ duration, onComplete, isActive }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    startTime.current = Date.now();
    setTimeLeft(duration);

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        if (onComplete) onComplete();
      }
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [isActive, duration, onComplete]);

  const progress = timeLeft / duration;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - progress);
  const isUrgent = timeLeft <= 5;
  const color = isUrgent ? '#e53e3e' : timeLeft <= duration * 0.3 ? '#d69e2e' : '#1E9E56';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="120" height="120" className="transform -rotate-90">
          {/* Background circle */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="#1a3448" strokeWidth="6" />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="countdown-ring"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-display font-bold text-2xl tabular-nums ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white'}`}
          >
            {timeLeft}
          </span>
          <span className="text-gray-500 text-xs">seconds</span>
        </div>
      </div>
      {isActive && (
        <div className="w-full bg-[#1a3448] rounded-full h-1">
          <div
            className="h-1 rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}
