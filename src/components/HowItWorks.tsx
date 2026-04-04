import React from 'react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Upload Material',
      description: 'Upload your syllabus, notes, slides, or plain text content.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
      )
    },
    {
      number: '02',
      title: 'Extract Topics',
      description: 'Our AI analyzes your material and pulls out exactly what you need to know.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"></path><path d="m4.93 10.93 1.41 1.41"></path><path d="M2 18h2"></path><path d="M20 18h2"></path><path d="m19.07 10.93-1.41 1.41"></path><path d="M22 22H2"></path><path d="m16 6-4 4-4-4"></path><path d="M16 18a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path></svg>
      )
    },
    {
      number: '03',
      title: 'Generate Challenges',
      description: 'You get a series of focused reasoning challenges built from your material.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path></svg>
      )
    },
    {
      number: '04',
      title: 'Improve Results',
      description: 'See exactly where you are weak and prepare smarter for the real exam.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      )
    }
  ];

  return (
    <section className="py-24 px-6 md:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">
            Smart Learning <span className="text-purple-400">Simplified</span>
          </h2>
          <p className="text-gray-400 font-medium">Four steps to better exam results.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-[60px] left-24 right-24 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0" />
          
          {steps.map((step, i) => (
            <div key={i} className="relative z-10 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="mb-8 w-20 h-20 rounded-3xl glass-strong flex items-center justify-center text-purple-400 shadow-xl border-purple-500/10">
                {step.icon}
              </div>
              <div className="text-xs font-black text-purple-500 mb-2 uppercase tracking-widest">{step.number}</div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">{step.title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
