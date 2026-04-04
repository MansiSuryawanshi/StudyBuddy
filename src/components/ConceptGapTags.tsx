/**
 * Concept Gap Tags component: displays concept tags based on the generated evaluation.
 * Owner: Developer 1 (Frontend UI)
 */
import React from 'react';

interface Props {
  tags: string[];
}

export const ConceptGapTags: React.FC<Props> = ({ tags }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, idx) => (
        <span key={idx} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
          {tag}
        </span>
      ))}
    </div>
  );
};
