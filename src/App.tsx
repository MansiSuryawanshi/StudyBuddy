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
import { ExamPrep } from './components/ExamPrep';
import { useStore } from './store/store';
import UploadMaterial from './components/UploadMaterial';
import { saveDocument } from './services/firebaseService';
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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [challengeSessionKey, setChallengeSessionKey] = useState<number>(0);

  useEffect(() => { 
    setSession(DEMO_SESSION); 
  }, [setSession]);

  const goToUpload = () => setActiveTab(1);
  
  const handleStartChallenge = async (fileName: string = "Manual Upload") => {
    if (!uploadedContent.trim()) {
      console.warn("[App] Cannot start challenge: uploadedContent is empty.");
      return;
    }
    
    console.log(`[App] handleStartChallenge started for: ${fileName}`);
    setIsSaving(true);
    try {
      const docId = await saveDocument(fileName, uploadedContent);
      console.log(`[App] Firebase success! Document ID: ${docId}. Switching to Challenge tab...`);
      setChallengeSessionKey(prev => prev + 1); // Force Challenge reload
      setActiveTab(2);
    } catch (error) {
      console.error("[App] Failed to save document: ", error);
      alert("Failed to save study material. Please check your Firebase configuration and permissions.");
    } finally {
      setIsSaving(false);
    }
  };

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
            <UploadMaterial 
              content={uploadedContent} 
              onContentChange={setUploadedContent} 
              onStart={handleStartChallenge} 
              isSaving={isSaving} 
            />
          </div>
        )}
        {activeTab === 2 && (
          <div className="container mx-auto px-6 py-8 animate-fade-in">
            <ReasoningChallenge key={challengeSessionKey} />
          </div>
        )}
        {activeTab === 3 && (
          <div className="animate-fade-in">
            <ExamPrep />
          </div>
        )}
        {activeTab === 4 && <StudySchedule onSwitchToChallenge={() => setActiveTab(2)} />}
        {activeTab === 5 && <StudyReport />}
      </main>
    </div>
  );
};

export default App;
