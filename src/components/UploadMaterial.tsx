import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Cloud, CheckCircle2 } from 'lucide-react';

interface UploadMaterialProps {
  content: string;
  onContentChange: (content: string) => void;
  onStart: (fileName?: string) => void;
  isSaving: boolean;
}

type UploadMode = 'paste' | 'file' | 'drive';

const UploadMaterial: React.FC<UploadMaterialProps> = ({ content, onContentChange, onStart, isSaving }) => {
  const [mode, setMode] = useState<UploadMode>('paste');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    console.log(`[Upload] File selected: ${file.name} (${file.type})`);
    setSelectedFile(file);
    
    // For now, read text files directly. PDF/DOCX parsing UI can go here later.
    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        console.log(`[Upload] Text extracted from ${file.name}. Length: ${text.length} characters.`);
        onContentChange(text);
      };
      reader.readAsText(file);
    } else {
      console.log(`[Upload] Non-text file selected. Using placeholder parsing for ${file.name}.`);
      onContentChange(`[Parsing Content from ${file.name}...]`);
    }
  };

  const ctaLabel = {
    paste: content.trim() ? "Start Challenge with this content →" : "Paste content to continue",
    file: selectedFile ? `Use ${selectedFile.name} for challenge →` : "Select a file to continue",
    drive: "Import and continue →"
  }[mode];

  return (
    <div className="max-w-4xl mx-auto py-12 animate-slide-up">
      {/* Selection Header */}
      <div className="mb-12 text-center">
        <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
          Step 1: <span className="gradient-text">Add Material</span>
        </h2>
        <p className="text-gray-500 font-medium text-lg">Choose how you'd like to provide your study content.</p>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { id: 'paste', label: 'Paste Text', icon: <FileText size={20} />, activeClass: 'border-purple-500/50 bg-purple-500/10' },
          { id: 'file', label: 'Upload File', icon: <Upload size={20} />, activeClass: 'border-blue-500/50 bg-blue-500/10' },
          { id: 'drive', label: 'Google Drive', icon: <Cloud size={20} />, activeClass: 'border-cyan-500/50 bg-cyan-500/10' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id as UploadMode)}
            className={`p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-3 cursor-pointer group ${
              mode === item.id 
                ? `${item.activeClass} border-opacity-100` 
                : 'border-white/5 bg-white/[0.02] hover:border-white/10'
            }`}
          >
            <div className={`p-3 rounded-2xl transition-colors ${
              mode === item.id ? 'bg-white text-black' : 'bg-white/5 text-gray-400 group-hover:text-white'
            }`}>
              {item.icon}
            </div>
            <span className={`font-bold transition-colors ${
              mode === item.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px] relative">
        <AnimatePresence mode="wait">
          {mode === 'paste' && (
            <motion.div
              key="paste"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <textarea
                className="w-full h-96 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 text-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium leading-relaxed shadow-inner"
                placeholder="Paste your syllabus, lecture notes, textbook content, or study material here..."
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
              />
            </motion.div>
          )}

          {mode === 'file' && (
            <motion.div
              key="file"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={`w-full h-96 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-8 transition-all duration-300 ${
                dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/[0.02]'
              }`}>
                {selectedFile ? (
                   <div className="text-center animate-scale-up">
                      <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                         <CheckCircle2 size={40} />
                      </div>
                      <h3 className="text-2xl font-black mb-2">{selectedFile.name}</h3>
                      <p className="text-gray-500 mb-8 font-medium">Ready for AI parsing and quiz generation.</p>
                      <button 
                        onClick={() => setSelectedFile(null)}
                        className="text-sm font-bold text-gray-500 hover:text-white transition-colors"
                      >
                        Choose a different file
                      </button>
                   </div>
                ) : (
                   <div className="text-center">
                      <div className="w-20 h-20 bg-white/5 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                         <Upload size={32} />
                      </div>
                      <h3 className="text-2xl font-black mb-2 text-white/90">Drag & Drop Here</h3>
                      <p className="text-gray-500 mb-8 font-medium">Support for PDF, TXT, or DOCX files</p>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        accept=".txt,.pdf,.docx"
                        onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-3 bg-white text-black rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer"
                      >
                        Browse Files
                      </button>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {mode === 'drive' && (
            <motion.div
              key="drive"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full h-96 bg-white/[0.02] border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-24 h-24 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mb-8 border border-cyan-500/20">
                 <Cloud size={48} />
              </div>
              <h3 className="text-3xl font-black mb-4">Google Drive Integration</h3>
              <p className="text-gray-500 font-medium text-lg max-w-sm mb-10">
                Directly import your study folders and docs. This feature is coming in the next update!
              </p>
              <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                 Coming Next
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA Button */}
      <div className="mt-12">
        <button 
          onClick={() => onStart(selectedFile?.name || "Manual Upload")}
          disabled={isSaving || (mode === 'paste' && !content.trim()) || (mode === 'file' && !selectedFile) || mode === 'drive'}
          className={`btn-premium w-full py-7 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-purple-500/20 cursor-pointer transition-all ${
            isSaving || (mode === 'paste' && !content.trim()) || (mode === 'file' && !selectedFile) || mode === 'drive' 
              ? 'opacity-50 grayscale cursor-not-allowed' 
              : 'hover:scale-[1.01]'
          }`}
        >
          {isSaving ? 'Saving Study Material...' : ctaLabel}
        </button>
      </div>
    </div>
  );
};

export default UploadMaterial;
