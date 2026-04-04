/**
 * Tab navigation: Reasoning Challenge / Exam Prep / Results History.
 * Owner: Developer 1 (Frontend UI)
 */
import React from 'react';

export const NavigationTabs: React.FC = () => {
  return (
    <nav className="flex space-x-4 border-b border-gray-200 p-4">
      <button className="font-semibold text-blue-600">Reasoning Challenge</button>
      <button className="text-gray-500 hover:text-gray-700">Exam Prep</button>
      <button className="text-gray-500 hover:text-gray-700">Results History</button>
    </nav>
  );
};
