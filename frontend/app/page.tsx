"use client";
import { useState, useRef } from 'react';
import { FileUp, FileDown, Zap, ArrowLeft, CheckCircle, Loader2, Send } from 'lucide-react';

export default function Home() {
  const [mode, setMode] = useState<'home' | 'send' | 'receive'>('home');
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const peerInstance = useRef<any>(null);
  const connectionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Home screen par wapas aane ke liye
  const goHome = () => {
    if (connectionRef.current) connectionRef.current.close();
    if (peerInstance.current) peerInstance.current.destroy();
    setMode('home');
    setPeerId('');
    setRemoteId('');
    setStatus('');
    setIsConnected(false);
  };

  // Sender File Bhejne ka Setup
  const startSending = async () => {
    setMode('send');
    setStatus('Generating secure ID...');
    const { default: Peer } = await import('peerjs');
    
    // 6-digit ka unique code banayenge
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const peer = new Peer(shortId);
    peerInstance.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus('Waiting for receiver to connect...');
    });

    peer.on('connection', (conn) => {
      connectionRef.current = conn;
      setStatus('Connected! Ready to send files.');
      setIsConnected(true);
    });
  };

  // Receiver Setup
  const startReceiving = async () => {
    setMode('receive');
    setStatus('Ready to connect');
    const { default: Peer } = await import('peerjs');
    const peer = new Peer(); 
    peerInstance.current = peer;
  };

  // Receiver jab Sender se connect karta hai
  const connectToSender = () => {
    if (!remoteId) return;
    setStatus('Connecting to ' + remoteId + '...');
    const conn = peerInstance.current.connect(remoteId.toUpperCase());
    connectionRef.current = conn;

    conn.on('open', () => {
      setStatus('Connected! Waiting for files...');
      setIsConnected(true);
    });

    // Jab file receive hoti hai
    conn.on('data', (data: any) => {
      if (data.file && data.filename) {
        setStatus(`Received: ${data.filename}`);
        
        // File ko phone mein download karna
        const blob = new Blob([data.file]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  };

  // File select karke bhejna
  const sendFile = (e: any) => {
    const file = e.target.files[0];
    if (!file || !connectionRef.current) return;
    
    setStatus(`Sending ${file.name}...`);
    
    // File ko ArrayBuffer mein convert karke bhejna
    file.arrayBuffer().then((buffer: ArrayBuffer) => {
      connectionRef.current.send({
        file: buffer,
        filename: file.name,
        filetype: file.type
      });
      setStatus(`Sent: ${file.name} ✅`);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      
      {/* Back Button */}
      {mode !== 'home' && (
        <button onClick={goHome} className="absolute top-6 left-6 p-3 bg-slate-800 rounded-full text-slate-300 hover:text-white shadow-lg">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      
      {/* 1. Home Screen */}
      {mode === 'home' && (
        <>
          <div className="mb-12">
            <div className="bg-blue-500/10 p-4 rounded-full inline-block mb-4">
              <Zap className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              HyperDrop
            </h1>
            <p className="text-slate-400">Lightning fast P2P file transfer</p>
          </div>

          <div className="flex flex-col w-full max-w-sm gap-4">
            <button onClick={startSending} className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95">
              <FileUp className="w-6 h-6" />
              Send File
            </button>
            <button onClick={startReceiving} className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-4 rounded-2xl font-semibold transition-all active:scale-95">
              <FileDown className="w-6 h-6" />
              Receive File
            </button>
          </div>
        </>
      )}

      {/* 2. Sender Screen */}
      {mode === 'send' && (
        <div className="flex flex-col items-center w-full max-w-sm">
          <div className="bg-blue-500/10 p-4 rounded-full mb-4">
            <FileUp className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold mb-6">Send File</h2>
          
          {!isConnected ? (
            <div className="bg-slate-800 p-6 rounded-2xl w-full border border-slate-700 shadow-xl mb-4">
              <p className="text-slate-400 mb-2">Share this code with receiver:</p>
              <div className="text-5xl font-black text-white tracking-widest mb-4">
                {peerId || <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />}
              </div>
              <p className="text-sm text-blue-400 animate-pulse">{status}</p>
            </div>
          ) : (
            <div className="bg-slate-800 p-6 rounded-2xl w-full border border-slate-700 shadow-xl mb-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-400 font-semibold mb-6">{status}</p>
              
              <input type="file" ref={fileInputRef} onChange={sendFile} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold flex justify-center gap-2 transition-all active:scale-95">
                <Send className="w-5 h-5" />
                Select File to Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Receiver Screen */}
      {mode === 'receive' && (
        <div className="flex flex-col items-center w-full max-w-sm">
          <div className="bg-slate-800 p-4 rounded-full mb-4 border border-slate-700">
            <FileDown className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold mb-6">Receive File</h2>
          
          {!isConnected ? (
            <div className="w-full">
              <input type="text" placeholder="Enter Code" value={remoteId} onChange={(e) => setRemoteId(e.target.value.toUpperCase())} maxLength={6} className="w-full bg-slate-900 border border-slate-700 text-white text-center text-3xl font-black tracking-widest p-4 rounded-2xl mb-4 focus:outline-none focus:border-blue-500 uppercase"/>
              <button onClick={connectToSender} disabled={remoteId.length < 6} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white p-4 rounded-2xl font-bold transition-all active:scale-95">
                Connect
              </button>
              <p className="text-sm text-slate-400 mt-4">{status}</p>
            </div>
          ) : (
            <div className="bg-slate-800 p-6 rounded-2xl w-full border border-slate-700 shadow-xl">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold">{status}</p>
              <p className="text-slate-400 text-sm mt-2">Waiting for sender to choose a file...</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
