import { useState } from 'react';
import { NavigationTabs, TabId } from './components/NavigationTabs';
import { StudySchedule } from './components/StudySchedule';
import { ReasoningChallenge } from './components/ReasoningChallenge';
import { ExamPrep } from './components/ExamPrep';
import { ResultsHistory } from './components/ResultsHistory';
import './App.css';

// Mock concept gaps — in production these come from quiz ScoreResult.conceptGapTags
const MOCK_GAPS = ['Newton\'s 3rd Law', 'Entropy', 'Cognitive Bias'];
const MOCK_AVG_SCORE = 64;
const MOCK_CHALLENGES_DONE = 3;

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('schedule');

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={{ flex: 1 }}>
        {activeTab === 'challenge' && <ReasoningChallenge />}
        {activeTab === 'exam-prep' && <ExamPrep />}
        {activeTab === 'history' && <ResultsHistory />}
        {activeTab === 'schedule' && (
          <StudySchedule
            conceptGaps={MOCK_GAPS}
            avgScore={MOCK_AVG_SCORE}
            challengesDone={MOCK_CHALLENGES_DONE}
            onSwitchToChallenge={() => setActiveTab('challenge')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
