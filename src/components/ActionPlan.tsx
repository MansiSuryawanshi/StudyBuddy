import React, { useState } from 'react';

interface ActionPlanProps {
  actionPlan: string[];
}

const STEP_LABELS = ['Next 24 hours', 'This week', 'Before exam'];

export const ActionPlan: React.FC<ActionPlanProps> = ({ actionPlan }) => {
  const [checked, setChecked] = useState<boolean[]>(actionPlan.map(() => false));

  const toggle = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-white mb-3">Action plan</p>
      {actionPlan.map((action, i) => (
        <div
          key={i}
          className={`glass rounded-xl p-4 mb-2 flex items-start gap-3 transition-opacity ${
            checked[i] ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <button
            onClick={() => toggle(i)}
            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer text-xs font-bold border-2 ${
              checked[i]
                ? 'bg-purple-500 border-purple-500 text-white'
                : 'bg-transparent border-white/20 text-transparent'
            }`}
          >
            ✓
          </button>
          <div>
            <p className="text-[11px] font-semibold text-purple-400 uppercase tracking-wide mb-0.5">
              {STEP_LABELS[i] ?? `Step ${i + 1}`}
            </p>
            <p
              className={`text-sm text-white leading-snug ${
                checked[i] ? 'line-through text-gray-500' : ''
              }`}
            >
              {action}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
