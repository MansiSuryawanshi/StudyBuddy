/**
 * CrossExamination – THE key component.
 * Shows student's original answer → Claude fires a Socratic follow-up → student defends →
 * verdict label animates in → readiness score updates.
 * Owner: Developer 3 (Exam Prep)
 */
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { generateFollowUp, evaluateDefense } from '../services/claudeService';
import { saveCrossExamAttempt, USER_ID, getUserQuizAttempts } from '../services/firebaseService';
import { deriveStudentAnalytics } from '../services/analyticsService';
import type { MistakeDetail } from '../services/analyticsService';
import type { FollowUpResult, DefenseEvaluation } from '../types';

const USE_MOCK_MODE = import.meta.env.VITE_USE_MOCK_CLAUDE === 'true';

interface TopicData {
  question: string;
  pastAnswer: string;
  depthScore: number;
}

const MOCK_PASS_EVAL: DefenseEvaluation = {
  passed: true,
  strength: 'strong',
  what_they_got_right: 'Correctly identified the core mechanism with clear reasoning.',
  what_they_missed: null,
  verdict_label: 'Gap closed',
};

const MOCK_FAIL_EVAL: DefenseEvaluation = {
  passed: false,
  strength: 'weak',
  what_they_got_right: null,
  what_they_missed: 'Failed to explain the underlying mathematical or conceptual basis.',
  verdict_label: 'Study this more',
};

type Phase = 'pick' | 'follow-up' | 'loading-followup' | 'defense' | 'evaluating' | 'verdict';

export const CrossExamination: React.FC = () => {
  const weakAreas = useStore((s) => s.weakAreas ?? []);
  const adjustReadinessScore = useStore((s) => s.adjustReadinessScore);
  const addCrossExamRecord = useStore((s) => s.addCrossExamRecord);
  useStore((s) => s.readinessScore); // used by ReadinessScore component via store

  const [phase, setPhase] = useState<Phase>('pick');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [followUpData, setFollowUpData] = useState<FollowUpResult | null>(null);
  const [defenseText, setDefenseText] = useState('');
  const [evaluation, setEvaluation] = useState<DefenseEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdictVisible, setVerdictVisible] = useState(false);
  
  const [mistakeVault, setMistakeVault] = useState<Record<string, MistakeDetail[]>>({});
  const [activeMistake, setActiveMistake] = useState<TopicData | null>(null);

  const defenseRef = useRef<HTMLTextAreaElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);
  const verdictTimerRef = useRef<number | null>(null);

  // Load mistakes from Firebase on mount
  useEffect(() => {
    const fetchMistakes = async () => {
      try {
        const attempts = await getUserQuizAttempts();
        const analytics = deriveStudentAnalytics(attempts);
        setMistakeVault(analytics.mistakeVault);
      } catch (err) {
        console.error("[CrossExam] Failed to load history for mistake vault:", err);
      }
    };
    fetchMistakes();
  }, []);

  const clearVerdictTimer = () => {
    if (verdictTimerRef.current !== null) {
      window.clearTimeout(verdictTimerRef.current);
      verdictTimerRef.current = null;
    }
  };

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic);
    setPhase('loading-followup');
    setError(null);
    setEvaluation(null);
    setVerdictVisible(false);
    setDefenseText('');
    setFollowUpData(null);
    clearVerdictTimer();

    try {
      // Pick a real mistake from the vault
      const options = mistakeVault[topic] || [];
      const mistake = options.length > 0 
        ? options[Math.floor(Math.random() * options.length)]
        : null;

      const entry: TopicData = mistake 
        ? {
            question: mistake.question,
            pastAnswer: mistake.userAnswer,
            depthScore: 4.5 // Default starting depth for mistake probing
          }
        : {
            question: `Explain the fundamental concepts of ${topic}.`,
            pastAnswer: `${topic} is a key topic that I have been studying in this course.`,
            depthScore: 4
          };

      setActiveMistake(entry);
      console.log(`[CrossExam] Selected factual source for probing:`, entry);

      let fu: FollowUpResult;

      if (USE_MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 1200));
        const entry = activeMistake || { question: "", pastAnswer: "", depthScore: 4 };
        fu = {
            followup_question: `[MOCK] Can you explain more precisely why ${topic} is considered a fundamental challenge?`,
            weak_point_targeted: 'Depth of conceptual understanding',
            deep_answer_covers: ['Core mechanism', 'Mathematical basis', 'Practical implications'],
            score_if_passed: Math.min(entry.depthScore + 1.5, 10),
            score_if_failed: Math.max(entry.depthScore - 2, 0),
          };
      } else {
        const entry = activeMistake || { question: "", pastAnswer: "", depthScore: 4 };
        fu = await generateFollowUp(entry.question, entry.pastAnswer, entry.depthScore);
      }

      setFollowUpData(fu);
      setPhase('follow-up');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate follow-up');
      setPhase('pick');
    }
  };

  const handleSubmitDefense = async () => {
    if (!defenseText.trim() || !followUpData || !activeMistake) return;

    setPhase('evaluating');
    setError(null);
    clearVerdictTimer();

    try {
      let ev: DefenseEvaluation;

      if (USE_MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 1400));
        const keywordBlob = followUpData.deep_answer_covers.join(' ').toLowerCase();
        const defenseLower = defenseText.toLowerCase();
        const matched = keywordBlob
          .split(/\s+/)
          .filter((word: string) => word.length > 4 && defenseLower.includes(word)).length;

        ev = defenseText.length > 80 && matched >= 1 ? MOCK_PASS_EVAL : MOCK_FAIL_EVAL;
      } else {
        ev = await evaluateDefense(
          activeMistake.question,
          activeMistake.pastAnswer,
          followUpData.followup_question,
          defenseText,
          followUpData.deep_answer_covers
        );
      }

      setEvaluation(ev);
      setPhase('verdict');

      let adjustment = 0;
      if (ev.passed) {
        adjustment = ev.strength === 'strong' ? 6 : ev.strength === 'adequate' ? 3 : 1;
      } else {
        adjustment = ev.strength === 'weak' ? -5 : -2;
      }

      adjustReadinessScore(adjustment);

      const record = {
        userId: USER_ID,
        topic: selectedTopic,
        originalQuestion: activeMistake.question,
        originalAnswer: activeMistake.pastAnswer,
        followUpQuestion: followUpData.followup_question,
        defenseAnswer: defenseText,
        passed: ev.passed,
        verdictLabel: ev.verdict_label,
        scoreAdjustment: adjustment,
        strength: ev.strength,
        whatRight: ev.what_they_got_right,
        whatMissed: ev.what_they_missed
      };

      addCrossExamRecord({
        originalQuestion: activeMistake.question,
        originalAnswer: activeMistake.pastAnswer,
        followUpQuestion: followUpData.followup_question,
        defenseAnswer: defenseText,
        passed: ev.passed,
        verdictLabel: ev.verdict_label,
        scoreAdjustment: adjustment,
      });
      
      // Persist to Firebase
      try {
        console.log(`[CrossExam] Persistence started for topic: ${selectedTopic}`);
        await saveCrossExamAttempt(record);
      } catch (persistenceError) {
        console.error("[CrossExam] Persistence failed:", persistenceError);
      }

      requestAnimationFrame(() => {
        verdictTimerRef.current = window.setTimeout(() => {
          setVerdictVisible(true);
        }, 60);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to evaluate defense');
      setPhase('defense');
    }
  };

  const handleReset = () => {
    clearVerdictTimer();
    setPhase('pick');
    setSelectedTopic('');
    setFollowUpData(null);
    setDefenseText('');
    setEvaluation(null);
    setVerdictVisible(false);
    setError(null);
  };

  useEffect(() => {
    return () => {
      clearVerdictTimer();
    };
  }, []);

  useEffect(() => {
    if (phase === 'verdict' && verdictRef.current) {
      verdictRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'defense') {
      defenseRef.current?.focus();
    }
  }, [phase]);

  const VerdictChip = ({ ev }: { ev: DefenseEvaluation }) => {
    const map = {
      'Gap closed': { cls: 'verdict-pass', icon: '✓' },
      'Partial understanding': { cls: 'verdict-partial', icon: '~' },
      'Study this more': { cls: 'verdict-fail', icon: '✗' },
    } as const;

    const cfg = map[ev.verdict_label as keyof typeof map] ?? map['Partial understanding'];

    return (
      <div className={`verdict-chip ${cfg.cls} ${verdictVisible ? 'verdict-chip--visible' : ''}`}>
        <span className="verdict-icon">{cfg.icon}</span>
        <span className="verdict-label-text">{ev.verdict_label}</span>
      </div>
    );
  };

  return (
    <div className="ep-card cross-exam-card">
      <div className="ep-card-header">
        <h3 className="ep-card-title">🧠 Cross-Examination</h3>
        <span className="ep-card-subtitle">Socratic probing by Claude</span>
      </div>

      {USE_MOCK_MODE && (
        <div className="demo-banner">
          Demo mode — set <code>VITE_USE_MOCK_CLAUDE=false</code> and connect your backend to use live AI.
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {phase === 'pick' && (
        <div className="pick-topic-section">
          <p className="pick-prompt">Select a weak area to be cross-examined on:</p>

          {weakAreas.length === 0 ? (
            <div className="empty-state">
              No weak areas found yet. Add some topics to your store first.
            </div>
          ) : (
            <div className="pick-topic-grid">
              {weakAreas.map((area: string, idx: number) => (
                <button
                  key={`${area}-${idx}`}
                  className="pick-topic-btn"
                  onClick={() => handleTopicSelect(area)}
                >
                  <span className="pick-topic-icon">⚡</span>
                  {area}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'loading-followup' && (
        <div className="loading-state">
          <div className="spinner" />
          <p className="loading-text">Claude is analysing your past answer…</p>
        </div>
      )}

      {(phase === 'follow-up' || phase === 'defense' || phase === 'evaluating' || phase === 'verdict') &&
        activeMistake &&
        followUpData && (
          <div className="exam-flow">
            <div className="exam-topic-label">
              <span className="gap-tag">⚠ {selectedTopic}</span>
            </div>

            <div className="past-answer-group">
              <p className="section-micro-label">Your past answer</p>
              <blockquote className="past-answer-box">{activeMistake.pastAnswer}</blockquote>
            </div>

            <div className="follow-up-card">
              <div className="follow-up-header">
                <span className="claude-avatar">✦</span>
                <span className="follow-up-label">Claude&apos;s follow-up</span>
              </div>
              <p className="follow-up-question">{followUpData.followup_question}</p>
              <p className="weak-point-targeted">
                <em>Probing:</em> {followUpData.weak_point_targeted}
              </p>
            </div>

            {(phase === 'follow-up' || phase === 'defense') && (
              <div className="defense-group">
                <label className="section-micro-label" htmlFor="defense-input">
                  Your defense answer
                </label>
                <textarea
                  id="defense-input"
                  ref={defenseRef}
                  className="defense-textarea"
                  rows={5}
                  placeholder="Explain your reasoning in depth…"
                  value={defenseText}
                  onChange={(e) => {
                    setDefenseText(e.target.value);
                    setPhase('defense');
                  }}
                />
                <button
                  className="btn-submit-defense"
                  disabled={defenseText.trim().length < 10}
                  onClick={handleSubmitDefense}
                >
                  Submit defense →
                </button>
              </div>
            )}

            {phase === 'evaluating' && (
              <div className="loading-state">
                <div className="spinner" />
                <p className="loading-text">Claude is evaluating your defense…</p>
              </div>
            )}

            {phase === 'verdict' && evaluation && (
              <div className="verdict-section" ref={verdictRef}>
                <VerdictChip ev={evaluation} />

                <div className={`verdict-detail ${verdictVisible ? 'verdict-detail--visible' : ''}`}>
                  {evaluation.what_they_got_right && (
                    <div className="verdict-row verdict-row--pass">
                      <span className="verdict-row-icon">✓</span>
                      <span>{evaluation.what_they_got_right}</span>
                    </div>
                  )}

                  {evaluation.what_they_missed && (
                    <div className="verdict-row verdict-row--fail">
                      <span className="verdict-row-icon">✗</span>
                      <span>{evaluation.what_they_missed}</span>
                    </div>
                  )}

                  <div className="verdict-strength">
                    Strength: <strong>{evaluation.strength}</strong>
                  </div>
                </div>

                <button className="btn-try-another" onClick={handleReset}>
                  Try another question ↺
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default CrossExamination;