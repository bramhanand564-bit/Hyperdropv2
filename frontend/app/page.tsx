import { FileUp, FileDown, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      
      {/* Logo & Header */}
      <div className="mb-12">
        <div className="bg-blue-500/10 p-4 rounded-full inline-block mb-4">
          <Zap className="w-12 h-12 text-blue-500" />
        </div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          HyperDrop
        </h1>
        <p className="text-slate-400">Lightning fast P2P file transfer</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col w-full max-w-sm gap-4">
        <button className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95">
          <FileUp className="w-6 h-6" />
          Send File
        </button>
        
        <button className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-4 rounded-2xl font-semibold transition-all active:scale-95">
          <FileDown className="w-6 h-6" />
          Receive File
        </button>
      </div>

    </div>
  );
}
