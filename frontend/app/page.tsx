"use client";
import { useState, useRef, useEffect } from 'react';
import { FileUp, FileDown, Zap, ArrowLeft, CheckCircle, Loader2, Send, Copy, Layers, Radio, XCircle, Clock, Smartphone, Image as ImageIcon, FileText, Video, History } from 'lucide-react';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';

export default function Home() {
  const [mode, setMode] = useState<'home' | 'send' | 'receive' | 'nickname'>('nickname');
  const [networkType, setNetworkType] = useState<'local' | 'internet'>('local'); 
  const [myName, setMyName] = useState('');
  const [remoteName, setRemoteName] = useState('');
  
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // 15-Feature States
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('0 MB/s');
  const [eta, setEta] = useState('--:--');
  const [isTransferring, setIsTransferring] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [totalDataMoved, setTotalDataMoved] = useState(0);
  
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentFileNum, setCurrentFileNum] = useState(0);

  const peerInstance = useRef<any>(null);
  const connectionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wakeLockRef = useRef<any>(null);

  const fileQueueRef = useRef<File[]>([]);
  const currentFileIndexRef = useRef(0);
  const startTimeRef = useRef(0);
  const incomingFileInfo = useRef<any>(null);
  const incomingChunks = useRef<any[]>([]);
  const receivedBytes = useRef(0);
  const uiUpdateCounter = useRef(0);

  // --- WAKELOCK & AUDIO (Features 6, 9) ---
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {}
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const triggerHapticsAndCelebration = () => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Feature 5: Haptics
    playSuccessSound(); // Feature 6: Audio
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3b82f6', '#a855f7', '#22c55e'] }); // Feature 7: Confetti
  };

  // --- UI HELPERS ---
  const getFileIcon = (type: string) => { // Feature 12: Smart Icons
    if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (type.includes('video')) return <Video className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateETA = (bytesReceived: number, totalBytes: number, elapsedSec: number) => { // Feature 2: ETA
    if (bytesReceived === 0 || elapsedSec === 0) return '--:--';
    const bps = bytesReceived / elapsedSec;
    const remainingBytes = totalBytes - bytesReceived;
    const remainingSec = Math.max(0, Math.round(remainingBytes / bps));
    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const goHome = () => { // Feature 13: 1-Click Disconnect
    if (connectionRef.current) connectionRef.current.close();
    if (peerInstance.current) peerInstance.current.destroy();
    setMode('home');
    setPeerId('');
    setRemoteId('');
    setStatus('');
    setIsConnected(false);
    setProgress(0);
    setSpeed('0 MB/s');
    setEta('--:--');
    setIsTransferring(false);
    setTotalFiles(0);
    setCurrentFileNum(0);
    setRemoteName('');
    releaseWakeLock();
  };

  const cancelTransfer = () => { // Feature 8: Cancel Transfer
    if (connectionRef.current) connectionRef.current.send(JSON.stringify({ type: 'cancel' }));
    setIsTransferring(false);
    setStatus('Transfer Cancelled ❌');
    releaseWakeLock();
  };

  const logHistory = (filename: string, size: number, type: 'Sent' | 'Received') => { // Feature 10 & 11: History
    setTransferHistory(prev => [{ filename, size, type, time: new Date().toLocaleTimeString() }, ...prev]);
    setTotalDataMoved(prev => prev + size);
  };

  // 🚀 ENGINE CONFIG
  const peerConfig = {
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
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
      setStatus('Share this 6-digit code');
    });

    peer.on('connection', (conn) => {
      connectionRef.current = conn;
      conn.on('data', handleSenderData);
    });
  };

  const handleSenderData = (data: any) => {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      if (parsed.type === 'hello') {
        setRemoteName(parsed.name);
        setStatus(`Connected to ${parsed.name}! Ready to send.`);
        setIsConnected(true);
      }
      if (parsed.type === 'accept') { // Feature 3: Accepted
        setStatus(`Sending: ${fileQueueRef.current[currentFileIndexRef.current].name}`);
        setTimeout(() => sendChunksFast(fileQueueRef.current[currentFileIndexRef.current]), 200);
      }
      if (parsed.type === 'reject') {
        setStatus(`${remoteName} rejected the file ❌`);
        setIsTransferring(false);
        releaseWakeLock();
      }
      if (parsed.type === 'cancel') {
        setStatus('Receiver cancelled the transfer ❌');
        setIsTransferring(false);
        releaseWakeLock();
      }
    }
  };

  const onFileSelect = (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0 || !connectionRef.current) return;
    
    fileQueueRef.current = files;
    currentFileIndexRef.current = 0;
    setTotalFiles(files.length);
    setIsTransferring(true);
    requestWakeLock();
    
    sendFileFromQueue();
  };

  const sendFileFromQueue = () => {
    const index = currentFileIndexRef.current;
    if (index >= fileQueueRef.current.length) {
      connectionRef.current.send(JSON.stringify({ type: 'all_done' }));
      setStatus(`All files sent successfully! ✅`);
      setIsTransferring(false);
      setProgress(100);
      setSpeed('Complete');
      setEta('00:00');
      triggerHapticsAndCelebration();
      releaseWakeLock();
      return;
    }

    const file = fileQueueRef.current[index];
    setCurrentFileNum(index + 1);
    setStatus(`Asking ${remoteName} to accept...`);
    setProgress(0);
    setSpeed('Waiting...');
    setEta('--:--');
    startTimeRef.current = Date.now();
    uiUpdateCounter.current = 0;

    // Ask permission to send (Feature 3)
    connectionRef.current.send(JSON.stringify({ 
      type: 'request', filename: file.name, filetype: file.type, filesize: file.size, 
      fileIndex: index + 1, totalFiles: fileQueueRef.current.length, network: networkType 
    }));
  };

  const sendChunksFast = async (file: File) => {
    const conn = connectionRef.current;
    let offset = 0;
    const CHUNK_SIZE = 256 * 1024; 
    const MAX_BUFFER = 16 * 1024 * 1024; 

    while (offset < file.size && isTransferring) {
      if (!conn || !conn.open) break;
      if (conn.dataChannel && conn.dataChannel.bufferedAmount > MAX_BUFFER) {
        await new Promise(r => setTimeout(r, 2));
        continue;
      }
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();
      conn.send(buffer);
      offset += buffer.byteLength;
      uiUpdateCounter.current++;
      
      if (uiUpdateCounter.current % 20 === 0 || offset >= file.size) {
        setProgress(Math.round((offset / file.size) * 100));
        const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
        if (timeElapsed > 0.5) {
          setSpeed((offset / (1024 * 1024) / timeElapsed).toFixed(1) + ' MB/s');
          setEta(calculateETA(offset, file.size, timeElapsed));
        }
      }
    }
    
    if (offset >= file.size) {
      logHistory(file.name, file.size, 'Sent');
      conn.send(JSON.stringify({ type: 'file_done' }));
      currentFileIndexRef.current += 1;
      setTimeout(() => sendFileFromQueue(), 200); 
    }
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
      conn.send(JSON.stringify({ type: 'hello', name: myName })); // Feature 4: Nicknames
      setStatus('Connected! Waiting for files...');
      setIsConnected(true);
    });

    conn.on('data', handleReceiverData);
  };

  const handleReceiverData = async (data: any) => {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'request') { // Feature 3: Accept Prompt
        setIncomingRequest(parsed);
      } 
      else if (parsed.type === 'file_done') {
        saveNativeFile();
      }
      else if (parsed.type === 'all_done') {
        setIsTransferring(false);
        setStatus(`All files received! ✅`);
        setProgress(100);
        setSpeed('Complete');
        setEta('00:00');
        triggerHapticsAndCelebration();
        releaseWakeLock();
      }
      else if (parsed.type === 'cancel') {
        setStatus('Sender cancelled the transfer ❌');
        setIsTransferring(false);
        setIncomingRequest(null);
        releaseWakeLock();
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
          setSpeed((receivedBytes.current / (1024 * 1024) / timeElapsed).toFixed(1) + ' MB/s');
          setEta(calculateETA(receivedBytes.current, total, timeElapsed));
        }
      }
    }
  };

  const acceptRequest = () => {
    incomingFileInfo.current = incomingRequest;
    incomingChunks.current = [];
    receivedBytes.current = 0;
    uiUpdateCounter.current = 0;
    startTimeRef.current = Date.now();
    
    setIsTransferring(true);
    setTotalFiles(incomingRequest.totalFiles);
    setCurrentFileNum(incomingRequest.fileIndex);
    setStatus(`Receiving: ${incomingRequest.filename}`);
    setIncomingRequest(null);
    requestWakeLock();
    
    connectionRef.current.send(JSON.stringify({ type: 'accept' }));
  };

  const rejectRequest = () => {
    connectionRef.current.send(JSON.stringify({ type: 'reject' }));
    setIncomingRequest(null);
    setStatus('Transfer Rejected');
  };

  const saveNativeFile = () => {
    try {
      const fileType = incomingFileInfo.current.filetype;
      const blob = new Blob(incomingChunks.current, { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = incomingFileInfo.current.filename;
      
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 1000);
      
      logHistory(incomingFileInfo.current.filename, incomingFileInfo.current.filesize, 'Received');
    } catch (e) {}
  };

  // --- INITIAL NICKNAME SCREEN ---
  if (mode === 'nickname') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
        <div className="bg-slate-800/80 p-8 rounded-3xl w-full max-w-sm border border-slate-700/50 shadow-2xl text-center">
          <Smartphone className="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Device Name</h2>
          <p className="text-slate-400 text-sm mb-6">This name will be visible to receivers.</p>
          <input 
            type="text" value={myName} onChange={(e) => setMyName(e.target.value)}
            placeholder="e.g. Brahamanand's Phone"
            className="w-full bg-slate-900 border border-slate-600 text-center text-lg font-bold p-4 rounded-2xl mb-6 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={() => setMode('home')} disabled={myName.trim().length < 2}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white p-4 rounded-2xl font-black transition-all active:scale-95"
          >Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white selection:bg-blue-500/30 overflow-x-hidden relative">
      
      {/* Feature 1: Dynamic Island Progress */}
      {isTransferring && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-slate-700/50 rounded-full px-6 py-2 flex items-center gap-4 shadow-2xl z-50 transition-all">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold">{progress}% • {eta}</span>
            <span className="text-[10px] text-slate-400 w-32 truncate">{status}</span>
          </div>
          <button onClick={cancelTransfer} className="bg-red-500/20 p-1.5 rounded-full hover:bg-red-500/40 transition-colors">
            <XCircle className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {mode !== 'home' && !isTransferring && (
        <button onClick={goHome} className="absolute top-6 left-6 p-3 bg-slate-800 rounded-full text-slate-300 hover:text-white shadow-lg transition-transform active:scale-90 z-40">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      
      {/* 1. Home Screen */}
      {mode === 'home' && (
        <>
          <div className="mb-10 w-full max-w-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-full"><Smartphone className="w-6 h-6 text-blue-400" /></div>
              <div className="text-left"><p className="text-xs text-slate-400">Current Device</p><p className="font-bold text-sm">{myName}</p></div>
            </div>
            <button onClick={() => setMode('nickname')} className="text-xs text-blue-400 underline">Edit</button>
          </div>

          <div className="mb-8">
            <div className="bg-blue-500/10 p-4 rounded-full inline-block mb-4 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
              <Zap className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">HyperDrop</h1>
          </div>

          <div className="flex bg-slate-800/80 backdrop-blur-sm p-1 rounded-2xl w-full max-w-sm mb-6 border border-slate-700/50">
            <button onClick={() => setNetworkType('local')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${networkType === 'local' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              <Wifi className="w-5 h-5" /> Local
            </button>
            <button onClick={() => setNetworkType('internet')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${networkType === 'internet' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
              <Globe className="w-5 h-5" /> Internet
            </button>
          </div>

          <div className="flex flex-col w-full max-w-sm gap-4 mb-8">
            <button onClick={startSending} className="flex items-center justify-center gap-3 bg-white text-slate-900 p-4 rounded-2xl font-black shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] active:scale-95 transition-all">
              <FileUp className="w-6 h-6" /> Send Files
            </button>
            <button onClick={startReceiving} className="flex items-center justify-center gap-3 bg-slate-800 border border-slate-700 p-4 rounded-2xl font-bold active:scale-95 transition-all">
              <FileDown className="w-6 h-6" /> Receive Files
            </button>
          </div>

          {/* Feature 10 & 11: Transfer History Dashboard */}
          <div className="w-full max-w-sm bg-slate-800/40 p-5 rounded-3xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-3">
              <div className="flex items-center gap-2"><History className="w-5 h-5 text-slate-400" /><span className="font-bold text-sm">Session History</span></div>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg font-bold">{formatBytes(totalDataMoved)} Moved</span>
            </div>
            {transferHistory.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">No files transferred yet</p>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar text-left">
                {transferHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {getFileIcon(h.filename)}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold truncate w-32">{h.filename}</span>
                        <span className="text-[10px] text-slate-400">{h.time}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-bold ${h.type === 'Sent' ? 'text-blue-400' : 'text-green-400'}`}>{h.type}</span>
                      <span className="text-xs font-mono">{formatBytes(h.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 2. Sender Screen */}
      {mode === 'send' && (
        <div className="flex flex-col items-center w-full max-w-sm mt-10">
          {!isConnected ? (
            <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl w-full border border-slate-700/50 shadow-2xl flex flex-col items-center">
              <h2 className="text-xl font-bold mb-6">Share with Receiver</h2>
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
                {peerId ? <QRCode value={peerId} size={150} level="H" /> : <Loader2 className="w-8 h-8 animate-spin text-slate-400 m-12" />}
              </div>
              <div className="bg-slate-900/50 px-6 py-3 rounded-xl flex items-center gap-4 cursor-pointer" onClick={() => navigator.clipboard.writeText(peerId)}>
                <span className="text-4xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">{peerId || '------'}</span>
                <Copy className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-4">{status}</p>
            </div>
          ) : (
            <div className="bg-slate-800/80 p-6 rounded-3xl w-full border border-slate-700/50 shadow-2xl">
              {/* Feature 14: Network Ping Visualizer */}
              <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="relative"><div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div><div className="w-3 h-3 bg-green-500 rounded-full relative"></div></div>
                  <span className="text-sm font-bold truncate max-w-[100px]">{remoteName}</span>
                </div>
                <button onClick={goHome} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg font-bold">Disconnect</button>
              </div>

              <p className="text-slate-200 font-bold text-lg mb-6">{status}</p>
              
              {(isTransferring || progress === 100) && (
                <div className="mb-6 w-full text-left">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">File {currentFileNum} of {totalFiles}</span>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm font-mono font-bold text-yellow-400">{speed}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {eta} left</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden shadow-inner mt-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              {!isTransferring && (
                <>
                  <input type="file" multiple ref={fileInputRef} onChange={onFileSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white text-slate-900 p-4 rounded-xl font-black flex justify-center gap-3 active:scale-95 transition-all">
                    <Layers className="w-5 h-5" /> Select Files
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Receiver Screen */}
      {mode === 'receive' && (
        <div className="flex flex-col items-center w-full max-w-sm mt-10">
          {!isConnected ? (
            <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl w-full border border-slate-700/50 shadow-2xl">
              <h2 className="text-xl font-bold mb-6">Enter Sender Code</h2>
              <input type="text" placeholder="------" value={remoteId} onChange={(e) => setRemoteId(e.target.value.toUpperCase())} maxLength={6} className="w-full bg-slate-900 border border-slate-600 text-center text-4xl font-black tracking-widest p-4 rounded-2xl mb-6 focus:outline-none focus:border-blue-500 uppercase"/>
              <button onClick={connectToSender} disabled={remoteId.length < 6} className="w-full bg-blue-600 text-white disabled:bg-slate-700 p-4 rounded-2xl font-black active:scale-95 transition-all">Connect</button>
              <p className="text-sm text-slate-400 mt-6">{status}</p>
            </div>
          ) : (
            <div className="bg-slate-800/80 p-6 rounded-3xl w-full border border-slate-700/50 shadow-2xl">
              
              <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="relative"><div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div><div className="w-3 h-3 bg-green-500 rounded-full relative"></div></div>
                  <span className="text-sm font-bold truncate max-w-[100px]">{remoteName || 'Sender'}</span>
                </div>
                <button onClick={goHome} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg font-bold">Disconnect</button>
              </div>

              {/* Feature 3: Incoming Request Prompt */}
              {incomingRequest && (
                <div className="bg-slate-900 p-5 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] mb-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 mb-4">
                    {getFileIcon(incomingRequest.filetype)}
                    <div className="text-left">
                      <p className="font-bold text-sm truncate w-48">{incomingRequest.filename}</p>
                      <p className="text-xs text-slate-400">{formatBytes(incomingRequest.filesize)} • File {incomingRequest.fileIndex} of {incomingRequest.totalFiles}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={acceptRequest} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold">Accept</button>
                    <button onClick={rejectRequest} className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-xl font-bold">Decline</button>
                  </div>
                </div>
              )}

              {!isTransferring && !incomingRequest && progress !== 100 && (
                <div className="py-8"><Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" /><p className="text-slate-300 font-medium">Waiting for sender...</p></div>
              )}

              {(isTransferring || progress === 100) && (
                <div className="mt-6 w-full text-left">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">File {currentFileNum} of {totalFiles}</span>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm font-mono font-bold text-yellow-400">{speed}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {eta} left</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden mt-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
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
