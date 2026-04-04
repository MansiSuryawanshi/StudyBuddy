import { useState } from 'react';
import { NavigationTabs } from './components/NavigationTabs';
import type { TabId } from './components/NavigationTabs';
import { StudySchedule } from './components/StudySchedule';
import { ReasoningChallenge } from './components/ReasoningChallenge';
import { ExamPrep } from './components/ExamPrep';
import { ResultsHistory } from './components/ResultsHistory';
import './App.css';

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
          <StudySchedule onSwitchToChallenge={() => setActiveTab('challenge')} />
        )}
      </main>
    </div>
  );
}

export default App;
