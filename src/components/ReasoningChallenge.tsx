import React, { useEffect, useState } from 'react';
import { getActiveDocumentId, getDocumentById } from '../services/firebaseService';
import { generateQuizFromContent } from '../services/quizService';
import { useStore } from '../store/store';
import QuizQuestion from './QuizQuestion';

type QuizPhase = 'idle' | 'loading' | 'no-content' | 'quiz' | 'completed';
type LoadingStep = 'reading' | 'extracting' | 'generating';

const ReasoningChallenge: React.FC = () => {
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('reading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { currentQuiz, setQuiz, recordQuizAnswer, clearQuizAnswers } = useStore();

  useEffect(() => {
    const initQuiz = async () => {
      setPhase('loading');
      
      try {
        const docId = await getActiveDocumentId();
        if (!docId) {
          setPhase('no-content');
          return;
        }

        const studyDoc = await getDocumentById(docId);
        if (!studyDoc || !studyDoc.rawText) {
          setPhase('no-content');
          return;
        }

        // Loading Sequence
        setLoadingStep('reading');
        await new Promise(r => setTimeout(r, 1500));
        
        setLoadingStep('extracting');
        await new Promise(r => setTimeout(r, 1500));
        
        setLoadingStep('generating');
        const questions = await generateQuizFromContent(studyDoc.rawText);
        setQuiz(questions);
        setPhase('quiz');
      } catch (error) {
        console.error("Quiz init failed:", error);
        setPhase('no-content');
      }
    };

    if (phase === 'idle') {
      clearQuizAnswers(); // reset answers when starting a new quiz
      initQuiz();
    }
  }, [phase, setQuiz, clearQuizAnswers]);

  const handleAnswer = (_answer: string, isCorrect?: boolean) => {
    // Record the answer against its topic for Exam Prep
    if (currentQuiz) {
      const q = currentQuiz[currentQuestionIndex];
      recordQuizAnswer({
        questionId: q.id,
        sourceTopic: q.sourceTopic ?? 'General',
        isCorrect: isCorrect ?? null,
      });
    }

    setTimeout(() => {
      if (currentQuestionIndex < (currentQuiz?.length || 0) - 1) {
        setCurrentQuestionIndex((prev: number) => prev + 1);
      } else {
        setPhase('completed');
      }
    }, 1500);
  };

  if (phase === 'no-content') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        </div>
        <h2 className="text-3xl font-black mb-4">No Study Material Found</h2>
        <p className="text-gray-500 font-medium mb-10">Upload your syllabus, notes, or study content first to generate a quiz.</p>
        <button 
          onClick={() => window.location.reload()} // Simple way to reset for now or navigate to upload
          className="btn-outline px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="max-w-md mx-auto py-32 text-center">
        <div className="relative w-24 h-24 mx-auto mb-12">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/10" />
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
        </div>
        <div className="space-y-4">
          <p className={`text-xl font-bold transition-all duration-500 ${loadingStep === 'reading' ? 'text-white scale-110' : 'text-gray-600 opacity-50'}`}>
            Reading uploaded material...
          </p>
          <p className={`text-xl font-bold transition-all duration-500 ${loadingStep === 'extracting' ? 'text-white scale-110' : 'text-gray-600 opacity-50'}`}>
            Extracting key topics...
          </p>
          <p className={`text-xl font-bold transition-all duration-500 ${loadingStep === 'generating' ? 'text-white scale-110' : 'text-gray-600 opacity-50'}`}>
            Building your quiz...
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && currentQuiz) {
    const currentQuestion = currentQuiz[currentQuestionIndex];
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-1">Challenge Mode</span>
            <h2 className="text-xl font-black">Question {currentQuestionIndex + 1} of {currentQuiz.length}</h2>
          </div>
          <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-500" 
              style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.length) * 100}%` }} 
            />
          </div>
        </div>
        
        <QuizQuestion 
          question={currentQuestion} 
          onAnswer={handleAnswer}
        />
      </div>
    );
  }

  if (phase === 'completed') {
    return (
      <div className="max-w-2xl mx-auto py-32 text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20 text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <h2 className="text-5xl font-black mb-6 tracking-tighter">Challenge Completed!</h2>
        <p className="text-xl text-gray-400 font-medium mb-12">You've successfully completed the quiz based on your study material.</p>
        <button 
          onClick={() => setPhase('idle')}
          className="btn-premium px-12 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-purple-500/30"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  return null;
};

export default ReasoningChallenge;
