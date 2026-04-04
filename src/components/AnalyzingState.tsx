/**
 * Animated loading screen shown while Claude evaluates answers. Guarantees >=2500ms display.
 * Owner: Developer 1 (Frontend UI)
 */
import React, { useEffect, useState } from 'react';

const MESSAGES = [
  'Reading both answers...',
  'Comparing reasoning depth...',
  'Detecting misconceptions...',
];

const AnalyzingState: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        setFade(true);
      }, 300);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card rounded-2xl p-10 text-center flex flex-col items-center gap-6">
      {/* Spinning gradient ring */}
      <div
        className="w-16 h-16 rounded-full gradient-border animate-spin-slow flex-shrink-0"
        style={{ padding: 3 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: 'rgba(15,12,41,0.9)' }}
        />
      </div>

      {/* Cycling message */}
      <p
        className="text-white text-lg font-medium transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {MESSAGES[messageIndex]}
      </p>

      {/* Pulsing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-purple-400"
            style={{
              animation: `bounce-dot 1.2s ease-in-out ${i * 0.25}s infinite`,
            }}
          />
        ))}
      </div>

      <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">
        AI Reasoning Engine
      </p>
    </div>
  );
};

export default AnalyzingState;
