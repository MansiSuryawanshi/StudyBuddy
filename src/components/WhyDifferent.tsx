import React from 'react';

const WhyDifferent: React.FC = () => {
  return (
    <section className="py-24 px-6 md:px-24 bg-purple-900/5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 animate-slide-up">
          <div className="text-xs font-black text-purple-400 mb-4 tracking-[0.3em] uppercase">Why StudyBuddy</div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1] tracking-tight">
            Stop Studying <br />
            <span className="text-red-500/80">Random</span> Content
          </h2>
          <p className="text-xl text-gray-400 mb-12 font-medium leading-relaxed">
            Most study apps give you generic questions that don't match your class. StudyBuddy is different because it uses YOUR actual coursework.
          </p>
          
          <div className="space-y-6">
            {[
              'Built from your real course material',
              'Reveals where you ONLY think you know',
              'Smarter than simple flashcards',
              'High-stakes preparation arena'
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-lg font-bold text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full max-w-xl animate-fade-in anim-delay-3">
          <div className="glass-strong p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between mb-12">
              <div className="text-center">
                <div className="text-3xl font-black text-red-500 mb-2">Other Apps</div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Generic Quizzes</p>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-3xl font-black text-purple-400 mb-2">StudyBuddy</div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Material</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Relevance', left: 20, right: 98 },
                { label: 'Depth', left: 40, right: 94 },
                { label: 'Exam Ready', left: 30, right: 96 }
              ].map((row, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                    <span>{row.label}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-red-800" style={{ width: `${row.left}%` }} />
                    </div>
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-purple-500" style={{ width: `${row.right}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center p-6 bg-white/[0.03] rounded-3xl border border-white/5">
               <p className="text-sm font-black italic text-gray-400 leading-relaxed italic">
                 "I finally stopped wasting time on questions that aren't on my exam."
               </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
