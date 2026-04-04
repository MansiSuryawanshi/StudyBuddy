import React from 'react';

const Features: React.FC = () => {
  const features = [
    {
      title: 'Quizzes from Material',
      description: 'StudyBuddy generates focused challenges directly from your syllabus, notes, or slides.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <path d="M12 18l3.5-3.5L12 11l-3.5 3.5L12 18z"></path>
        </svg>
      ),
    },
    {
      title: 'Weak Topic Detection',
      description: 'Identify exactly where your understanding is weak before the exam hits.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m15 9-6 6"></path>
          <path d="m9 9 6 6"></path>
        </svg>
      ),
    },
    {
      title: 'Confidence Tracker',
      description: 'Compare how confident you feel with how you actually perform on challenges.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400">
          <path d="M12 20v-6"></path>
          <path d="M6 20V10"></path>
          <path d="M18 20V4"></path>
        </svg>
      ),
    },
    {
      title: 'Smart Revision',
      description: 'Get a personalized roadmap of what to study based on your real performance.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
  ];

  return (
    <section className="py-24 px-6 md:px-24 bg-white/[0.01]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 animate-slide-up">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            What StudyBuddy <span className="gradient-text">Actually Does</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto font-medium text-lg">
            We don't do generic rote memorization. We reveal hidden gaps in your understanding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div 
              key={i}
              className={`card-feature glass p-8 rounded-[2rem] border-white/5 hover:border-purple-500/20 group animate-fade-in anim-delay-${i+1}`}
            >
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] inline-block border border-white/5 group-hover:border-purple-500/30 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black mb-4 tracking-tight group-hover:text-purple-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
