/**
 * Student answer input: confidence slider, textarea, peer typing indicator, submit button.
 * Owner: Developer 1 (Frontend UI)
 */
import React, { useState } from 'react';

interface AnswerInputProps {
  onSubmit: (answerText: string, confidenceRating: number) => void;
  peerIsTyping: boolean;
}

const AnswerInput: React.FC<AnswerInputProps> = ({ onSubmit, peerIsTyping }) => {
  const [text, setText] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (submitted || text.trim() === '') return;
    setSubmitted(true);
    onSubmit(text.trim(), confidence);
  };

  return (
    <div className="glass-card rounded-2xl p-5 w-full space-y-4">
      {/* Confidence selector */}
      <div>
        <label className="block text-sm text-gray-300 mb-3 font-medium">
          How confident are you?
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              onClick={() => !submitted && setConfidence(val)}
              disabled={submitted}
              className={[
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer',
                val === confidence
                  ? 'text-purple-200'
                  : 'text-gray-400 hover:text-gray-200',
              ].join(' ')}
              style={
                val === confidence
                  ? {
                      background: 'rgba(124,58,237,0.4)',
                      border: '1px solid rgba(139,92,246,0.6)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }
              }
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitted}
          placeholder="Type your answer here..."
          className="w-full resize-none rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: submitted
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(255,255,255,0.1)',
          }}
          onFocus={(e) => {
            if (!submitted)
              (e.target as HTMLTextAreaElement).style.border =
                '1px solid rgba(139,92,246,0.5)';
          }}
          onBlur={(e) => {
            if (!submitted)
              (e.target as HTMLTextAreaElement).style.border =
                '1px solid rgba(255,255,255,0.1)';
          }}
        />

        {/* Peer typing indicator */}
        {peerIsTyping && !submitted && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400"
                  style={{ animation: `bounce-dot 1s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
            <span className="text-purple-400 text-xs font-medium">Peer is typing...</span>
          </div>
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitted || text.trim() === ''}
        className={[
          'w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200',
          submitted
            ? 'text-gray-500 cursor-default'
            : text.trim() === ''
            ? 'text-gray-500 cursor-not-allowed'
            : 'text-white cursor-pointer animate-pulse-glow hover:opacity-90 active:scale-[0.98]',
        ].join(' ')}
        style={
          submitted || text.trim() === ''
            ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
            : { background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }
        }
      >
        {submitted ? '✓ Submitted' : 'Submit Answer'}
      </button>
    </div>
  );
};

export default AnswerInput;
