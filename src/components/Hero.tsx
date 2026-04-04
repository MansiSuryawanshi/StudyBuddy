import React from 'react';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <section className="relative w-full min-h-[90vh] flex flex-col md:flex-row items-center justify-between px-6 md:px-24 py-16 overflow-hidden">
      {/* Background Orbs */}
      <div className="orb w-[400px] h-[400px] bg-purple-600/30 -top-20 -left-20" />
      <div className="orb w-[300px] h-[300px] bg-blue-600/20 bottom-20 right-20" />
      
      {/* Left Content */}
      <div className="flex-1 z-10 text-center md:text-left animate-slide-up">
        <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">
          Turn Your Notes Into <br />
          <span className="gradient-text">Smart Exam Practice</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl font-medium leading-relaxed">
          Upload syllabus, notes, slides, or study content. StudyBuddy turns your real material into focused quizzes, reveals weak areas, and helps you prepare for exams smarter.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center md:justify-start">
          <button 
            onClick={onStart}
            className="btn-premium px-10 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-purple-500/30 flex items-center gap-3 group"
          >
            Start Now
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
          
          <button className="btn-outline px-10 py-5 rounded-2xl font-black text-xl hover:bg-white/5 transition-all">
            See How It Works
          </button>
        </div>
      </div>

      {/* Right Visual: Animated Card Stack */}
      <div className="flex-1 relative mt-20 md:mt-0 w-full max-w-xl animate-fade-in anim-delay-2 flex justify-center md:justify-end">
        <div className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px]">
          {/* Card 1: Topic Mastery */}
          <div className="absolute top-0 right-0 w-64 h-48 glass-strong rounded-[2rem] p-6 shadow-2xl animate-float z-30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Topic Mastery</span>
            </div>
            <div className="text-3xl font-black mb-2">92%</div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full w-[92%]" />
            </div>
            <p className="text-[10px] text-gray-500 mt-4 font-bold">Strong understanding of SQL Joins</p>
          </div>

          {/* Card 2: AI Quiz Ready */}
          <div className="absolute bottom-10 left-0 w-64 h-48 glass-strong rounded-[2rem] p-6 shadow-2xl animate-float anim-delay-2 z-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">AI Quiz Ready</span>
            </div>
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <div className="h-1.5 flex-1 bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Weak Areas Found */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-48 glass-strong rounded-[2rem] p-6 shadow-2xl animate-float anim-delay-4 z-10 opacity-60 scale-90">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Weak Areas Found</span>
            </div>
            <p className="text-sm font-bold text-gray-300">Recursion logic needs depth</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
