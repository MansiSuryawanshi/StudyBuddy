import React, { useEffect, useState } from 'react';
import { 
  listUserDocuments, 
  saveQuizAttempt, 
  removeDocument,
  removeDocuments,
  type StudyDocument 
} from '../services/firebaseService';
import { generateQuizFromContent } from '../services/quizService';
import { useStore } from '../store/store';
import QuizQuestion from './QuizQuestion';
import type { QuizAttempt } from '../types';

type QuizPhase = 'selection' | 'loading' | 'no-content' | 'generation-error' | 'quiz' | 'results';
type LoadingStep = 'reading' | 'extracting' | 'generating';

interface QuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

const ReasoningChallenge: React.FC = () => {
  const [phase, setPhase] = useState<QuizPhase>('selection');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('reading');
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [finalAttempt, setFinalAttempt] = useState<QuizAttempt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentQuiz, setQuiz } = useStore();

  // Load documents on mount
  const loadDocs = async () => {
    const docs = await listUserDocuments();
    console.log(`[Challenge] Loaded ${docs.length} materials from Firebase.`);
    setDocuments(docs);
    if (docs.length === 0) {
      setPhase('no-content');
    } else {
      setPhase('selection');
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const toggleDocument = (id: string) => {
    const next = new Set(selectedDocIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDocIds(next);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;
    
    setIsDeleting(true);
    try {
      await removeDocument(id);
      console.log(`[Challenge] Document ${id} deleted successfully.`);
      
      // Update local state
      const nextDocs = documents.filter(d => d.id !== id);
      setDocuments(nextDocs);
      
      const nextSelected = new Set(selectedDocIds);
      nextSelected.delete(id);
      setSelectedDocIds(nextSelected);

      if (nextDocs.length === 0) setPhase('no-content');
    } catch (error) {
      alert("Failed to delete document. Please try again.");
      console.error("[Challenge] Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedDocIds.size;
    if (!window.confirm(`Are you sure you want to delete ${count} selected materials?`)) return;

    setIsDeleting(true);
    try {
      const ids = Array.from(selectedDocIds);
      await removeDocuments(ids);
      console.log(`[Challenge] ${count} documents deleted successfully.`);

      // Update local state
      const nextDocs = documents.filter(d => !selectedDocIds.has(d.id!));
      setDocuments(nextDocs);
      setSelectedDocIds(new Set());

      if (nextDocs.length === 0) setPhase('no-content');
    } catch (error) {
      alert("Failed to delete selected documents. Please try again.");
      console.error("[Challenge] Bulk delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartChallenge = async () => {
    if (selectedDocIds.size === 0) return;
    
    setPhase('loading');
    setResults([]);
    setCurrentQuestionIndex(0);
    
    try {
      const selectedDocs = documents.filter(d => d.id && selectedDocIds.has(d.id));
      const combinedContent = selectedDocs.map(d => d.rawText).join('\n\n---\n\n');
      
      console.log(`[Challenge] Starting generation from ${selectedDocs.length} documents.`);
      console.log(`[Challenge] Combined content length: ${combinedContent.length} characters.`);

      setLoadingStep('reading');
      await new Promise(r => setTimeout(r, 800));
      setLoadingStep('extracting');
      await new Promise(r => setTimeout(r, 800));
      setLoadingStep('generating');

      const questions = await generateQuizFromContent(combinedContent);
      console.log(`[Challenge] Quiz built with ${questions.length} questions.`);
      
      setQuiz(questions);
      setPhase('quiz');
    } catch (error) {
      console.error("[Challenge] Quiz generation failed:", error);
      setPhase('generation-error');
    }
  };

  const handleAnswer = (answer: string, isCorrect?: boolean) => {
    const currentQuestion = currentQuiz![currentQuestionIndex];
    
    const result: QuestionResult = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      userAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: !!isCorrect,
      explanation: currentQuestion.explanation
    };

    setResults(prev => [...prev, result]);

    setTimeout(async () => {
      if (currentQuestionIndex < (currentQuiz?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Quiz finished - calculate and save
        const finalResults = [...results, result];
        const correctCount = finalResults.filter(r => r.isCorrect).length;
        const totalQuestions = finalResults.length;
        const accuracy = Math.round((correctCount / totalQuestions) * 100);
        
        const selectedDocs = documents.filter(d => d.id && selectedDocIds.has(d.id));
        const selectedFileNames = selectedDocs.map(d => d.fileName);
        
        const attempt: Omit<QuizAttempt, 'id'> = {
          createdAt: new Date(),
          selectedDocumentIds: Array.from(selectedDocIds),
          selectedFileNames,
          score: correctCount * 10, // Example scoring
          correctCount,
          wrongCount: totalQuestions - correctCount,
          totalQuestions,
          accuracy,
          questionResults: finalResults,
          weakTopics: [...new Set(finalResults.filter(r => !r.isCorrect).map(r => {
             const q = currentQuiz?.find(cq => cq.id === r.questionId);
             return q?.sourceTopic || 'General';
          }))],
          strongTopics: [...new Set(finalResults.filter(r => r.isCorrect).map(r => {
             const q = currentQuiz?.find(cq => cq.id === r.questionId);
             return q?.sourceTopic || 'General';
          }))],
          generatedFromContentLength: selectedDocs.reduce((acc, d) => acc + d.rawText.length, 0)
        };

        const savedId = await saveQuizAttempt(attempt);
        console.log(`[Challenge] Quiz attempt saved to Firebase. ID: ${savedId}`);
        
        setFinalAttempt({ ...attempt, id: savedId || undefined });
        setPhase('results');
      }
    }, 1500);
  };

  // ── VIEWS ──────────────────────────────────────────────────────────────────

  if (phase === 'no-content') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        </div>
        <h2 className="text-3xl font-black mb-4">No Study Material Found</h2>
        <p className="text-gray-500 font-medium mb-10">Upload your syllabus, notes, or study content first to generate a quiz.</p>
        <button 
          onClick={() => window.location.href = '/'} // Hard redirect to home/upload for now
          className="btn-outline px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  if (phase === 'selection') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-white mb-2">Reasoning Challenge</h2>
            <p className="text-gray-400 font-medium">Select the materials you want to be tested on.</p>
          </div>
          {selectedDocIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="text-red-400 hover:text-red-300 font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition-all"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
               Delete Selected ({selectedDocIds.size})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {documents.map((doc) => {
            const isSelected = selectedDocIds.has(doc.id!);
            return (
              <div 
                key={doc.id}
                onClick={() => toggleDocument(doc.id!)}
                className={`group relative p-6 rounded-3xl border-2 transition-all cursor-pointer overflow-hidden ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-500/10 shadow-2xl shadow-purple-500/20' 
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                       <h3 className="font-bold text-lg text-white truncate pr-4">{doc.fileName}</h3>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">
                      Uploaded {new Date(doc.uploadedAt?.seconds * 1000).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                       <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/5 text-gray-400 font-bold">
                         {Math.round(doc.rawText.length / 1000)}k chars
                       </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/10'
                    }`}>
                      {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id!);
                      }}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                      title="Delete Material"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-8 flex justify-center">
          <button 
            disabled={selectedDocIds.size === 0 || isDeleting}
            onClick={handleStartChallenge}
            className={`btn-premium px-12 py-5 rounded-2xl font-black text-xl transition-all ${
              selectedDocIds.size === 0 || isDeleting ? 'opacity-30 grayscale cursor-not-allowed' : 'shadow-2xl shadow-purple-500/40'
            }`}
          >
            {isDeleting ? 'Deleting...' : `Generate Quiz from ${selectedDocIds.size} ${selectedDocIds.size === 1 ? 'Material' : 'Materials'} →`}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="max-w-md mx-auto py-32 text-center animate-fade-in">
        <div className="relative w-24 h-24 mx-auto mb-12">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/10" />
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
        </div>
        <div className="space-y-4">
          <p className={`text-xl font-bold transition-all duration-500 ${loadingStep === 'reading' ? 'text-white scale-110' : 'text-gray-600 opacity-50'}`}>
            Reading selected materials...
          </p>
          <p className={`text-xl font-bold transition-all duration-500 ${loadingStep === 'extracting' ? 'text-white scale-110' : 'text-gray-600 opacity-50'}`}>
            Extracting core concepts...
          </p>
          <p className={`text-xl font-bold transition-all duration-500 ${loadingStep === 'generating' ? 'text-white scale-110' : 'text-gray-600 opacity-50'}`}>
            Building your challenge...
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && currentQuiz) {
    const currentQuestion = currentQuiz[currentQuestionIndex];
    return (
      <div className="max-w-3xl mx-auto py-12 px-6">
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

  if (phase === 'results' && finalAttempt) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 animate-slide-up">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h2 className="text-5xl font-black mb-4 tracking-tighter text-white">Assessment Complete</h2>
          <p className="text-gray-400 font-medium">Your results have been persisted to your study profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="glass rounded-3xl p-6 text-center border-b-4 border-b-purple-500">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Accuracy</p>
            <p className="text-4xl font-black text-white">{finalAttempt.accuracy}%</p>
          </div>
          <div className="glass rounded-3xl p-6 text-center border-b-4 border-b-emerald-500">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Correct</p>
            <p className="text-4xl font-black text-white">{finalAttempt.correctCount}</p>
          </div>
          <div className="glass rounded-3xl p-6 text-center border-b-4 border-b-red-500">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Missed</p>
            <p className="text-4xl font-black text-white">{finalAttempt.wrongCount}</p>
          </div>
          <div className="glass rounded-3xl p-6 text-center border-b-4 border-b-blue-500">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Points</p>
            <p className="text-4xl font-black text-white">{finalAttempt.score}</p>
          </div>
        </div>

        <div className="space-y-6 mb-16">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] text-center">Topic Performance</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {finalAttempt.strongTopics.map((t, i) => (
              <span key={i} className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                ✓ {t}
              </span>
            ))}
            {finalAttempt.weakTopics.map((t, i) => (
              <span key={i} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                ⚠ {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => setPhase('selection')}
            className="btn-outline px-10 py-5 rounded-2xl font-black text-lg w-full md:w-auto"
          >
            ← Change Materials
          </button>
          <button 
            onClick={handleStartChallenge}
            className="btn-premium px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-purple-500/30 w-full md:w-auto"
          >
            Retake Selected →
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'generation-error') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <h2 className="text-3xl font-black mb-4 text-white">AI Generation Failed</h2>
        <p className="text-gray-500 font-medium mb-10 max-w-md mx-auto">
          Something went wrong while generating the quiz. Please try again or reduce the number of selected materials.
        </p>
        <button 
          onClick={() => setPhase('selection')} 
          className="btn-outline px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest"
        >
          Back to Selection
        </button>
      </div>
    );
  }

  return null;
};

export default ReasoningChallenge;

