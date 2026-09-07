"use client";
import { useState, useRef } from 'react';
import { FileUp, FileDown, Zap, ArrowLeft, CheckCircle, Loader2, Send } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';

const CHUNK_SIZE = 256 * 1024; // 256 KB per chunk for fast transfer

export default function Home() {
  const [mode, setMode] = useState<'home' | 'send' | 'receive'>('home');
  const [peerId, setPeerId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Naye States: Progress aur Speed ke liye
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('0 MB/s');
  const [isTransferring, setIsTransferring] = useState(false);

  const peerInstance = useRef<any>(null);
  const connectionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chunking Variables (Background memory)
  const fileToSend = useRef<File | null>(null);
  const offsetRef = useRef(0);
  const startTimeRef = useRef(0);
  const incomingFileInfo = useRef<any>(null);
  const incomingChunks = useRef<ArrayBuffer[]>([]);
  const receivedBytes = useRef(0);

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

  // --- SENDER LOGIC ---
  const startSending = async () => {
    setMode('send');
    setStatus('Generating secure ID...');
    const { default: Peer } = await import('peerjs');
    
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

      // Sender jab Receiver ka 'ACK' (Acknowledge) sune
      conn.on('data', (data: any) => {
        if (data.type === 'ack') {
          sendNextChunk();
        }
      });
    });
  };

  const onFileSelect = (e: any) => {
    const file = e.target.files[0];
    if (!file || !connectionRef.current) return;
    
    fileToSend.current = file;
    offsetRef.current = 0;
    startTimeRef.current = Date.now();
    setIsTransferring(true);
    setProgress(0);
    setStatus(`Starting transfer: ${file.name}`);

    // Receiver ko pehle file ki detail (Header) bhejo
    connectionRef.current.send({ 
      type: 'header', 
      filename: file.name, 
      filetype: file.type, 
      filesize: file.size 
    });
  };

  const sendNextChunk = () => {
    if (!fileToSend.current || !connectionRef.current) return;

    const file = fileToSend.current;
    const offset = offsetRef.current;

    // Agar file poori chali gayi
    if (offset >= file.size) {
      connectionRef.current.send({ type: 'done' });
      setStatus(`Sent Successfully ✅`);
      setIsTransferring(false);
      setProgress(100);
      return;
    }

    // Naya tukda (chunk) kaato aur bhejo
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    slice.arrayBuffer().then((buffer) => {
      connectionRef.current.send({ type: 'chunk', data: buffer });
      
      // Speed aur Progress update karo
      offsetRef.current += buffer.byteLength;
      const currentProgress = Math.round((offsetRef.current / file.size) * 100);
      setProgress(currentProgress);

      const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
      const mbSent = offsetRef.current / (1024 * 1024);
      setSpeed((mbSent / timeElapsed).toFixed(1) + ' MB/s');
    });
  };

  // --- RECEIVER LOGIC ---
  const startReceiving = async () => {
    setMode('receive');
    setStatus('Ready to connect');
    const { default: Peer } = await import('peerjs');
    peerInstance.current = new Peer(); 
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
      if (data.type === 'header') {
        // File aana shuru
        incomingFileInfo.current = data;
        incomingChunks.current = [];
        receivedBytes.current = 0;
        startTimeRef.current = Date.now();
        setIsTransferring(true);
        setStatus(`Receiving: ${data.filename}`);
        conn.send({ type: 'ack' }); // Maango pehla tukda
      } 
      else if (data.type === 'chunk') {
        // Tukda receive hua
        incomingChunks.current.push(data.data);
        receivedBytes.current += data.data.byteLength;
        
        const total = incomingFileInfo.current.filesize;
        setProgress(Math.round((receivedBytes.current / total) * 100));
        
        const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
        const mbReceived = receivedBytes.current / (1024 * 1024);
        setSpeed((mbReceived / timeElapsed).toFixed(1) + ' MB/s');

        conn.send({ type: 'ack' }); // Maango agla tukda
      } 
      else if (data.type === 'done') {
        // Poori file aagayi, ab jod kar save karo
        setIsTransferring(false);
        setStatus(`Saving file to device...`);
        saveNativeFile();
      }
    });
  };

  // Asli Mobile Storage mein save karna
  const saveNativeFile = async () => {
    try {
      const blob = new Blob(incomingChunks.current, { type: incomingFileInfo.current.filetype });
      const filename = incomingFileInfo.current.filename;
      
      // Blob ko Base64 mein badalna padta hai Native Storage ke liye
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        // Capacitor Native Filesystem API
        await Filesystem.writeFile({
          path: `HyperDrop_${filename}`,
          data: base64data,
          directory: Directory.Documents
        });
        
        setStatus(`Saved to Documents folder! ✅`);
      };
    } catch (e) {
      // Agar computer par run kar rahe hain (Fallback)
      console.log("Native save failed, using browser download", e);
      const blob = new Blob(incomingChunks.current, { type: incomingFileInfo.current.filetype });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = incomingFileInfo.current.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      setStatus(`Download Complete ✅`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white">
      
      {/* Back Button */}
      {mode !== 'home' && !isTransferring && (
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
            <button onClick={startSending} className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 p-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95">
              <FileUp className="w-6 h-6" /> Send File
            </button>
            <button onClick={startReceiving} className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-2xl font-semibold transition-all active:scale-95">
              <FileDown className="w-6 h-6" /> Receive File
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
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-300 font-medium mb-6">{status}</p>
              
              {/* Progress UI */}
              {isTransferring && (
                <div className="mb-6 w-full">
                  <div className="flex justify-between text-sm mb-2 font-mono text-slate-400">
                    <span>{progress}%</span>
                    <span>{speed}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}

              {!isTransferring && (
                <>
                  <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 p-4 rounded-xl font-bold flex justify-center gap-2 transition-all active:scale-95">
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
              <input type="text" placeholder="Enter Code" value={remoteId} onChange={(e) => setRemoteId(e.target.value.toUpperCase())} maxLength={6} className="w-full bg-slate-900 border border-slate-700 text-center text-3xl font-black tracking-widest p-4 rounded-2xl mb-4 focus:outline-none focus:border-blue-500 uppercase"/>
              <button onClick={connectToSender} disabled={remoteId.length < 6} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white p-4 rounded-2xl font-bold transition-all active:scale-95">
                Connect
              </button>
              <p className="text-sm text-slate-400 mt-4">{status}</p>
            </div>
          ) : (
            <div className="bg-slate-800 p-6 rounded-2xl w-full border border-slate-700 shadow-xl">
              
              {!isTransferring && progress !== 100 && (
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              )}
              
              <p className="text-white font-semibold">{status}</p>

              {/* Progress UI */}
              {(isTransferring || progress === 100) && (
                <div className="mt-6 w-full">
                  <div className="flex justify-between text-sm mb-2 font-mono text-slate-400">
                    <span>{progress}%</span>
                    <span>{speed}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
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
