import React, { useEffect, useState, useRef } from 'react';
import { 
  listUserDocuments, 
  createChallengeSession,
  joinChallengeSession,
  onChallengeSessionUpdate,
  updateSession,
  submitParticipantResults,
  removeDocument,
  removeDocuments,
  saveQuizAttempt,
  USER_ID,
  type StudyDocument 
} from '../services/firebaseService';
import { generateQuizFromContent, generateClaudeCompetitorAnswers } from '../services/quizService';
import { evaluateShortAnswer } from '../services/claudeService';
import { useStore } from '../store/store';
import QuizQuestion from './QuizQuestion';
import { Trash2, Trash } from 'lucide-react';
import type { ChallengeSession, Participant, QuizAttempt } from '../types';

type QuizPhase = 
  | 'selection' 
  | 'mode-selection' 
  | 'count-selection' 
  | 'waiting-room' 
  | 'loading' 
  | 'no-content' 
  | 'generation-error' 
  | 'quiz' 
  | 'results';

type LoadingStep = 'reading' | 'extracting' | 'generating' | 'competitor' | 'grading';

const TIME_PER_QUESTION = 60;

interface QuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  topic?: string;
  feedback?: string; // Feedback from Claude
}

const ReasoningChallenge: React.FC = () => {
  const [phase, setPhase] = useState<QuizPhase>('selection');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('reading');
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [questionCount, setQuestionCount] = useState(10);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  
  // Multiplayer / Competitor State
  const [session, setSessionState] = useState<ChallengeSession | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [activeReviewPlayer, setActiveReviewPlayer] = useState<string>(USER_ID);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [savedAttemptId, setSavedAttemptId] = useState<string | null>(null);

  const { currentQuiz, setQuiz, clearQuizAnswers } = useStore();
  const timerRef = useRef<any>(null);

  // ── INIT & DEEP LINKING ──────────────────────────────────────────────────

  useEffect(() => {
    loadDocs();
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId') || params.get('roomCode');
    if (roomId) {
      console.log(`[Challenge] Deep link detected: ${roomId}`);
      handleJoinRoom(roomId);
    }
  }, []);

  const loadDocs = async () => {
    const docs = await listUserDocuments();
    setDocuments(docs);
    if (docs.length === 0) setPhase('no-content');
    else if (phase === 'no-content') setPhase('selection');
  };

  const handleJoinRoom = async (code: string) => {
    try {
      setPhase('loading');
      setLoadingStep('reading');
      console.log(`[Challenge] Attempting to join session: ${code}`);
      const joinedSession = await joinChallengeSession(code, USER_ID, `Student #${Math.floor(Math.random() * 999)}`);
      if (joinedSession) {
        setSessionState(joinedSession);
        setIsHost(false);
        setPhase('waiting-room');
        subscribeToSession(joinedSession.id);
      }
    } catch (error) {
      console.error("[Challenge] Failed to join room:", error);
      setPhase('selection');
      alert("Could not join room. It may be full, started, or invalid.");
    }
  };

  const subscribeToSession = (sessionId: string) => {
    return onChallengeSessionUpdate(sessionId, (updated) => {
      setSessionState(updated);
      
      // If host started the quiz
      if (updated.status === 'active' && phase !== 'quiz' && updated.questions?.length > 0) {
        console.log(`[Challenge] Session ${sessionId} is now ACTIVE. Starting quiz...`);
        setQuiz(updated.questions);
        clearQuizAnswers();
        setPhase('quiz');
        setCurrentQuestionIndex(0);
      }
      
      // If everyone finished
      if (updated.status === 'completed') {
        console.log(`[Challenge] Session ${sessionId} is COMPLETED.`);
        setPhase('results');
      }
    });
  };

  // ── DELETE ACTIONS ────────────────────────────────────────────────────────

  const handleDeleteDoc = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation(); // Don't trigger selection
    console.log(`[Challenge] Delete clicked for: ${docId}`);
    
    if (window.confirm("Are you sure you want to delete this study material?")) {
      try {
        await removeDocument(docId);
        console.log(`[Challenge] Firebase delete success: ${docId}`);
        
        // Update local state immediately
        setDocuments(prev => prev.filter(d => d.id !== docId));
        
        // Remove from selection if it was selected
        if (selectedDocIds.has(docId)) {
          const next = new Set(selectedDocIds);
          next.delete(docId);
          setSelectedDocIds(next);
        }
        
        console.log(`[Challenge] UI state updated after delete.`);
        
        // If no docs left, show no-content
        if (documents.length <= 1) {
          setPhase('no-content');
        }
      } catch (err) {
        console.error("[Challenge] Delete failed:", err);
        alert("Failed to delete document.");
      }
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedDocIds);
    if (ids.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${ids.length} selected materials?`)) {
      try {
        await removeDocuments(ids);
        console.log(`[Challenge] Bulk delete success for ${ids.length} items.`);
        
        setDocuments(prev => prev.filter(d => !selectedDocIds.has(d.id!)));
        setSelectedDocIds(new Set());
        console.log(`[Challenge] UI state updated after bulk delete.`);
        
        if (documents.length <= ids.length) {
          setPhase('no-content');
        }
      } catch (err) {
        console.error("[Challenge] Bulk delete failed:", err);
        alert("Failed to delete some documents.");
      }
    }
  };

  // ── TIMER LOGIC ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'quiz' && currentQuiz) {
      setTimeLeft(TIME_PER_QUESTION);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAnswer("TIME_OUT", false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentQuestionIndex, currentQuiz]);

  // ── ACTIONS ──────────────────────────────────────────────────────────────

  const handleCreateRoom = async () => {
    console.log(`[Challenge] Creating ${isSoloMode ? 'solo' : 'multiplayer'} room...`);
    const selected = documents.filter(d => selectedDocIds.has(d.id!));
    const newSession = await createChallengeSession(
      USER_ID, 
      "Host (You)", 
      Array.from(selectedDocIds), 
      selected.map(d => d.fileName),
      questionCount
    );
    if (newSession) {
      setSessionState(newSession);
      setIsHost(true);
      setPhase('waiting-room');
      subscribeToSession(newSession.id);
    }
  };

  const handleStartChallenge = async () => {
    if (!session) return;
    console.log(`[Challenge] Host starting challenge for session: ${session.id}`);
    console.log(`[Challenge] Quiz generation started with count: ${session.questionCount}`);
    setPhase('loading');
    setLoadingStep('generating');

    try {
      const selectedDocs = documents.filter(d => session.docIds.includes(d.id!));
      const combinedContent = selectedDocs.map(d => d.rawText).join('\n\n---\n\n');
      
      const questions = await generateQuizFromContent(combinedContent, session.questionCount);
      
      let claudeCompetitor = session.claudeCompetitor || Object.keys(session.participants).length === 1;
      
      let claudeData = null;
      if (claudeCompetitor) {
        setLoadingStep('competitor');
        console.log(`[Challenge] Running solo/low-count mode. Claude AI joining as competitor.`);
        const claudeAnswers = await generateClaudeCompetitorAnswers(questions, combinedContent);
        
        const correctCount = Object.values(claudeAnswers).filter(a => a.isCorrect).length;
        claudeData = {
          score: correctCount * 10,
          correctCount,
          wrongCount: questions.length - correctCount,
          accuracy: Math.round((correctCount / questions.length) * 100),
          answers: Object.entries(claudeAnswers).reduce((acc, [id, data]) => ({...acc, [id]: data.answer}), {})
        };
      }

      await updateSession(session.id, {
        questions,
        status: 'active',
        claudeCompetitor: claudeCompetitor,
        ...(claudeData && { [`participants.claude_ai`]: {
          uid: 'claude_ai',
          name: 'Claude AI (Grandmaster)',
          isHost: false,
          joinedAt: new Date(),
          status: 'finished',
          results: claudeData
        }})
      });

    } catch (error) {
      console.error("[Challenge] Global start failed:", error);
      setPhase('generation-error');
    }
  };

  const handleAnswer = async (answer: string, isCorrect?: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const currentQuestion = currentQuiz![currentQuestionIndex];
    
    let finalIsCorrect = isCorrect;
    let feedback = undefined;

    // Descriptive answer evaluation
    if (currentQuestion.type === 'short_answer') {
      console.log(`[Challenge] Descriptive answer evaluation started for ${currentQuestion.id}`);
      setPhase('loading');
      setLoadingStep('grading');
      
      try {
        const evalResult = await evaluateShortAnswer(
          currentQuestion.question,
          answer,
          currentQuestion.correctAnswer,
          currentQuestion.explanation
        );
        finalIsCorrect = evalResult.isCorrect;
        feedback = evalResult.feedback;
        console.log(`[Challenge] Evaluation result: ${finalIsCorrect ? 'CORRECT' : 'INCORRECT'}`);
      } catch (err) {
        console.error("[Challenge] Grading failed. Defaulting to false.", err);
        finalIsCorrect = false;
      }
      setPhase('quiz');
    }

    const result: QuestionResult = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      userAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: !!finalIsCorrect,
      explanation: currentQuestion.explanation,
      topic: currentQuestion.sourceTopic,
      feedback
    };

    const newResults = [...results, result];
    setResults(newResults);

    setTimeout(async () => {
      if (currentQuestionIndex < (currentQuiz?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        await finishQuiz(newResults);
      }
    }, 600);
  };

  const finishQuiz = async (finalResults: QuestionResult[]) => {
    console.log(`[Challenge] Quiz finished. Preparing result persistence...`);
    
    const correctCount = finalResults.filter(r => r.isCorrect).length;
    const totalQuestions = finalResults.length;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    
    const participantResults = {
      score: correctCount * 10,
      correctCount,
      wrongCount: totalQuestions - correctCount,
      accuracy,
      answers: finalResults.reduce((acc, r) => ({...acc, [r.questionId]: r.userAnswer}), {})
    };

    // Save real quiz attempt to Firebase
    try {
      const selectedDocs = documents.filter(d => (session?.docIds || Array.from(selectedDocIds)).includes(d.id!));
      const attempt: Omit<QuizAttempt, "id"> = {
        createdAt: new Date(),
        selectedDocumentIds: session?.docIds || Array.from(selectedDocIds),
        selectedFileNames: session?.docNames || selectedDocs.map(d => d.fileName),
        totalQuestions: totalQuestions,
        score: correctCount * 10,
        correctCount,
        wrongCount: totalQuestions - correctCount,
        accuracy,
        questionResults: finalResults.map((r, idx) => ({
          questionId: r.questionId || `q-${idx}`,
          questionText: r.questionText || "Unknown Question",
          type: (session?.questions?.[idx]?.type || currentQuiz?.[idx]?.type || 'short_answer'),
          userAnswer: r.userAnswer || "N/A",
          correctAnswer: r.correctAnswer || "N/A",
          isCorrect: !!r.isCorrect,
          explanation: r.explanation || null,
          topic: r.topic || "General",
          feedback: r.feedback || null
        })),
        weakTopics: Array.from(new Set(finalResults.filter(r => !r.isCorrect).map(r => r.topic || 'General'))),
        strongTopics: Array.from(new Set(finalResults.filter(r => r.isCorrect).map(r => r.topic || 'General'))),
        generatedFromContentLength: selectedDocs.length
      };

      console.group("[Challenge] Quiz Persistence Analysis");
      console.log(`Quiz completed. Detected ${totalQuestions} questions.`);
      console.log(`Summary: ${correctCount} Correct, ${totalQuestions - correctCount} Wrong, ${accuracy}% Accuracy.`);
      console.log(`Saving to: users/${USER_ID}/quizAttempts`);
      console.log("Payload Sample:", {
        score: attempt.score,
        accuracy: attempt.accuracy,
        docs: attempt.selectedFileNames,
        questions: attempt.questionResults.length
      });
      
      const attemptId = await saveQuizAttempt(attempt);
      setSavedAttemptId(attemptId);
      console.log(`Firebase save SUCCESS. Attempt ID: ${attemptId}`);
      console.groupEnd();
    } catch (err) {
      console.error(`[Challenge] Quiz result save FAILURE:`, err);
      console.groupEnd();
    }

    if (session) {
      console.log(`[Challenge] Participant finished multiplayer. Submitting results for: ${USER_ID}`);
      await submitParticipantResults(session.id, USER_ID, participantResults);
      
      const updatedParticipants = { ...session.participants, [USER_ID]: { ...session.participants[USER_ID], results: participantResults, status: 'finished' } };
      const allFinished = Object.values(updatedParticipants).every(p => p.status === 'finished');
      
      if (allFinished) {
        console.log(`[Challenge] All participants finished. Marking session as completed.`);
        await updateSession(session.id, { status: 'completed' });
      } else {
        setPhase('loading');
        setLoadingStep('grading'); // Reused grading for "waiting for others"
      }
    } else {
      setPhase('results');
    }
  };

  // ── HELPERS ──────────────────────────────────────────────────────────────

  const getLeaderboard = () => {
    if (!session) return [];
    return Object.values(session.participants)
      .filter(p => p.results)
      .sort((a, b) => (b.results?.score || 0) - (a.results?.score || 0));
  };

  const copyRoomCode = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.roomCode);
    alert("Room code copied to clipboard!");
  };

  const copyInviteLink = () => {
    if (!session) return;
    const url = `${window.location.origin}${window.location.pathname}?roomId=${session.roomCode}`;
    navigator.clipboard.writeText(url);
    alert("Full invite link copied to clipboard!");
  };

  // ── VIEWS ──────────────────────────────────────────────────────────────────

  if (phase === 'no-content') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-2xl">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <h2 className="text-3xl font-black mb-4 text-white">No Study Material Found</h2>
        <p className="text-gray-500 mb-8">Upload some notes or PDFs to start the reasoning challenge.</p>
        <button onClick={() => window.location.href = '/'} className="btn-outline px-8 py-4 rounded-2xl font-bold">Go to Upload</button>
      </div>
    );
  }

  if (phase === 'selection') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-4xl font-black text-white mb-2">Reasoning Challenge</h2>
            <p className="text-gray-400 font-medium">Step 1: Pick your source materials.</p>
          </div>
          {selectedDocIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all font-bold text-sm"
            >
              <Trash size={16} />
              Delete Selected ({selectedDocIds.size})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              onClick={() => {
                const next = new Set(selectedDocIds);
                if (next.has(doc.id!)) next.delete(doc.id!);
                else next.add(doc.id!);
                setSelectedDocIds(next);
              }} 
              className={`group relative p-6 rounded-3xl border-2 transition-all cursor-pointer ${selectedDocIds.has(doc.id!) ? 'border-purple-500 bg-purple-500/10 shadow-2xl shadow-purple-500/20' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-10">
                  <h3 className="font-bold text-lg text-white mb-1 truncate">{doc.fileName}</h3>
                  <p className="text-xs text-gray-500 font-medium">Uploaded {new Date((doc.uploadedAt?.seconds || 0) * 1000).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={(e) => handleDeleteDoc(e, doc.id!)}
                  className="p-2 rounded-xl bg-white/5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete material"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              {selectedDocIds.has(doc.id!) && (
                <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        <div className="sticky bottom-8 flex justify-center">
          <button 
            disabled={selectedDocIds.size === 0} 
            onClick={() => setPhase('mode-selection')} 
            className={`btn-premium px-12 py-5 rounded-2xl font-black text-xl shadow-2xl ${selectedDocIds.size === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
          >
            Next Step →
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'mode-selection') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 animate-fade-in text-center">
        <h2 className="text-4xl font-black text-white mb-2">Challenge Mode</h2>
        <p className="text-gray-400 font-medium mb-12">How would you like to compete?</p>
        <div className="grid grid-cols-1 gap-6 mb-12">
          <button 
            onClick={() => { setIsSoloMode(true); setPhase('count-selection'); }} 
            className="p-10 rounded-3xl border-2 border-white/5 bg-white/[0.02] text-left hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
          >
            <h3 className="text-2xl font-black text-white mb-1">Solo vs Claude</h3>
            <p className="text-gray-500 font-bold">Face the Grandmaster AI one-on-one.</p>
          </button>
          <button 
            onClick={() => { setIsSoloMode(false); setPhase('count-selection'); }} 
            className="p-10 rounded-3xl border-2 border-purple-500 bg-purple-500/10 text-left hover:shadow-2xl hover:shadow-purple-500/20 transition-all"
          >
            <h3 className="text-2xl font-black text-white mb-1">Live Multiplayer</h3>
            <p className="text-purple-400 font-bold italic">Create a room and invite friends.</p>
          </button>
        </div>
        <button onClick={() => setPhase('selection')} className="text-gray-500 font-bold hover:text-white transition-colors">← Back to Materials</button>
      </div>
    );
  }

  if (phase === 'count-selection') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 animate-fade-in text-center">
        <h2 className="text-4xl font-black text-white mb-2">Question Count</h2>
        <p className="text-gray-400 font-medium mb-10">Choose the length of your reasoning challenge.</p>
        <div className="grid grid-cols-2 gap-4 mb-12">
          {[5, 10, 20, 50].map((count) => (
            <button 
              key={count} 
              onClick={() => { 
                setQuestionCount(count); 
                console.log(`[Challenge] Question count selected: ${count}`);
              }} 
              className={`p-10 rounded-3xl border-2 transition-all font-black text-3xl ${questionCount === count ? 'border-purple-500 bg-purple-500/10 text-white shadow-2xl shadow-purple-500/20' : 'border-white/5 bg-white/[0.02] text-gray-500 hover:border-white/10'}`}
            >
              {count}
              <span className="block text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">Questions</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleCreateRoom} 
            className="btn-premium px-12 py-5 rounded-2xl font-black text-xl shadow-2xl"
          >
            {isSoloMode ? "Start Challenge →" : "Create Multiplayer Room →"}
          </button>
          <button 
            onClick={() => setPhase('mode-selection')} 
            className="text-gray-500 font-bold hover:text-white transition-colors"
          >
            ← Back to Mode
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'waiting-room' && session) {
    const players = Object.values(session.participants);
    const inviteUrl = `${window.location.origin}${window.location.pathname}?roomId=${session.roomCode}`;
    
    return (
      <div className="max-w-3xl mx-auto py-12 px-6 animate-fade-in">
        <div className="glass rounded-[40px] p-12 border-2 border-white/5 text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-gradient-x" />
          <h2 className="text-sm font-black text-purple-500 uppercase tracking-[0.4em] mb-4">Live Challenge Room</h2>
          
          {!isSoloMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 mt-8">
              {/* Room Code Box */}
              <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col items-center gap-2">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Room Code</span>
                 <span className="text-5xl font-black text-white tracking-widest leading-none mb-4">{session.roomCode}</span>
                 <button onClick={copyRoomCode} className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold text-white transition-all flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy Code
                 </button>
              </div>
              
              {/* Invite Link Box */}
              <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col items-center gap-2 overflow-hidden">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Invite Link</span>
                 <div className="w-full truncate text-xs text-gray-400 font-mono bg-black/20 p-3 rounded-xl mb-4 border border-white/5">
                    {inviteUrl}
                 </div>
                 <button onClick={copyInviteLink} className="px-6 py-2 bg-purple-500 text-white rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    Copy Invite Link
                 </button>
              </div>
            </div>
          )}
          
          <div className="space-y-4 mb-12 max-w-sm mx-auto">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{isSoloMode ? "Competitors" : `Joined Players (${players.length})`}</h3>
            <div className="grid gap-3">
              {players.map((p, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">{p.name[0]}</div>
                      <span className="font-bold text-white">{p.name} {p.uid === USER_ID && "(You)"}</span>
                   </div>
                   {p.isHost && <span className="text-[10px] font-black text-purple-500 uppercase">Host</span>}
                </div>
              ))}
              {isSoloMode && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between animate-pulse">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xs">C</div>
                      <span className="font-bold text-white">Claude AI (Grandmaster)</span>
                   </div>
                   <span className="text-[10px] font-black text-amber-500 uppercase">Opponent</span>
                </div>
              )}
            </div>
          </div>

          {isHost ? (
            <button onClick={handleStartChallenge} className="btn-premium px-12 py-5 rounded-2xl font-black text-xl shadow-2xl w-full">
               {isSoloMode ? "Start Solo Challenge" : (players.length === 1 ? "Start vs Claude AI" : "Start Live Challenge")}
            </button>
          ) : (
            <div className="p-6 bg-white/5 rounded-3xl text-gray-500 font-bold animate-pulse border border-white/5">
                Waiting for host to start the arena...
            </div>
          )}
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
        <p className="text-xl font-bold text-white transition-all">{loadingStep.toUpperCase()}...</p>
        {loadingStep === 'grader' && <p className="text-gray-500 text-sm mt-4 italic">Claude AI is evaluating your explanation...</p>}
        {loadingStep === 'competitor' && <p className="text-gray-500 text-sm mt-4 italic">Waiting for other participants to finish...</p>}
      </div>
    );
  }

  if (phase === 'quiz' && currentQuiz) {
    const q = currentQuiz[currentQuestionIndex];
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-12 flex items-center justify-between">
           <div>
             <h2 className="text-xl font-black">Question {currentQuestionIndex + 1} of {currentQuiz.length}</h2>
             <span className="text-xs font-bold text-gray-500">{timeLeft}s remaining</span>
           </div>
           <div className="w-48 h-3 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }} />
           </div>
        </div>
        <QuizQuestion question={q} onAnswer={handleAnswer} />
      </div>
    );
  }

  if (phase === 'results') {
    const leaderboard = getLeaderboard();
    const winner = leaderboard[0];
    const finalResults = session ? (Object.values(session.participants).find(p => p.uid === USER_ID)?.results?.answers) : results;

    return (
      <div className="max-w-5xl mx-auto py-12 px-6 animate-slide-up">
        {/* Winner Announcement */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-yellow-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-yellow-500/20 text-yellow-400 rotate-12 shadow-2xl shadow-yellow-500/10">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </div>
          <h2 className="text-6xl font-black text-white tracking-tighter mb-2">
            {winner?.uid === USER_ID ? "Victory! 🏆" : (winner?.uid === 'claude_ai' ? "Claude AI Wins! 🤖" : (winner ? `${winner.name} Wins!` : "Challenge Complete"))}
          </h2>
          <p className="text-gray-500 font-bold text-xl">{session?.claudeCompetitor ? "Against the Grandmaster Claude AI" : "Live Challenge Comparison"}</p>
          {savedAttemptId && <p className="text-xs text-purple-500 font-bold mt-2 uppercase tracking-widest">Attempt Saved: {savedAttemptId}</p>}
        </div>

        {/* Leaderboard */}
        {session && (
          <div className="glass rounded-[40px] p-8 border-2 border-white/5 mb-16 shadow-2xl">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8 text-center">Global Podium</h3>
            <div className="grid gap-4">
              {leaderboard.map((p, i) => (
                <div 
                  key={i} 
                  className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${p.uid === USER_ID ? 'border-purple-500 bg-purple-500/10' : (p.uid === 'claude_ai' ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5 bg-white/[0.02]')}`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-4xl font-black text-gray-600 w-10">#{i + 1}</span>
                    <div>
                      <h4 className="text-xl font-black text-white">{p.name}</h4>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{p.results?.accuracy}% Accuracy &bull; {p.results?.correctCount} Correct</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">{p.results?.score || 0} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Review Toggles */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-4">
           {session ? leaderboard.map(p => (
             <button 
               key={p.uid} 
               onClick={() => setActiveReviewPlayer(p.uid)}
               className={`px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap ${activeReviewPlayer === p.uid ? 'bg-white text-black shadow-xl ring-2 ring-purple-500' : 'bg-white/5 text-gray-500 hover:text-white'}`}
             >
               {p.name} Review
             </button>
           )) : (
             <button className="bg-white text-black px-6 py-3 rounded-2xl font-black text-sm">Your Results</button>
           )}
        </div>

        {/* Per Player List */}
        <div className="space-y-6 mb-20 animate-fade-in" key={activeReviewPlayer}>
           {(session ? session.questions : currentQuiz!).map((q, idx) => {
             const userAns = session ? session.participants[activeReviewPlayer]?.results?.answers[q.id] : results[idx]?.userAnswer;
             const isCorrect = session ? (userAns === q.correctAnswer || (q.type === 'short_answer' && results[idx]?.isCorrect)) : results[idx]?.isCorrect;
             const feedback = results[idx]?.feedback;

             return (
               <div key={idx} className={`glass rounded-3xl p-8 border-2 ${isCorrect ? 'border-emerald-500/10' : 'border-red-500/10'}`}>
                 <div className="flex items-start justify-between gap-4 mb-4">
                    <h4 className="text-xl font-semibold text-white">{q.question}</h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isCorrect ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold mb-4">
                    <div className="p-4 rounded-2xl bg-white/5">
                       <p className="text-gray-500 uppercase text-[10px] mb-2">{activeReviewPlayer === USER_ID ? "Your Answer" : `${session?.participants[activeReviewPlayer]?.name || 'Player'}'s Answer`}</p>
                       <p className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>{userAns || "Missing"}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5">
                       <p className="text-gray-500 uppercase text-[10px] mb-2">Ideal Answer</p>
                       <p className="text-white">{q.correctAnswer}</p>
                    </div>
                 </div>
                 {feedback && (
                   <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                      <p className="text-purple-400 uppercase text-[10px] mb-1 font-black tracking-widest">AI Feedback</p>
                      <p className="text-gray-300 italic">"{feedback}"</p>
                   </div>
                 )}
               </div>
             );
           })}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <button onClick={() => window.location.href = '/'} className="btn-outline px-12 py-5 rounded-2xl font-black text-lg w-full md:w-auto">Return Home</button>
          <button onClick={() => { setPhase('selection'); setSelectedDocIds(new Set()); setResults([]); setQuiz(null); setSavedAttemptId(null); }} className="btn-premium px-12 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-purple-500/30 w-full md:w-auto">New Challenge →</button>
        </div>
      </div>
    );
  }

  if (phase === 'generation-error') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
        <h2 className="text-3xl font-black mb-4 text-white">AI Generation Failed</h2>
        <button onClick={() => setPhase('selection')} className="btn-outline px-8 py-4 rounded-2xl font-bold">Back</button>
      </div>
    );
  }

  return null;
};

export default ReasoningChallenge;
