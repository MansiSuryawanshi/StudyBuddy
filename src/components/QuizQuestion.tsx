import React, { useState } from 'react';
import type { GeneratedQuestion } from '../types';

interface QuizQuestionProps {
  question: GeneratedQuestion;
  onAnswer: (answer: string, isCorrect?: boolean) => void;
  disabled?: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, onAnswer, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Reset state when question changes
  React.useEffect(() => {
    setInputValue('');
    setSelectedOption(null);
    console.log(`[QuizQuestion] Question changed to ${question.id}. Answer state reset.`);
  }, [question.id]);

  const handleMcqSubmit = (option: string) => {
    if (disabled) return;
    setSelectedOption(option);
    onAnswer(option, option === question.correctAnswer);
  };

  const handleShortAnswerSubmit = () => {
    if (disabled || !inputValue.trim()) return;
    onAnswer(inputValue);
  };

  return (
    <div className="w-full animate-slide-up">
      {/* Question Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
            {question.type === 'mcq' ? 'Multiple Choice' : 'Reasoning'}
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
      {question.type === 'mcq' && question.options && (
        <div className="grid grid-cols-1 gap-4">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleMcqSubmit(option)}
              disabled={disabled}
              className={`w-full p-6 rounded-2xl text-left font-bold transition-all border-2 ${
                selectedOption === option 
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                  : 'bg-white/[0.03] border-white/5 text-gray-400 hover:bg-white/[0.05] hover:border-white/10'
              } ${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  selectedOption === option ? 'border-white bg-white text-purple-600' : 'border-white/20'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                {option}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Short Answer Input */}
      {question.type === 'short_answer' && (
        <div className="space-y-6">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled}
            placeholder="Type your explanation here..."
            className="w-full h-48 bg-white/[0.03] border-2 border-white/10 rounded-2xl p-6 text-white font-medium focus:outline-none focus:border-purple-500/50 transition-all resize-none shadow-inner"
          />
          <button
            onClick={handleShortAnswerSubmit}
            disabled={disabled || !inputValue.trim()}
            className="btn-premium w-full py-5 rounded-2xl font-black text-xl shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;
