/**
 * CrossExamination – THE key component.
 * Shows student's original answer → Claude fires a Socratic follow-up → student defends →
 * verdict label animates in → readiness score updates.
 * Owner: Developer 3 (Exam Prep)
 */
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { generateFollowUp, evaluateDefense } from '../services/claudeService';
import type { FollowUpResult, DefenseEvaluation } from '../types';

const USE_MOCK_MODE = import.meta.env.VITE_USE_MOCK_CLAUDE === 'true';

type TopicData = {
  question: string;
  pastAnswer: string;
  depthScore: number;
};

const MOCK_QUESTIONS: Record<string, TopicData> = {
  'Vanishing Gradient Problem': {
    question: 'Explain the vanishing gradient problem and why it makes training deep networks difficult.',
    pastAnswer:
      'The vanishing gradient problem happens when gradients become very small during backpropagation, making it hard for the network to learn. This is a problem in deep networks.',
    depthScore: 3.5,
  },
  'Bayesian Inference': {
    question: 'How does Bayesian inference differ from frequentist inference, and when would you prefer it?',
    pastAnswer:
      'Bayesian inference uses prior beliefs and updates them with data to get a posterior distribution. Frequentist inference uses only the data without priors.',
    depthScore: 4.0,
  },
  'Attention Mechanisms': {
    question: 'Describe how attention mechanisms work in transformer models.',
    pastAnswer:
      'Attention mechanisms allow the model to focus on relevant parts of the input. In transformers, queries, keys, and values are computed and attention scores determine importance.',
    depthScore: 4.5,
  },
  'Regularization Trade-offs': {
    question: 'What are the trade-offs between L1 and L2 regularization?',
    pastAnswer:
      'L1 regularization creates sparse weights and L2 keeps weights small. L1 is good for feature selection and L2 prevents overfitting in general.',
    depthScore: 3.0,
  },
};

const MOCK_FOLLOW_UP: Record<string, FollowUpResult> = {
  'Vanishing Gradient Problem': {
    followup_question:
      'You said gradients become "very small" — what is the precise mathematical reason this happens in networks with sigmoid activations, and how does the chain rule expose it?',
    weak_point_targeted: 'Mathematical mechanism of gradient decay through sigmoid derivatives',
    deep_answer_covers: [
      'Sigmoid derivative is bounded between 0 and 0.25',
      'Chain rule multiplies these small values through each layer',
      'Exponential decay with depth',
    ],
    score_if_passed: 5.0,
    score_if_failed: 1.5,
  },
  'Bayesian Inference': {
    followup_question:
      'You mentioned "prior beliefs" — how do you choose a prior in practice, and what happens when your prior is wrong?',
    weak_point_targeted: 'Prior selection and sensitivity analysis',
    deep_answer_covers: [
      'Conjugate priors for computational convenience',
      'Informative vs uninformative priors',
      'Prior-likelihood conflict and posterior robustness',
    ],
    score_if_passed: 5.5,
    score_if_failed: 2.0,
  },
  'Attention Mechanisms': {
    followup_question:
      'You described query-key-value attention — what is the computational complexity of self-attention with respect to sequence length, and why does this matter?',
    weak_point_targeted: 'Quadratic complexity scaling with sequence length',
    deep_answer_covers: [
      'O(n²) time and space complexity',
      'Implications for long documents',
      'Solutions like sparse attention or linear attention',
    ],
    score_if_passed: 6.0,
    score_if_failed: 2.5,
  },
  'Regularization Trade-offs': {
    followup_question:
      'You said L1 is "good for feature selection" — can you explain geometrically why L1 produces sparse solutions while L2 does not?',
    weak_point_targeted: 'Geometric intuition for sparsity via L1 ball corners',
    deep_answer_covers: [
      'L1 ball has corners aligned with axes',
      'Contours of loss function intersect corners, zeroing out features',
      'L2 ball is smooth — no preference for axis-aligned solutions',
    ],
    score_if_passed: 4.5,
    score_if_failed: 1.0,
  },
};

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

  const defenseRef = useRef<HTMLTextAreaElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);
  const verdictTimerRef = useRef<number | null>(null);

  const currentEntry: TopicData | null =
    MOCK_QUESTIONS[selectedTopic] ??
    (selectedTopic
      ? {
          question: `Explain the concept of ${selectedTopic} in depth.`,
          pastAnswer: `${selectedTopic} is an important concept in machine learning that affects model performance.`,
          depthScore: 4,
        }
      : null);

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
      const entry =
        MOCK_QUESTIONS[topic] ??
        ({
          question: `Explain the concept of ${topic} in depth.`,
          pastAnswer: `${topic} is an important concept in machine learning that affects model performance.`,
          depthScore: 4,
        } as TopicData);

      let fu: FollowUpResult;

      if (USE_MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 1200));
        fu =
          MOCK_FOLLOW_UP[topic] ??
          ({
            followup_question: `Can you explain more precisely why ${topic} is considered a fundamental challenge?`,
            weak_point_targeted: 'Depth of conceptual understanding',
            deep_answer_covers: ['Core mechanism', 'Mathematical basis', 'Practical implications'],
            score_if_passed: Math.min(entry.depthScore + 1.5, 10),
            score_if_failed: Math.max(entry.depthScore - 2, 0),
          } as FollowUpResult);
      } else {
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
    if (!defenseText.trim() || !followUpData || !currentEntry) return;

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
          currentEntry.question,
          currentEntry.pastAnswer,
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

      addCrossExamRecord({
        originalQuestion: currentEntry.question,
        originalAnswer: currentEntry.pastAnswer,
        followUpQuestion: followUpData.followup_question,
        defenseAnswer: defenseText,
        passed: ev.passed,
        verdictLabel: ev.verdict_label,
        scoreAdjustment: adjustment,
      });

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
        currentEntry &&
        followUpData && (
          <div className="exam-flow">
            <div className="exam-topic-label">
              <span className="gap-tag">⚠ {selectedTopic}</span>
            </div>

            <div className="past-answer-group">
              <p className="section-micro-label">Your past answer</p>
              <blockquote className="past-answer-box">{currentEntry.pastAnswer}</blockquote>
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