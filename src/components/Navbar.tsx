import React from 'react';

interface NavbarProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { label: 'Home', index: 0 },
    { label: 'Upload', index: 1 },
    { label: 'Challenge', index: 2 },
    { label: 'Exam Prep', index: 3 },
    { label: 'Study Schedule', index: 4 },
    { label: 'Study Report', index: 5 },
  ];

  return (
    <nav className="glass sticky top-0 z-[100] px-6 md:px-12 py-4 flex items-center justify-between">
      {/* Logo */}
      <div 
        className="text-2xl font-black gradient-text tracking-tighter cursor-pointer"
        onClick={() => setActiveTab(0)}
      >
        StudyBuddy
      </div>

      {/* Desktop Nav Items */}
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <button
            key={item.index}
            onClick={() => setActiveTab(item.index)}
            className={`text-sm font-semibold transition-all duration-300 relative group cursor-pointer ${
              activeTab === item.index ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {item.label}
            <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-purple-500 transform origin-left transition-transform duration-300 ${
              activeTab === item.index ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
            }`} />
          </button>
        ))}
      </div>

      {/* CTA Button */}
      <button 
        onClick={() => setActiveTab(1)}
        className="btn-premium px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-lg shadow-purple-500/20"
      >
        Get Started
      </button>

      {/* Mobile Menu Icon (Placeholder for now) */}
      <div className="md:hidden">
        <button className="text-white p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
