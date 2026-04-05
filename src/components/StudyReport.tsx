import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Clock, 
  ChevronDown, 
  Brain, 
  BarChart2, 
  Calendar,
  Activity
} from 'lucide-react';
import type { QuizAttempt } from '../types';
import { getUserQuizAttempts, USER_ID } from '../services/firebaseService';
import { generateReport } from '../services/claudeService';

// ── TYPES ───────────────────────────────────────────────────────────────────

interface DashboardMetrics {
  totalQuizzes: number;
  avgScore: number;
  bestScore: number;
  worstScore: number;
  avgAccuracy: number;
  trend: number; // % change latest vs avg
  topicPerformance: Record<string, { total: number; correct: number; accuracy: number }>;
}

// ── COMPONENTS ──────────────────────────────────────────────────────────────

const ProgressChart: React.FC<{ data: QuizAttempt[] }> = ({ data }) => {
  if (data.length < 2) return (
    <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-gray-500 font-bold italic">
      Take more quizzes to see progress trends
    </div>
  );

  const points = data.slice().reverse().map((a, i) => ({
    x: i,
    y: a.accuracy
  }));

  const maxPoints = points.length;
  const width = 600;
  const height = 150;
  const padding = 20;

  const getX = (i: number) => (i / (maxPoints - 1)) * (width - padding * 2) + padding;
  const getY = (y: number) => height - (y / 100) * (height - padding * 2) - padding;

  const pathData = points.reduce((acc, p, i) => 
    acc + `${i === 0 ? 'M' : 'L'} ${getX(p.x)} ${getY(p.y)}`, 
  '');

  const areaData = pathData + ` L ${getX(points[points.length - 1].x)} ${height} L ${getX(points[0].x)} ${height} Z`;

  return (
    <div className="w-full h-48 relative group">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <motion.path
          d={areaData}
          fill="url(#gradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.path
          d={pathData}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={getX(p.x)}
            cy={getY(p.y)}
            r="4"
            fill="#a855f7"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5 + (i * 0.1) }}
            className="cursor-pointer hover:r-6 transition-all"
          >
            <title>{p.y}% Accuracy</title>
          </motion.circle>
        ))}

        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] uppercase font-black text-gray-500 tracking-widest px-2 pt-4">
        <span>Oldest</span>
        <span>Latest Activity</span>
      </div>
    </div>
  );
};

const QuizAttemptCard: React.FC<{ attempt: QuizAttempt }> = ({ attempt }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const date = new Date((attempt.createdAt?.seconds || 0) * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="glass rounded-[2rem] border-2 border-white/5 overflow-hidden transition-all hover:border-white/10 group">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${attempt.accuracy >= 70 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {attempt.accuracy}%
          </div>
          <div>
            <h4 className="font-bold text-white mb-0.5 line-clamp-1">{attempt.selectedFileNames.join(', ')}</h4>
            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
               <span className="flex items-center gap-1"><Calendar size={12}/> {date}</span>
               <span className="flex items-center gap-1"><Award size={12}/> {attempt.score} pts</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Results</span>
              <span className="text-sm font-bold text-white">{attempt.correctCount} / {attempt.totalQuestions} Correct</span>
           </div>
           <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
             <ChevronDown size={18} className="text-gray-400" />
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-white/[0.01]"
          >
            <div className="p-6 space-y-4">
              {attempt.questionResults.map((res, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${res.isCorrect ? 'bg-emerald-500/[0.02] border-emerald-500/10' : 'bg-red-500/[0.02] border-red-500/10'}`}>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase text-purple-500 tracking-[0.2em]">{res.type === 'mcq' ? 'Multiple Choice' : 'Reasoning'}</span>
                      <p className="font-bold text-sm text-white leading-tight">{res.questionText}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${res.isCorrect ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {res.isCorrect ? 'Correct' : 'Wrong'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] mb-3">
                    <div>
                      <p className="text-gray-500 uppercase mb-1">Your Answer</p>
                      <p className={res.isCorrect ? 'text-emerald-400' : 'text-red-400'}>{res.userAnswer || 'No answer'}</p>
                    </div>
                    {!res.isCorrect && (
                      <div>
                        <p className="text-gray-500 uppercase mb-1">Ideal Answer</p>
                        <p className="text-white font-medium">{res.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                  {res.feedback && (
                    <div className="p-3 bg-black/20 rounded-xl text-[11px] text-gray-400 italic border border-white/5">
                      {res.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────

export const StudyReport: React.FC = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getUserQuizAttempts();
      console.log(`[StudyReport] Loaded quiz attempt count: ${data.length}`);
      setAttempts(data);
    } catch (err) {
      console.error("[StudyReport] Data load failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = useMemo((): DashboardMetrics | null => {
    if (attempts.length === 0) return null;

    const total = attempts.length;
    const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / total);
    const avgAccuracy = Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / total);
    const best = Math.max(...attempts.map(a => a.score));
    const worst = Math.min(...attempts.map(a => a.score));
    
    // Trend: latest quiz vs avg accuracy
    const latest = attempts[0].accuracy;
    const trend = latest - avgAccuracy;

    // Topic Performance
    const topicPerf: Record<string, { total: number; correct: number; accuracy: number }> = {};
    attempts.forEach(attempt => {
      attempt.questionResults.forEach(res => {
        const t = res.topic || 'General';
        if (!topicPerf[t]) topicPerf[t] = { total: 0, correct: 0, accuracy: 0 };
        topicPerf[t].total++;
        if (res.isCorrect) topicPerf[t].correct++;
      });
    });

    Object.keys(topicPerf).forEach(t => {
      topicPerf[t].accuracy = Math.round((topicPerf[t].correct / topicPerf[t].total) * 100);
    });

    return { totalQuizzes: total, avgScore, bestScore: best, worstScore: worst, avgAccuracy, trend, topicPerformance: topicPerf };
  }, [attempts]);

  const handleGenerateAiInsights = async () => {
    if (!metrics) return;
    setIsGeneratingAi(true);
    try {
      const snapshot = {
        quizSessions: attempts.map(a => ({ scoreA: a.accuracy, conceptGaps: a.weakTopics, misconceptions: [], depthInsight: '' })),
        scheduleAdherence: { sessionsPlanned: 0, sessionsCompleted: 0, priorityGap: '' },
        examReadiness: { overallScore: metrics.avgAccuracy, topicCoverage: [], weakAreas: [], crossExamsPassed: 0, crossExamsFailed: 0 }
      };
      
      const report = await generateReport(snapshot as any);
      setAiReport(report.sections.map(s => `**${s.title}**: ${s.summary}`).join('\n\n'));
    } catch (err) {
      console.error("[StudyReport] AI generation failed:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-pulse">
        <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-8 animate-spin border-4 border-purple-500 border-t-transparent" />
        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Loading Analytics...</h2>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 animate-fade-in">
        <div className="glass-strong rounded-[3rem] p-12 text-center border-2 border-white/5 relative overflow-hidden mb-8">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Activity size={120} className="text-purple-500" />
           </div>
           <div className="w-20 h-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-2xl">
             <BarChart2 size={32} className="text-gray-600" />
           </div>
           <h2 className="text-4xl font-black mb-4 text-white uppercase tracking-tighter italic">Tracking Growth</h2>
           <p className="text-gray-400 mb-8 max-w-sm mx-auto font-medium">Your performance dashboard will activate automatically as soon as your first challenge is completed and synced.</p>
           
           <div className="bg-black/40 rounded-2xl p-6 mb-8 max-w-md mx-auto border border-white/10">
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] mb-3">Diagnostic Link</p>
              <div className="flex items-center justify-between gap-4 text-xs font-mono text-gray-400 bg-white/5 p-3 rounded-lg">
                 <span className="truncate">Path: users/{USER_ID}/quizAttempts</span>
                 <button onClick={() => { navigator.clipboard.writeText(USER_ID); alert("User ID copied"); }} className="text-purple-500 hover:text-white transition-colors">Copy</button>
              </div>
           </div>

           <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button 
                 onClick={loadData}
                 className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black text-white uppercase tracking-widest transition-all border border-white/5"
              >
                 Force Sync Now
              </button>
              <button onClick={() => window.location.href = '/'} className="btn-premium px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-purple-500/20">Start First Challenge →</button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fade-in">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-4">Study <span className="text-purple-500">Report</span></h1>
          <p className="text-gray-400 font-bold flex items-center gap-2"><Activity size={18} className="text-purple-400"/> Real-time performance analytics across all activity.</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={loadData} className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black text-white uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2">
              <Clock size={14}/> Refresh Stats
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        <div className="glass p-6 rounded-[2rem] border-2 border-white/5 relative overflow-hidden group">
           <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-500/5 rounded-full group-hover:scale-150 transition-all" />
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Total Quizzes</span>
           <div className="text-4xl font-black text-white">{metrics?.totalQuizzes}</div>
        </div>
        <div className="glass p-6 rounded-[2rem] border-2 border-white/5 relative overflow-hidden">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Avg Accuracy</span>
           <div className="text-4xl font-black text-white">{metrics?.avgAccuracy}%</div>
        </div>
        <div className="glass p-6 rounded-[2rem] border-2 border-white/5 relative overflow-hidden">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Improvement</span>
           <div className={`text-4xl font-black flex items-center gap-1 ${metrics && metrics.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {metrics && metrics.trend >= 0 ? <TrendingUp size={28}/> : <TrendingDown size={28}/>}
              {Math.abs(metrics?.trend || 0)}%
           </div>
        </div>
        <div className="glass p-6 rounded-[2rem] border-2 border-white/5 relative overflow-hidden">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Best Score</span>
           <div className="text-4xl font-black text-white">{metrics?.bestScore}</div>
        </div>
        <div className="glass p-6 rounded-[2rem] border-2 border-white/5 relative overflow-hidden">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Worst Score</span>
           <div className="text-4xl font-black text-gray-500">{metrics?.worstScore}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <div className="lg:col-span-2 glass rounded-[3rem] border-2 border-white/5 p-8 relative">
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-10 flex items-center gap-3">
              <BarChart2 size={18} className="text-purple-500"/> Performance Over Time
           </h3>
           <ProgressChart data={attempts} />
        </div>

        <div className="glass rounded-[3rem] border-2 border-white/5 p-8">
           <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
              <Target size={18} className="text-pink-500"/> Topic Mastery
           </h3>
           <div className="space-y-6">
              {Object.entries(metrics?.topicPerformance || {}).slice(0, 5).map(([topic, data]) => (
                <div key={topic}>
                   <div className="flex justify-between text-xs font-bold text-white mb-2">
                      <span className="truncate pr-4">{topic}</span>
                      <span>{data.accuracy}%</span>
                   </div>
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.accuracy}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${data.accuracy >= 70 ? 'bg-emerald-500' : 'bg-purple-500'}`} 
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <section className="mb-16">
        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-8 pb-4 border-b border-white/5 flex items-center gap-3">
          <Calendar size={18} className="text-emerald-500"/> Attempt History
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {attempts.map((attempt) => (
            <QuizAttemptCard key={attempt.id} attempt={attempt} />
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="glass-strong rounded-[3rem] border-2 border-white/5 p-12 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Brain size={120} className="text-purple-500 rotate-12" />
           </div>
           <h2 className="text-sm font-black text-purple-500 uppercase tracking-[0.5em] mb-4">Claude Reasoning Engine</h2>
           <h3 className="text-3xl font-black text-white mb-8 tracking-tighter">Behavioral Analysis</h3>
           
           {!aiReport ? (
             <div className="py-8">
               <p className="text-gray-500 font-bold mb-8 max-w-md mx-auto">Claude can analyze your history to detect complex patterns, recurring misconceptions, and deep growth areas.</p>
               <button 
                 onClick={handleGenerateAiInsights}
                 disabled={isGeneratingAi}
                 className="btn-outline px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-purple-400 hover:text-white transition-all disabled:opacity-50"
               >
                 {isGeneratingAi ? "Analyzing History..." : "Generate AI Insights"}
               </button>
             </div>
           ) : (
             <div className="max-w-2xl mx-auto text-left prose prose-invert">
                <div className="bg-white/5 rounded-3xl p-8 border border-white/5 whitespace-pre-wrap text-gray-300 font-medium">
                   {aiReport}
                </div>
                <button 
                   onClick={() => setAiReport(null)}
                   className="mt-6 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                   Clear Analysis
                </button>
             </div>
           )}
        </div>
      </section>
    </div>
  );
};

export default StudyReport;
