import React, { useState } from 'react';
import type { GeneratedQuestion } from '../types';

interface QuizQuestionProps {
  question: GeneratedQuestion;
  onAnswer: (answer: string, isCorrect?: boolean) => void;
  disabled?: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, onAnswer, disabled }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Reset state when question changes
  React.useEffect(() => {
    setSelectedOption(null);
    console.log(`[QuizQuestion] Question changed to ${question.id}. Selection reset.`);
  }, [question.id]);

  const handleMcqSubmit = (option: string) => {
    if (disabled) return;
    setSelectedOption(option);
    onAnswer(option, option === question.correctAnswer);
  };

  return (
    <div className="w-full animate-slide-up">
      {/* Question Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
            Multiple Choice
          </span>
          {question.sourceTopic && (
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Topic: {question.sourceTopic}
            </span>
          )}
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
          {question.question}
        </h3>
      </div>

      {/* MCQ Options */}
      <div className="grid grid-cols-1 gap-4">
        {question.options!.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleMcqSubmit(option)}
            disabled={disabled}
            className={`w-full p-6 rounded-2xl text-left font-bold transition-all border-2 ${
              selectedOption === option 
                ? 'bg-purple-600/40 border-purple-400 text-white shadow-2xl shadow-purple-500/40 scale-[0.98]' 
                : 'bg-white/[0.03] border-white/5 text-gray-400 hover:bg-white/[0.05] hover:border-white/10'
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                selectedOption === option ? 'border-white bg-white text-purple-600' : 'border-white/20'
              }`}>
                {String.fromCharCode(65 + idx)}
              </div>
              {option}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizQuestion;
