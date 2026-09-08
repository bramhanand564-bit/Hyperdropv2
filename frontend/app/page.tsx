"use client";
import { useState, useRef, useEffect } from 'react';
import { FileUp, FileDown, Zap, ArrowLeft, CheckCircle, Loader2, Send, Copy, Layers, XCircle, Clock, Smartphone, Image as ImageIcon, FileText, Video, History, Wifi, Globe, QrCode, PauseCircle, PlayCircle, FolderUp, ShieldCheck, Settings2, Trash2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Home() {
  const [mode, setMode] = useState<'home' | 'send' | 'receive' | 'nickname'>('nickname');
  const [networkType, setNetworkType] = useState<'local' | 'internet'>('local'); 
  const [myName, setMyName] = useState('');
  const [remoteName, setRemoteName] = useState('');
  const [autoAccept, setAutoAccept] = useState(false);
  const [fastMode, setFastMode] = useState(true); // Feature 40: Fast vs HD mode
  
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('0 MB/s');
  const [eta, setEta] = useState('--:--');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [totalDataMoved, setTotalDataMoved] = useState(0);
  
  // Feature 31-33: Queue Management & Previews
  const [selectedFiles, setSelectedFiles] = useState<{file: File, preview: string}[]>([]);
  const [currentFileNum, setCurrentFileNum] = useState(0);

  const peerInstance = useRef<any>(null);
  const connectionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const wakeLockRef = useRef<any>(null);

  const currentFileIndexRef = useRef(0);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0); 
  const isPausedRef = useRef(false); 
  
  const incomingFileInfo = useRef<any>(null);
  const incomingChunks = useRef<any[]>([]);
  const receivedBytes = useRef(0);
  const uiUpdateCounter = useRef(0);

  // --- WAKELOCK & UTILS ---
  const requestWakeLock = async () => {
    try { if ('wakeLock' in navigator) wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (err) {}
  };
  const releaseWakeLock = () => {
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
  };

  const triggerHapticsAndCelebration = () => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ['#3b82f6', '#a855f7', '#22c55e', '#eab308'] }); 
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateETA = (bytesReceived: number, totalBytes: number, elapsedSec: number) => { 
    if (bytesReceived === 0 || elapsedSec === 0) return '--:--';
    const bps = bytesReceived / elapsedSec;
    const remainingSec = Math.max(0, Math.round((totalBytes - bytesReceived) / bps));
    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const goHome = () => { 
    if (connectionRef.current) connectionRef.current.close();
    if (peerInstance.current) peerInstance.current.destroy();
    setMode('home'); setPeerId(''); setRemoteId(''); setStatus(''); setIsConnected(false);
    setProgress(0); setSpeed('0 MB/s'); setEta('--:--'); setIsTransferring(false);
    setSelectedFiles([]); setCurrentFileNum(0); setRemoteName(''); releaseWakeLock();
  };

  const cancelTransfer = () => { 
    if (connectionRef.current) connectionRef.current.send(JSON.stringify({ type: 'cancel' }));
    setIsTransferring(false); setStatus('Transfer Cancelled ❌'); releaseWakeLock();
  };

  const logHistory = (filename: string, size: number, type: 'Sent' | 'Received') => { 
    setTransferHistory(prev => [{ filename, size, type, time: new Date().toLocaleTimeString() }, ...prev]);
    setTotalDataMoved(prev => prev + size);
  };

  // --- QR SCANNER LOGIC (With Permission Handling) ---
  useEffect(() => {
    let scanner: any = null;
    if (showScanner) {
      setTimeout(() => {
        try {
          scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
          scanner.render((text: string) => {
            setRemoteId(text);
            setShowScanner(false);
            scanner.clear();
          }, (err: any) => {
             // Silently ignore normal scan errors
          });
        } catch (e) {
          setStatus("Camera permission denied. Please allow in Settings.");
          setShowScanner(false);
        }
      }, 200);
    }
    return () => { if (scanner) scanner.clear().catch(()=>console.log("Scanner cleared")); }
  }, [showScanner]);

  // 🚀 ENGINE CONFIG
  const peerConfig = { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } };

  // --- SENDER LOGIC ---
  const startSending = async () => {
    setMode('send'); setStatus('Activating Engine...');
    const { default: Peer } = await import('peerjs');
    const peer = new Peer(Math.random().toString(36).substring(2, 8).toUpperCase(), peerConfig);
    peerInstance.current = peer;
    peer.on('open', (id) => { setPeerId(id); setStatus('Share this 6-digit code or QR'); });
    peer.on('connection', (conn) => { connectionRef.current = conn; conn.on('data', handleSenderData); });
  };

  const handleSenderData = (data: any) => {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      if (parsed.type === 'hello') {
        setRemoteName(parsed.name); setStatus(`Connected to ${parsed.name}! Ready to send.`); setIsConnected(true);
      }
      if (parsed.type === 'accept') { 
        setStatus(`Sending: ${selectedFiles[currentFileIndexRef.current].file.name}`);
        setTimeout(() => sendChunksFast(selectedFiles[currentFileIndexRef.current].file), 200);
      }
      if (parsed.type === 'reject') { setStatus(`${remoteName} rejected the file ❌`); setIsTransferring(false); releaseWakeLock(); }
      if (parsed.type === 'cancel') { setStatus('Receiver cancelled the transfer ❌'); setIsTransferring(false); releaseWakeLock(); }
    }
  };

  // Feature 31 & 32: Queue & Thumbnail Engine
  const onFileSelect = (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;
    
    // Check Storage Overload (Feature 31)
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 4 * 1024 * 1024 * 1024) {
      alert("Warning: Total size exceeds 4GB. Make sure receiver has enough storage!");
    }

    const newFiles = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : ''
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFileFromQueue = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startSendingQueue = () => {
    if (selectedFiles.length === 0 || !connectionRef.current) return;
    currentFileIndexRef.current = 0;
    setIsTransferring(true); isPausedRef.current = false; setIsPaused(false); requestWakeLock();
    sendFileFromQueue();
  };

  const sendFileFromQueue = () => {
    const index = currentFileIndexRef.current;
    if (index >= selectedFiles.length) {
      connectionRef.current.send(JSON.stringify({ type: 'all_done' }));
      setStatus(`All files sent successfully! ✅`); setIsTransferring(false); setProgress(100); setSpeed('Complete'); setEta('00:00');
      setSelectedFiles([]); // Clear queue after success
      triggerHapticsAndCelebration(); releaseWakeLock(); return;
    }
    const file = selectedFiles[index].file;
    setCurrentFileNum(index + 1); setStatus(`Asking ${remoteName} to accept...`);
    setProgress(0); setSpeed('Waiting...'); setEta('--:--'); startTimeRef.current = Date.now(); uiUpdateCounter.current = 0; offsetRef.current = 0;

    connectionRef.current.send(JSON.stringify({ 
      type: 'request', filename: file.name, filetype: file.type, filesize: file.size, 
      fileIndex: index + 1, totalFiles: selectedFiles.length 
    }));
  };

  const togglePause = () => {
    isPausedRef.current = !isPausedRef.current;
    setIsPaused(isPausedRef.current);
    setStatus(isPausedRef.current ? 'Transfer Paused ⏸️' : `Sending: ${selectedFiles[currentFileIndexRef.current].file.name}`);
    if (connectionRef.current) connectionRef.current.send(JSON.stringify({ type: isPausedRef.current ? 'pause' : 'resume' }));
  };

  // 🚀 ADAPTIVE ENGINE (Fast vs Quality)
  const sendChunksFast = async (file: File) => {
    const conn = connectionRef.current;
    const CHUNK_SIZE = fastMode ? (128 * 1024) : (64 * 1024); // Feature 40: Variable Chunking
    const MAX_BUFFER = 2 * 1024 * 1024; 

    while (offsetRef.current < file.size && isTransferring) {
      if (isPausedRef.current) { await new Promise(r => setTimeout(r, 500)); continue; }
      if (!conn || !conn.open) break;

      if (conn.dataChannel && conn.dataChannel.bufferedAmount > MAX_BUFFER) {
        await new Promise(r => setTimeout(r, 5)); 
        continue;
      }

      const slice = file.slice(offsetRef.current, offsetRef.current + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();
      conn.send(buffer);
      offsetRef.current += buffer.byteLength;
      uiUpdateCounter.current++;
      
      if (uiUpdateCounter.current === 1 || uiUpdateCounter.current % 20 === 0 || offsetRef.current >= file.size) {
        setProgress(Math.round((offsetRef.current / file.size) * 100));
        const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
        if (timeElapsed > 0.2) {
          setSpeed((offsetRef.current / (1024 * 1024) / timeElapsed).toFixed(1) + ' MB/s');
          setEta(calculateETA(offsetRef.current, file.size, timeElapsed));
        }
      }
    }
    
    if (offsetRef.current >= file.size) {
      logHistory(file.name, file.size, 'Sent');
      conn.send(JSON.stringify({ type: 'file_done' }));
      currentFileIndexRef.current += 1;
      setTimeout(() => sendFileFromQueue(), 200); 
    }
  };

  // --- RECEIVER LOGIC ---
  const startReceiving = async () => {
    setMode('receive'); setStatus('Activating Engine...');
    const { default: Peer } = await import('peerjs');
    peerInstance.current = new Peer('', peerConfig); 
  };

  const connectToSender = () => {
    if (!remoteId) return;
    setStatus('Connecting to ' + remoteId + '...');
    const conn = peerInstance.current.connect(remoteId.toUpperCase());
    connectionRef.current = conn;

    conn.on('open', () => {
      conn.send(JSON.stringify({ type: 'hello', name: myName })); 
      setStatus('Connected! Waiting for files...'); setIsConnected(true);
    });
    conn.on('data', handleReceiverData);
  };

  const handleReceiverData = async (data: any) => {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      if (parsed.type === 'request') { 
        setIncomingRequest(parsed);
        if (autoAccept) setTimeout(() => acceptRequest(parsed), 500);
      } 
      else if (parsed.type === 'file_done') { saveNativeFile(); }
      else if (parsed.type === 'all_done') {
        setIsTransferring(false); setStatus(`All files received! ✅`);
        setProgress(100); setSpeed('Complete'); setEta('00:00');
        triggerHapticsAndCelebration(); releaseWakeLock();
      }
      else if (parsed.type === 'cancel') { setStatus('Sender cancelled the transfer ❌'); setIsTransferring(false); setIncomingRequest(null); releaseWakeLock(); }
      else if (parsed.type === 'pause') { setStatus('Paused by Sender ⏸️'); }
      else if (parsed.type === 'resume') { setStatus(`Receiving: ${incomingFileInfo.current?.filename}`); }
    } else {
      incomingChunks.current.push(data);
      receivedBytes.current += (data.byteLength || data.size || data.length);
      uiUpdateCounter.current++;
      
      if (uiUpdateCounter.current === 1 || uiUpdateCounter.current % 20 === 0) {
        const total = incomingFileInfo.current.filesize;
        setProgress(Math.round((receivedBytes.current / total) * 100));
        const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
        if (timeElapsed > 0.2) {
          setSpeed((receivedBytes.current / (1024 * 1024) / timeElapsed).toFixed(1) + ' MB/s');
          setEta(calculateETA(receivedBytes.current, total, timeElapsed));
        }
      }
    }
  };

  const acceptRequest = (requestData = incomingRequest) => {
    incomingFileInfo.current = requestData;
    incomingChunks.current = []; receivedBytes.current = 0; uiUpdateCounter.current = 0; startTimeRef.current = Date.now();
    setIsTransferring(true); setTotalFiles(requestData.totalFiles); setCurrentFileNum(requestData.fileIndex);
    setStatus(`Receiving: ${requestData.filename}`); setIncomingRequest(null); requestWakeLock();
    connectionRef.current.send(JSON.stringify({ type: 'accept' }));
  };

  const rejectRequest = () => {
    connectionRef.current.send(JSON.stringify({ type: 'reject' }));
    setIncomingRequest(null); setStatus('Transfer Rejected');
  };

  // Feature 35: Duplicate Auto-Rename & Native Save
  const saveNativeFile = () => {
    try {
      const fileType = incomingFileInfo.current.filetype;
      const originalName = incomingFileInfo.current.filename;
      // Append random string to prevent Android overwrite bugs
      const safeName = originalName.replace(/(\.[\w\d_-]+)$/i, `_HDrop${Math.floor(Math.random()*1000)}$1`);
      
      const blob = new Blob(incomingChunks.current, { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = safeName;
      
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 1000);
      
      logHistory(originalName, incomingFileInfo.current.filesize, 'Received');
    } catch (e) {}
  };

  if (mode === 'nickname') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
        <div className="bg-slate-800/80 p-8 rounded-3xl w-full max-w-sm border border-slate-700/50 shadow-2xl text-center animate-in fade-in zoom-in duration-500">
          <Smartphone className="w-16 h-16 text-blue-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h2 className="text-2xl font-bold mb-2">Device Name</h2>
          <p className="text-slate-400 text-sm mb-6">This name will be visible to receivers.</p>
          <input type="text" value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="e.g. Brahamanand's Phone" className="w-full bg-slate-900 border border-slate-600 text-center text-lg font-bold p-4 rounded-2xl mb-6 focus:outline-none focus:border-blue-500 transition-all" />
          <button onClick={() => setMode('home')} disabled={myName.trim().length < 2} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white p-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-blue-500/20">Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white selection:bg-blue-500/30 overflow-x-hidden relative">
      
      {showScanner && (
        <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2"><QrCode className="w-6 h-6"/> Scan QR Code</h3>
          <div id="reader" className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] border-4 border-slate-800"></div>
          <button onClick={() => setShowScanner(false)} className="mt-8 bg-slate-800 border border-slate-600 text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform">Cancel Scan</button>
        </div>
      )}

      {isTransferring && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-xl border border-slate-700/50 rounded-full px-6 py-2 flex items-center gap-4 shadow-2xl z-40 transition-all animate-in slide-in-from-top-10">
          <Loader2 className={`w-4 h-4 text-blue-400 ${isPaused ? '' : 'animate-spin'}`} />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold">{progress}% • {eta}</span>
            <span className="text-[10px] text-slate-400 w-32 truncate">{status}</span>
          </div>
          {mode === 'send' && (
            <button onClick={togglePause} className="bg-slate-700 p-1.5 rounded-full hover:bg-slate-600 transition-colors mr-1">
              {isPaused ? <PlayCircle className="w-4 h-4 text-green-400" /> : <PauseCircle className="w-4 h-4 text-yellow-400" />}
            </button>
          )}
          <button onClick={cancelTransfer} className="bg-red-500/20 p-1.5 rounded-full hover:bg-red-500/40 transition-colors">
            <XCircle className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {mode !== 'home' && !isTransferring && (
        <button onClick={goHome} className="absolute top-6 left-6 p-3 bg-slate-800 rounded-full text-slate-300 hover:text-white shadow-lg transition-transform active:scale-90 z-30">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      
      {mode === 'home' && (
        <>
          <div className="mb-8 w-full max-w-sm flex items-center justify-between animate-in slide-in-from-top-4 opacity-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-full"><Smartphone className="w-6 h-6 text-blue-400" /></div>
              <div className="text-left"><p className="text-xs text-slate-400">Current Device</p><p className="font-bold text-sm">{myName}</p></div>
            </div>
            <button onClick={() => setMode('nickname')} className="text-xs text-blue-400 underline hover:text-blue-300 transition-colors">Edit</button>
          </div>

          <div className="mb-6 animate-in zoom-in duration-500">
            <div className="bg-blue-500/10 p-4 rounded-full inline-block mb-4 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]"><Zap className="w-12 h-12 text-blue-500" /></div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2 tracking-tight">HyperDrop</h1>
          </div>

          <div className="w-full max-w-sm mb-6 flex flex-col gap-2 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-2"><ShieldCheck className={`w-5 h-5 ${autoAccept ? 'text-green-400' : 'text-slate-500'}`} /><span className="text-sm font-bold">Auto-Accept Files</span></div>
              <div onClick={() => setAutoAccept(!autoAccept)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${autoAccept ? 'bg-green-500' : 'bg-slate-600'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoAccept ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
            </div>
            <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-2"><Settings2 className={`w-5 h-5 ${fastMode ? 'text-blue-400' : 'text-purple-400'}`} /><span className="text-sm font-bold">{fastMode ? 'Ultra-Fast Mode' : 'Stable HD Mode'}</span></div>
              <div onClick={() => setFastMode(!fastMode)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${fastMode ? 'bg-blue-600' : 'bg-purple-600'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${fastMode ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
            </div>
          </div>

          <div className="flex flex-col w-full max-w-sm gap-4 mb-8">
            <button onClick={startSending} className="flex items-center justify-center gap-3 bg-white text-slate-900 p-4 rounded-2xl font-black shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] active:scale-95 transition-all group">
              <FileUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" /> Send Files
            </button>
            <button onClick={startReceiving} className="flex items-center justify-center gap-3 bg-slate-800 border border-slate-700 p-4 rounded-2xl font-bold active:scale-95 transition-all hover:bg-slate-700">
              <FileDown className="w-6 h-6" /> Receive Files
            </button>
          </div>

          <div className="w-full max-w-sm bg-slate-800/40 p-5 rounded-3xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-3">
              <div className="flex items-center gap-2"><History className="w-5 h-5 text-slate-400" /><span className="font-bold text-sm">Session History</span></div>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg font-bold">{formatBytes(totalDataMoved)}</span>
            </div>
            {transferHistory.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">No files transferred yet</p>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 text-left custom-scrollbar">
                {transferHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3 overflow-hidden">{getFileIcon(h.filename)}<div className="flex flex-col"><span className="text-xs font-bold truncate w-32">{h.filename}</span></div></div>
                    <div className="flex flex-col items-end"><span className={`text-[10px] font-bold ${h.type === 'Sent' ? 'text-blue-400' : 'text-green-400'}`}>{h.type}</span><span className="text-xs font-mono">{formatBytes(h.size)}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {mode === 'send' && (
        <div className="flex flex-col items-center w-full max-w-sm mt-10">
          {!isConnected ? (
            <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl w-full border border-slate-700/50 shadow-2xl flex flex-col items-center animate-in zoom-in-95">
              <h2 className="text-xl font-bold mb-6">Share with Receiver</h2>
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
                {peerId ? <QRCode value={peerId} size={150} level="H" /> : <Loader2 className="w-8 h-8 animate-spin text-slate-400 m-12" />}
              </div>
              <div className="bg-slate-900/50 px-6 py-3 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => navigator.clipboard.writeText(peerId)}>
                <span className="text-4xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">{peerId || '------'}</span>
                <Copy className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/80 p-6 rounded-3xl w-full border border-slate-700/50 shadow-2xl">
              <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-3 rounded-xl">
                <div className="flex items-center gap-3"><div className="relative"><div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div><div className="w-3 h-3 bg-green-500 rounded-full relative"></div></div><span className="text-sm font-bold truncate max-w-[100px]">{remoteName}</span></div>
                <button onClick={goHome} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg font-bold">Disconnect</button>
              </div>
              <p className="text-slate-200 font-bold text-lg mb-6">{status}</p>
              
              {(isTransferring || progress === 100) && (
                <div className="mb-6 w-full text-left">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">File {currentFileNum} of {selectedFiles.length}</span>
                    <div className="text-right flex flex-col items-end"><span className="text-sm font-mono font-bold text-yellow-400">{speed}</span></div>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden shadow-inner mt-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              {!isTransferring && (
                <>
                  {/* Feature 31: Advanced Thumbnail Queue */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-6 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 max-h-48 overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400">{selectedFiles.length} Files Selected</span>
                        <span className="text-xs font-bold text-blue-400">{formatBytes(selectedFiles.reduce((acc, f) => acc + f.file.size, 0))}</span>
                      </div>
                      <div className="space-y-2">
                        {selectedFiles.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-800 p-2 rounded-lg">
                            <div className="flex items-center gap-3 overflow-hidden">
                              {item.preview ? <img src={item.preview} className="w-8 h-8 object-cover rounded-md" /> : <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center"><FileText className="w-4 h-4 text-slate-400"/></div>}
                              <div className="flex flex-col text-left"><span className="text-xs font-bold truncate w-32">{item.file.name}</span><span className="text-[10px] text-slate-400">{formatBytes(item.file.size)}</span></div>
                            </div>
                            <button onClick={() => removeFileFromQueue(idx)} className="p-1 hover:bg-red-500/20 rounded-md text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mb-4">
                    <input type="file" multiple ref={fileInputRef} onChange={onFileSelect} className="hidden" />
                    <input type="file" multiple {...{webkitdirectory: "", directory: ""}} ref={folderInputRef} onChange={onFileSelect} className="hidden" />
                    
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2 active:scale-95 transition-all"><Layers className="w-4 h-4" /> Add Files</button>
                    <button onClick={() => folderInputRef.current?.click()} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2 active:scale-95 transition-all"><FolderUp className="w-4 h-4" /> Add Folder</button>
                  </div>

                  {selectedFiles.length > 0 && (
                    <button onClick={startSendingQueue} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black flex justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/30">
                      <Send className="w-5 h-5" /> Send {selectedFiles.length} Files Now
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'receive' && (
        <div className="flex flex-col items-center w-full max-w-sm mt-10">
          {!isConnected ? (
            <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl w-full border border-slate-700/50 shadow-2xl animate-in zoom-in-95">
              <h2 className="text-xl font-bold mb-6">Connect to Sender</h2>
              
              <button onClick={() => setShowScanner(true)} className="w-full mb-4 bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 text-blue-400 p-4 rounded-2xl font-bold flex justify-center items-center gap-3 transition-colors">
                <QrCode className="w-5 h-5" /> Scan QR Code
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-slate-700 flex-1"></div><span className="text-xs text-slate-500 font-bold uppercase">OR</span><div className="h-px bg-slate-700 flex-1"></div>
              </div>

              <input type="text" placeholder="------" value={remoteId} onChange={(e) => setRemoteId(e.target.value.toUpperCase())} maxLength={6} className="w-full bg-slate-900 border border-slate-600 text-center text-4xl font-black tracking-widest p-4 rounded-2xl mb-6 focus:outline-none focus:border-white uppercase"/>
              <button onClick={connectToSender} disabled={remoteId.length < 6} className="w-full bg-white text-slate-900 disabled:bg-slate-700 disabled:text-slate-500 p-4 rounded-2xl font-black active:scale-95 transition-all">Connect</button>
            </div>
          ) : (
            <div className="bg-slate-800/80 p-6 rounded-3xl w-full border border-slate-700/50 shadow-2xl">
              <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-3 rounded-xl">
                <div className="flex items-center gap-3"><div className="relative"><div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div><div className="w-3 h-3 bg-green-500 rounded-full relative"></div></div><span className="text-sm font-bold truncate max-w-[100px]">{remoteName || 'Sender'}</span></div>
                <button onClick={goHome} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg font-bold">Disconnect</button>
              </div>

              {incomingRequest && !autoAccept && (
                <div className="bg-slate-900 p-5 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] mb-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3 mb-4">{getFileIcon(incomingRequest.filetype)}<div className="text-left"><p className="font-bold text-sm truncate w-48">{incomingRequest.filename}</p><p className="text-xs text-slate-400">{formatBytes(incomingRequest.filesize)} • File {incomingRequest.fileIndex} of {incomingRequest.totalFiles}</p></div></div>
                  <div className="flex gap-3"><button onClick={() => acceptRequest()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold transition-colors">Accept</button><button onClick={rejectRequest} className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 rounded-xl font-bold transition-colors">Decline</button></div>
                </div>
              )}

              {!isTransferring && !incomingRequest && progress !== 100 && (
                <div className="py-12"><Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" /><p className="text-slate-300 font-medium">Waiting for {remoteName}...</p></div>
              )}

              {(isTransferring || progress === 100) && (
                <div className="mt-6 w-full text-left">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">File {currentFileNum} of {totalFiles}</span>
                    <div className="text-right flex flex-col items-end"><span className="text-sm font-mono font-bold text-yellow-400">{speed}</span></div>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden mt-2 border border-slate-700">
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
