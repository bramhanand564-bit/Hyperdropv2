"use client";
import { useState, useRef } from 'react';
import { FileUp, FileDown, Zap, ArrowLeft, CheckCircle, Loader2, Send, Wifi, Globe } from 'lucide-react';

export default function Home() {
  const [mode, setMode] = useState<'home' | 'send' | 'receive'>('home');
  // Naya Option: Local ya Internet
  const [networkType, setNetworkType] = useState<'local' | 'internet'>('local'); 
  
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('0 MB/s');
  const [isTransferring, setIsTransferring] = useState(false);

  const peerInstance = useRef<any>(null);
  const connectionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background memory for hyper-speed
  const fileToSend = useRef<File | null>(null);
  const startTimeRef = useRef(0);
  const incomingFileInfo = useRef<any>(null);
  const incomingChunks = useRef<any[]>([]);
  const receivedBytes = useRef(0);
  const uiUpdateCounter = useRef(0);

  const goHome = () => {
    if (connectionRef.current) connectionRef.current.close();
    if (peerInstance.current) peerInstance.current.destroy();
    setMode('home');
    setPeerId('');
    setRemoteId('');
    setStatus('');
    setIsConnected(false);
    setProgress(0);
    setSpeed('0 MB/s');
    setIsTransferring(false);
  };

  // 🚀 ICE Server Configuration (Speed Booster)
  const getPeerConfig = () => {
    if (networkType === 'internet') {
      // Internet Mode: Use Google's High-Speed STUN Servers to punch through firewalls
      return {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      };
    } else {
      // Local Mode: Force direct LAN/Hotspot connection (No STUN needed)
      return {
        config: {
          iceServers: [] 
        }
      };
    }
  };

  // --- SENDER LOGIC ---
  const startSending = async () => {
    setMode('send');
    setStatus(networkType === 'local' ? 'Connecting to Local Network...' : 'Connecting to Internet Servers...');
    const { default: Peer } = await import('peerjs');
    
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const peer = new Peer(shortId, getPeerConfig());
    peerInstance.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus(networkType === 'local' ? 'Connect to same WiFi & share code' : 'Share this code with receiver');
    });

    peer.on('connection', (conn) => {
      connectionRef.current = conn;
      setStatus('Connected! Ready to blast files.');
      setIsConnected(true);
    });
  };

  // ULTRA-SPEED Engine (Raw Binary Transfer)
  const sendChunksFast = async (file: File) => {
    const conn = connectionRef.current;
    let offset = 0;
    const CHUNK_SIZE = 256 * 1024; // 256KB
    const MAX_BUFFER = 16 * 1024 * 1024; // 16MB

    while (offset < file.size) {
      if (!conn || !conn.open) break;

      if (conn.dataChannel && conn.dataChannel.bufferedAmount > MAX_BUFFER) {
        await new Promise(r => setTimeout(r, 10));
        continue;
      }

      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();
      
      conn.send(buffer);
      offset += buffer.byteLength;

      uiUpdateCounter.current++;
      if (uiUpdateCounter.current % 10 === 0 || offset >= file.size) {
        setProgress(Math.round((offset / file.size) * 100));
        const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
        if (timeElapsed > 0.5) {
          const mbSent = offset / (1024 * 1024);
          setSpeed((mbSent / timeElapsed).toFixed(1) + ' MB/s');
        }
      }
    }

    conn.send(JSON.stringify({ type: 'done' }));
    setStatus(`Sent Successfully ✅`);
    setIsTransferring(false);
    setProgress(100);
  };

  const onFileSelect = (e: any) => {
    const file = e.target.files[0];
    if (!file || !connectionRef.current) return;
    
    fileToSend.current = file;
    setIsTransferring(true);
    setProgress(0);
    setStatus(`Sending at max speed...`);
    startTimeRef.current = Date.now();
    uiUpdateCounter.current = 0;

    connectionRef.current.send(JSON.stringify({ 
      type: 'header', 
      filename: file.name, 
      filetype: file.type, 
      filesize: file.size 
    }));

    setTimeout(() => sendChunksFast(file), 200);
  };

  // --- RECEIVER LOGIC ---
  const startReceiving = async () => {
    setMode('receive');
    setStatus('Ready to connect');
    const { default: Peer } = await import('peerjs');
    peerInstance.current = new Peer('', getPeerConfig()); 
  };

  const connectToSender = () => {
    if (!remoteId) return;
    setStatus('Connecting to ' + remoteId + '...');
    const conn = peerInstance.current.connect(remoteId.toUpperCase());
    connectionRef.current = conn;

    conn.on('open', () => {
      setStatus('Connected! Waiting for files...');
      setIsConnected(true);
    });

    conn.on('data', async (data: any) => {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        if (parsed.type === 'header') {
          incomingFileInfo.current = parsed;
          incomingChunks.current = [];
          receivedBytes.current = 0;
          uiUpdateCounter.current = 0;
          startTimeRef.current = Date.now();
          setIsTransferring(true);
          setStatus(`Receiving: ${parsed.filename}`);
        } else if (parsed.type === 'done') {
          setIsTransferring(false);
          setStatus(`Saving file...`);
          saveNativeFile();
        }
      } else {
        incomingChunks.current.push(data);
        const chunkLength = data.byteLength || data.size || data.length;
        receivedBytes.current += chunkLength;
        
        uiUpdateCounter.current++;
        if (uiUpdateCounter.current % 10 === 0) {
          const total = incomingFileInfo.current.filesize;
          setProgress(Math.round((receivedBytes.current / total) * 100));
          
          const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
          if (timeElapsed > 0.5) {
            const mbReceived = receivedBytes.current / (1024 * 1024);
            setSpeed((mbReceived / timeElapsed).toFixed(1) + ' MB/s');
          }
        }
      }
    });
  };

  const saveNativeFile = () => {
    try {
      const blob = new Blob(incomingChunks.current, { type: incomingFileInfo.current.filetype });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = incomingFileInfo.current.filename;
      
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 1000);

      setStatus(`File saved to Downloads! ✅`);
      setProgress(100);
      setSpeed('Complete');
    } catch (e) {
      console.log("Error saving file", e);
      setStatus("Error saving file.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white">
      
      {mode !== 'home' && !isTransferring && (
        <button onClick={goHome} className="absolute top-6 left-6 p-3 bg-slate-800 rounded-full text-slate-300 hover:text-white shadow-lg transition-transform active:scale-90">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      
      {/* 1. Home Screen */}
      {mode === 'home' && (
        <>
          <div className="mb-8">
            <div className="bg-blue-500/10 p-4 rounded-full inline-block mb-4">
              <Zap className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              HyperDrop
            </h1>
            <p className="text-slate-400 font-medium">Choose Transfer Mode</p>
          </div>

          {/* Network Selection Toggle (Apple Style Segmented Control) */}
          <div className="flex bg-slate-800 p-1 rounded-2xl w-full max-w-sm mb-8 border border-slate-700">
            <button 
              onClick={() => setNetworkType('local')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${networkType === 'local' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Wifi className="w-5 h-5" /> Local
            </button>
            <button 
              onClick={() => setNetworkType('internet')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${networkType === 'internet' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Globe className="w-5 h-5" /> Internet
            </button>
          </div>

          <div className="flex flex-col w-full max-w-sm gap-4">
            <button onClick={startSending} className="flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-200 p-4 rounded-2xl font-black shadow-lg shadow-white/10 transition-all active:scale-95">
              <FileUp className="w-6 h-6" /> Send File
            </button>
            <button onClick={startReceiving} className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl font-bold transition-all active:scale-95">
              <FileDown className="w-6 h-6" /> Receive File
            </button>
          </div>
          
          <p className="mt-8 text-xs text-slate-500 max-w-xs">
            {networkType === 'local' 
              ? 'Local Mode: Both devices must be on the same WiFi or Hotspot. No data limits, ultra-fast speeds.' 
              : 'Internet Mode: Use anywhere in the world. Requires mobile data or active internet.'}
          </p>
        </>
      )}

      {/* 2. Sender Screen */}
      {mode === 'send' && (
        <div className="flex flex-col items-center w-full max-w-sm">
          <div className={`p-4 rounded-full mb-4 ${networkType === 'local' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
            {networkType === 'local' ? <Wifi className="w-10 h-10" /> : <Globe className="w-10 h-10" />}
          </div>
          <h2 className="text-2xl font-bold mb-6">Send File ({networkType === 'local' ? 'Local' : 'Net'})</h2>
          
          {!isConnected ? (
            <div className="bg-slate-800 p-6 rounded-2xl w-full border border-slate-700 shadow-xl mb-4">
              <p className="text-slate-400 mb-2">Share this code with receiver:</p>
              <div className="text-5xl font-black text-white tracking-widest mb-4">
                {peerId || <Loader2 className={`w-8 h-8 animate-spin mx-auto ${networkType === 'local' ? 'text-blue-500' : 'text-purple-500'}`} />}
              </div>
              <p className="text-sm text-slate-400 animate-pulse">{status}</p>
            </div>
          ) : (
            <div className="bg-slate-800 p-6 rounded-2xl w-full border border-slate-700 shadow-xl mb-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-300 font-medium mb-6">{status}</p>
              
              {(isTransferring || progress === 100) && (
                <div className="mb-6 w-full">
                  <div className="flex justify-between text-sm mb-2 font-mono font-bold text-white">
                    <span className="text-green-400">{progress}%</span>
                    <span className="text-yellow-400">{speed}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                    <div className="bg-gradient-to-r from-green-500 to-yellow-500 h-3 rounded-full transition-all duration-150" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              {!isTransferring && (
                <>
                  <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white text-slate-900 hover:bg-slate-200 p-4 rounded-xl font-black flex justify-center gap-2 transition-all active:scale-95">
                    <Send className="w-5 h-5" /> Select File to Send
                  </button>
                </>
              )}
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
              <input type="text" placeholder="Enter Code" value={remoteId} onChange={(e) => setRemoteId(e.target.value.toUpperCase())} maxLength={6} className="w-full bg-slate-900 border border-slate-700 text-center text-3xl font-black tracking-widest p-4 rounded-2xl mb-4 focus:outline-none focus:border-white uppercase"/>
              <button onClick={connectToSender} disabled={remoteId.length < 6} className="w-full bg-white text-slate-900 hover:bg-slate-200 disabled:bg-slate-700 disabled:text-slate-500 p-4 rounded-2xl font-black transition-all active:scale-95">
                Connect
              </button>
              <p className="text-sm text-slate-400 mt-4">{status}</p>
            </div>
          ) : (
            <div className="bg-slate-800 p-6 rounded-2xl w-full border border-slate-700 shadow-xl">
              
              {!isTransferring && progress !== 100 && (
                <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
              )}
              
              <p className="text-white font-semibold">{status}</p>

              {(isTransferring || progress === 100) && (
                <div className="mt-6 w-full">
                  <div className="flex justify-between text-sm mb-2 font-mono font-bold text-white">
                    <span className="text-green-400">{progress}%</span>
                    <span className="text-yellow-400">{speed}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                    <div className="bg-gradient-to-r from-green-500 to-yellow-500 h-3 rounded-full transition-all duration-150" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
