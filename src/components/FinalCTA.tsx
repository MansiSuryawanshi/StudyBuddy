import React from 'react';

interface FinalCTAProps {
  onUpload: () => void;
}

const FinalCTA: React.FC<FinalCTAProps> = ({ onUpload }) => {
  return (
    <section className="py-32 px-6 md:px-24 text-center overflow-hidden relative">
      {/* Background Orbs */}
      <div className="orb w-[500px] h-[500px] bg-purple-600/10 -bottom-40 left-1/2 -translate-x-1/2" />
      
      <div className="max-w-4xl mx-auto z-10 animate-slide-up">
        <h2 className="text-5xl md:text-8xl font-black mb-12 tracking-tighter leading-[1.1]">
          Start studying from <br />
          <span className="gradient-text">What Actually Matters</span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-500 mb-16 font-medium max-w-2xl mx-auto">
          Don't wait until the exam to find out what you missed. Upload your material and find your weak areas today.
        </p>
        
        <button 
          onClick={onUpload}
          className="btn-premium px-16 py-7 rounded-[2.5rem] font-black text-2xl shadow-3xl shadow-purple-500/40 hover:scale-[1.05] active:scale-95 transition-all"
        >
          Upload Your Material
        </button>
        
        <div className="mt-16 flex items-center justify-center gap-8 text-gray-600 font-bold uppercase tracking-widest text-xs">
          <span>Syllabus</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <span>Notes</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <span>Slides</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <span>Textbooks</span>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
