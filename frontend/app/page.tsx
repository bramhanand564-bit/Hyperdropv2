"use client";
import { useState, useRef } from 'react';
import { FileUp, FileDown, Zap, ArrowLeft, CheckCircle, Loader2, Send, Copy, Layers, Radio } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function Home() {
  const [mode, setMode] = useState<'home' | 'send' | 'receive'>('home');
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('0 MB/s');
  const [isTransferring, setIsTransferring] = useState(false);
  
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentFileNum, setCurrentFileNum] = useState(0);

  const peerInstance = useRef<any>(null);
  const connectionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileQueueRef = useRef<File[]>([]);
  const currentFileIndexRef = useRef(0);
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
    setTotalFiles(0);
    setCurrentFileNum(0);
  };

  // 🚀 SMART AUTO-PILOT CONFIGURATION
  // Ye dono connections (Local & Global) ko automatically manage karega
  const peerConfig = {
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    }
  };

  // --- SENDER LOGIC ---
  const startSending = async () => {
    setMode('send');
    setStatus('Activating Auto-Pilot Engine...');
    const { default: Peer } = await import('peerjs');
    
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const peer = new Peer(shortId, peerConfig);
    peerInstance.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus('Scan QR or share this 6-digit code');
    });

    peer.on('connection', (conn) => {
      connectionRef.current = conn;
      setStatus('Connected! Ready to blast files.');
      setIsConnected(true);
    });
  };

  const onFileSelect = (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0 || !connectionRef.current) return;
    
    fileQueueRef.current = files;
    currentFileIndexRef.current = 0;
    setTotalFiles(files.length);
    setIsTransferring(true);
    
    sendFileFromQueue();
  };

  const sendFileFromQueue = () => {
    const index = currentFileIndexRef.current;
    
    if (index >= fileQueueRef.current.length) {
      connectionRef.current.send(JSON.stringify({ type: 'all_done' }));
      setStatus(`All ${fileQueueRef.current.length} files sent ✅`);
      setIsTransferring(false);
      setProgress(100);
      setSpeed('Complete');
      return;
    }

    const file = fileQueueRef.current[index];
    setCurrentFileNum(index + 1);
    setStatus(`Sending: ${file.name}`);
    setProgress(0);
    setSpeed('Starting...');
    startTimeRef.current = Date.now();
    uiUpdateCounter.current = 0;

    connectionRef.current.send(JSON.stringify({ 
      type: 'header', 
      filename: file.name, 
      filetype: file.type, 
      filesize: file.size,
      fileIndex: index + 1,
      totalFiles: fileQueueRef.current.length
    }));

    setTimeout(() => sendChunksFast(file), 200);
  };

  // 🚀 MAX THROUGHPUT ENGINE (Auto-adapts to Network Speed)
  const sendChunksFast = async (file: File) => {
    const conn = connectionRef.current;
    let offset = 0;
    
    // 256KB chunk is the sweet spot for maximizing bandwidth without crashing Android WebView
    const CHUNK_SIZE = 256 * 1024; 
    const MAX_BUFFER = 16 * 1024 * 1024; // 16MB max pipe buffer

    while (offset < file.size) {
      if (!conn || !conn.open) break;

      // Agar network pipe full hai, toh 2ms ruko taaki connection tut na jaye
      if (conn.dataChannel && conn.dataChannel.bufferedAmount > MAX_BUFFER) {
        await new Promise(r => setTimeout(r, 2));
        continue;
      }

      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();
      
      conn.send(buffer);
      offset += buffer.byteLength;

      uiUpdateCounter.current++;
      // UI ko har 20 chunks ke baad update karo taaki CPU power file bhejne mein lage
      if (uiUpdateCounter.current % 20 === 0 || offset >= file.size) {
        setProgress(Math.round((offset / file.size) * 100));
        const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
        if (timeElapsed > 0.5) {
          const mbSent = offset / (1024 * 1024);
          setSpeed((mbSent / timeElapsed).toFixed(1) + ' MB/s');
        }
      }
    }

    conn.send(JSON.stringify({ type: 'file_done' }));
    currentFileIndexRef.current += 1;
    setTimeout(() => sendFileFromQueue(), 200); 
  };


  // --- RECEIVER LOGIC ---
  const startReceiving = async () => {
    setMode('receive');
    setStatus('Activating Auto-Pilot Engine...');
    const { default: Peer } = await import('peerjs');
    peerInstance.current = new Peer('', peerConfig); 
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
          setTotalFiles(parsed.totalFiles);
          setCurrentFileNum(parsed.fileIndex);
          setStatus(`Receiving: ${parsed.filename}`);
        } 
        else if (parsed.type === 'file_done') {
          saveNativeFile();
        }
        else if (parsed.type === 'all_done') {
          setIsTransferring(false);
          setStatus(`All files received successfully! ✅`);
          setProgress(100);
          setSpeed('Complete');
        }
      } else {
        incomingChunks.current.push(data);
        const chunkLength = data.byteLength || data.size || data.length;
        receivedBytes.current += chunkLength;
        
        uiUpdateCounter.current++;
        if (uiUpdateCounter.current % 20 === 0) {
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

    } catch (e) {
      console.log("Error saving file", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white selection:bg-blue-500/30">
      
      {mode !== 'home' && !isTransferring && (
        <button onClick={goHome} className="absolute top-6 left-6 p-3 bg-slate-800 rounded-full text-slate-300 hover:text-white shadow-lg transition-transform active:scale-90">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      
      {mode === 'home' && (
        <>
          <div className="mb-12">
            <div className="bg-blue-500/10 p-4 rounded-full inline-block mb-4 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
              <Zap className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              HyperDrop
            </h1>
            <p className="text-slate-400 font-medium tracking-wide">Pro P2P File Transfer</p>
          </div>

          <div className="w-full max-w-sm mb-10 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex items-start gap-4 text-left shadow-lg">
             <div className="bg-blue-500/20 p-2 rounded-lg shrink-0">
               <Radio className="w-6 h-6 text-blue-400" />
             </div>
             <div>
               <p className="text-sm font-bold text-white mb-1">Auto-Pilot Active</p>
               <p className="text-xs text-slate-400 leading-relaxed">
                 App automatically routes via Local WiFi or Global Internet for maximum possible speed.
               </p>
             </div>
          </div>

          <div className="flex flex-col w-full max-w-sm gap-4">
            <button onClick={startSending} className="flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-200 p-4 rounded-2xl font-black shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all active:scale-95">
              <FileUp className="w-6 h-6" /> Send Files
            </button>
            <button onClick={startReceiving} className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl font-bold transition-all active:scale-95">
              <FileDown className="w-6 h-6" /> Receive Files
            </button>
          </div>
        </>
      )}

      {mode === 'send' && (
        <div className="flex flex-col items-center w-full max-w-sm">
          {!isConnected ? (
            <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl w-full border border-slate-700/50 shadow-2xl mb-4 flex flex-col items-center">
              <h2 className="text-xl font-bold mb-6 text-slate-200">Share with Receiver</h2>
              
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
                {peerId ? (
                  <QRCode value={peerId} size={150} level="H" className="mx-auto" />
                ) : (
                  <div className="w-[150px] h-[150px] flex items-center justify-center bg-slate-100 rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 px-6 py-3 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => navigator.clipboard.writeText(peerId)}>
                <span className="text-4xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  {peerId || '------'}
                </span>
                <Copy className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-4">{status}</p>
            </div>
          ) : (
            <div className="bg-slate-800/80 p-6 rounded-3xl w-full border border-slate-700/50 shadow-2xl mb-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
              <p className="text-slate-200 font-bold text-lg mb-6">{status}</p>
              
              {(isTransferring || progress === 100) && (
                <div className="mb-6 w-full text-left">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                      File {currentFileNum} of {totalFiles}
                    </span>
                    <span className="text-sm font-mono font-bold text-yellow-400">{speed}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-2 font-mono text-slate-400 px-1 mt-3">
                    <span>Progress</span>
                    <span className="text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-700/50 shadow-inner">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              {!isTransferring && (
                <>
                  <input type="file" multiple ref={fileInputRef} onChange={onFileSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white text-slate-900 hover:bg-slate-200 p-4 rounded-xl font-black flex justify-center items-center gap-3 transition-all active:scale-95 shadow-lg shadow-white/10">
                    <Layers className="w-5 h-5" /> Select Multiple Files
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'receive' && (
        <div className="flex flex-col items-center w-full max-w-sm">
          {!isConnected ? (
            <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl w-full border border-slate-700/50 shadow-2xl">
              <div className="bg-slate-700/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileDown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-6 text-slate-200">Enter Sender's Code</h2>
              
              <input type="text" placeholder="------" value={remoteId} onChange={(e) => setRemoteId(e.target.value.toUpperCase())} maxLength={6} className="w-full bg-slate-900 border border-slate-600 text-center text-4xl font-black tracking-widest p-4 rounded-2xl mb-6 focus:outline-none focus:border-blue-500 uppercase placeholder:text-slate-700 transition-colors"/>
              
              <button onClick={connectToSender} disabled={remoteId.length < 6} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700/50 disabled:text-slate-500 text-white p-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                Connect Device
              </button>
              <p className="text-sm text-slate-400 mt-6">{status}</p>
            </div>
          ) : (
            <div className="bg-slate-800/80 p-6 rounded-3xl w-full border border-slate-700/50 shadow-2xl">
              
              {!isTransferring && progress !== 100 && (
                <div className="py-8">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <FileDown className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-slate-300 font-medium">Waiting for sender to select files...</p>
                </div>
              )}
              
              <p className="text-white font-bold text-lg mb-2">{status}</p>

              {(isTransferring || progress === 100) && (
                <div className="mt-6 w-full text-left">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
                      Receiving {currentFileNum} of {totalFiles}
                    </span>
                    <span className="text-sm font-mono font-bold text-yellow-400">{speed}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-2 font-mono text-slate-400 px-1 mt-3">
                    <span>Progress</span>
                    <span className="text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-700/50 shadow-inner">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
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
