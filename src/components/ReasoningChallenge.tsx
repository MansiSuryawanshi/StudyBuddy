import React, { useEffect, useState } from 'react';
import type { SessionPhase, ScoreResult } from '../types/index';
import { scoreAnswers } from '../services/claudeService';
import QuestionCard from './QuestionCard';
import AnswerInput from './AnswerInput';
import AnalyzingState from './AnalyzingState';
import RevealScreen from './RevealScreen';

const question = 'Why did the Roman Empire fall?';
const subject = 'History';
const challengeNumber = 1;
const total = 5;
const peerAnswer =
  'The Roman Empire fell due to a combination of economic troubles, military pressures from Germanic tribes, and political instability including frequent changes in leadership. The overextension of the empire made it difficult to defend borders effectively.';

const ReasoningChallenge: React.FC = () => {
  const [phase, setPhase] = useState<SessionPhase>('answering');
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [peerIsTyping, setPeerIsTyping] = useState<boolean>(false);

  // Simulate peer typing: true at 3s, false at 8s
  useEffect(() => {
    const startTimer = setTimeout(() => setPeerIsTyping(true), 3000);
    const stopTimer = setTimeout(() => setPeerIsTyping(false), 8000);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
    };
  }, []);

  const handleSubmit = async (answer: string, _confidence: number) => {
    setStudentAnswer(answer);
    setPhase('analyzing');

    try {
      const [result] = await Promise.all([
        scoreAnswers(question, answer, peerAnswer),
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
      ]);
      setScoreResult(result);
      setPhase('revealed');
    } catch (err) {
      console.error('scoreAnswers failed:', err);
      setPhase('answering');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {phase === 'answering' && (
        <>
          <QuestionCard
            question={question}
            subject={subject}
            challengeNumber={challengeNumber}
            total={total}
          />
          <div className="mt-4">
            <AnswerInput onSubmit={handleSubmit} peerIsTyping={peerIsTyping} />
          </div>
        </>
      )}

      {phase === 'analyzing' && <AnalyzingState />}

      {phase === 'revealed' && scoreResult !== null && (
        <RevealScreen
          scoreResult={scoreResult}
          answerA={studentAnswer}
          answerB={peerAnswer}
        />
      )}
    </div>
  );
};

export default ReasoningChallenge;
