/**
 * Landing screen with pitch headline and "Start session" button.
 * Owner: Developer 1 (Frontend UI)
 */
import React from 'react';

export const LandingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">DepthIQ</h1>
      <p className="text-lg mb-8">A real-time multiplayer student reasoning evaluator.</p>
      <button className="px-6 py-2 bg-blue-600 text-white rounded cursor-pointer">
        Start session
      </button>
    </div>
  );
};
