import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import WhyDifferent from './components/WhyDifferent';
import FinalCTA from './components/FinalCTA';
import ReasoningChallenge from './components/ReasoningChallenge';
import { StudySchedule } from './components/StudySchedule';
import { StudyReport } from './components/StudyReport';
import { useStore } from './store/store';
import './index.css';

const DEMO_SESSION = {
  roomId: 'demo-room',
  phase: 'revealed' as const,
  currentQuestion: null,
  players: ['student_a', 'student_b'],
  answers: {},
  scores: {
    round1: {
      student_a: { correctness: 6, reasoning_depth: 7, clarity: 8, total: 70, misconception_present: false, misconception_name: null, concept_gap: "Newton's 3rd Law" },
      student_b: { correctness: 5, reasoning_depth: 4, clarity: 6, total: 50, misconception_present: true, misconception_name: 'Teleological fallacy', concept_gap: 'Entropy' },
      depth_insight: 'Student A showed deeper causal reasoning',
      same_answer_different_depth: true,
      winner: 'A' as const,
    },
  },
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [uploadedContent, setUploadedContent] = useState<string>('');
  const setSession = useStore((state) => state.setSession);

  useEffect(() => { setSession(DEMO_SESSION); }, [setSession]);

  const goToUpload = () => setActiveTab(1);
  const goToChallenge = () => setActiveTab(2);

  return (
    <div className="min-h-screen bg-[#070714] text-white selection:bg-purple-500/30 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>
        {activeTab === 0 && (
          <div className="animate-fade-in">
            <Hero onStart={goToUpload} />
            <Features />
            <HowItWorks />
            <WhyDifferent />
            <FinalCTA onUpload={goToUpload} />
            <footer className="py-12 border-t border-white/5 text-center text-gray-600 font-bold text-xs uppercase tracking-widest">
              StudyBuddy &copy; 2026 &bull; Smart AI Study Companion
            </footer>
          </div>
        )}
        {activeTab === 1 && (
          <div className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto py-12 animate-slide-up">
              <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">Step 1: <span className="gradient-text">Upload Material</span></h2>
              <p className="text-gray-500 mb-10 font-medium text-lg">Paste your textbook, notes, or syllabus to start generating custom reasoning questions.</p>
              <textarea className="w-full h-96 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 text-xl text-white placeholder-gray-600 mb-8 focus:outline-none focus:border-purple-500/50 transition-all font-medium leading-relaxed shadow-inner" placeholder="Paste your study notes or content here..." value={uploadedContent} onChange={(e) => setUploadedContent(e.target.value)} />
              <button onClick={goToChallenge} className="btn-premium w-full py-7 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-purple-500/20 cursor-pointer">Start Challenge with this content →</button>
            </div>
          </div>
        )}
        {activeTab === 2 && (
          <div className="container mx-auto px-6 py-8 animate-fade-in">
            {uploadedContent ? (
              <div className="max-w-3xl mx-auto flex flex-col items-center">
                <div className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-8">Custom Content Active</div>
                <ReasoningChallenge />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/[0.03] border border-white/5 p-1 px-4 py-2 rounded-full inline-block mb-10">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Demo Mode (General History)</span>
                </div>
                <ReasoningChallenge />
              </div>
            )}
          </div>
        )}
        {activeTab === 3 && (
          <div className="flex flex-col items-center justify-center py-40 text-center animate-fade-in opacity-50">
            <h2 className="text-6xl font-black text-gray-600 tracking-tighter lowercase">coming soon</h2>
            <p className="text-gray-500 mt-6 font-medium tracking-wide text-lg">— AI evaluation and scoring tools —</p>
          </div>
        )}
        {activeTab === 4 && <StudySchedule onSwitchToChallenge={() => setActiveTab(2)} />}
        {activeTab === 5 && <StudyReport />}
      </main>
    </div>
  );
};

export default App;
