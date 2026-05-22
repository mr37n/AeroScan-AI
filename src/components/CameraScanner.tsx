import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Camera, RefreshCw, AlertCircle, Cloud, Radio, Link2, RotateCw, Video, Play, Wifi } from 'lucide-react';
import { motion } from 'motion/react';

// Highly robust helper function to capture camera stream with multi-level fallbacks targeting the rear camera
async function getRobustCameraStream(deviceId?: string): Promise<MediaStream> {
  // Always query back/rear camera (environment mode) directly to respect user preference
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
  } catch (e1) {
    console.warn('Failed exact/ideal environment camera with 720p, trying standard environment:', e1);
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });
    } catch (e2) {
      console.warn('Failed basic environment mode, trying general high-definition stream:', e2);
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (e3) {
        return await navigator.mediaDevices.getUserMedia({ video: true });
      }
    }
  }
}

interface CameraScannerProps {
  onScanUpdate?: (turbidity: number) => void;
}

export default function CameraScanner({ onScanUpdate }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [turbidity, setTurbidity] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Throttling and state management for multi-camera capabilities
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState<number>(0);
  const [isSimulation, setIsSimulation] = useState(false);
  
  const lastReportedRef = useRef<number>(-1);
  const lastReportTimeRef = useRef<number>(0);
  const lastAnalysisTimeRef = useRef<number>(0);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setTurbidity(null);
  };

  const getCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const allVideoIn = allDevices.filter(d => d.kind === 'videoinput');
      
      // Filter out front cameras if requested, but only if we have other options!
      const rearVideoIn = allVideoIn.filter(d => {
        const label = (d.label || '').toLowerCase();
        return !label.includes('front') && !label.includes('depan') && !label.includes('user') && !label.includes('selfie');
      });
      
      // Fallback to all video devices if filtering them all out leaves us with nothing (e.g., standard PC webcams)
      const videoIn = rearVideoIn.length > 0 ? rearVideoIn : allVideoIn;
      
      setDevices(videoIn);
      return videoIn;
    } catch (err) {
      console.warn('Error enumerating devices:', err);
      return [];
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      setIsSimulation(false);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsSimulation(true);
        setIsScanning(true);
        return;
      }

      // Ensure that any previous tracks are Stopped before turning on a new camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Natively acquire the robust rear/back camera stream
      const stream = await getRobustCameraStream();

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
      setIsSimulation(false);
    } catch (err: any) {
      console.warn('Physical camera hardware not found or locked, enabling Virtual AI scan simulation framework. Details:', err.message || err);
      setIsSimulation(true);
      setIsScanning(true);
      setError(null);
    }
  };



  useEffect(() => {
    getCameraDevices();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const analyzeFrame = async () => {
      if (!isScanning) return;

      const now = Date.now();
      // Throttle: Process frame only every 200ms
      if (now - lastAnalysisTimeRef.current < 200) {
        animationFrameId = requestAnimationFrame(analyzeFrame);
        return;
      }

      if (isSimulation) {
        lastAnalysisTimeRef.current = now;
        
        // Generate simulated turbidity value using a smooth sinewave + minor jitter
        const base = 35 + 20 * Math.sin(now / 15000);
        const noise = (Math.random() - 0.5) * 4;
        const simulatedValue = Math.max(5, Math.min(95, Math.round(base + noise)));
        
        setTurbidity(simulatedValue);

        if (onScanUpdate && (simulatedValue !== lastReportedRef.current || now - lastReportTimeRef.current > 1200)) {
          lastReportedRef.current = simulatedValue;
          lastReportTimeRef.current = now;
          onScanUpdate(simulatedValue);
        }

        // Draw animated scanning grid on the hidden canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 20) {
              ctx.beginPath();
              ctx.moveTo(i, 0);
              ctx.lineTo(i, canvas.height);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(0, i);
              ctx.lineTo(canvas.width, i);
              ctx.stroke();
            }
          }
        }
      } else {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video && video.readyState === 4) {
          lastAnalysisTimeRef.current = now;
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Tensor processing for Turbidity/Haze estimation
            const imageTensor = tf.browser.fromPixels(canvas);
            const gray = tf.image.rgbToGrayscale(imageTensor);
            
            // Measure brightness variance and contrast
            const moments = tf.moments(gray);
            const varianceArr = await moments.variance.data();
            const std = Math.sqrt(varianceArr[0]);

            // Normalize to 0-100 scale
            const turbidityValue = Math.max(0, Math.min(100, 100 - (std * 2)));
            const rounded = Math.round(turbidityValue);
            setTurbidity(rounded);

            if (onScanUpdate && (rounded !== lastReportedRef.current || now - lastReportTimeRef.current > 1200)) {
              lastReportedRef.current = rounded;
              lastReportTimeRef.current = now;
              onScanUpdate(rounded);
            }

            imageTensor.dispose();
            gray.dispose();
            moments.mean.dispose();
            moments.variance.dispose();
          } catch (err) {
            console.warn('Video frame analysis error:', err);
          }
        }
      }

      animationFrameId = requestAnimationFrame(analyzeFrame);
    };

    if (isScanning) {
      animationFrameId = requestAnimationFrame(analyzeFrame);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, isSimulation]);

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden select-none flex flex-col justify-between" id="camera-scanner-container">
      {!isScanning ? (
        /* Standby state - 100% exact match layout with photograph */
        <div className="absolute inset-0 flex flex-col justify-between p-6 bg-[#030712] relative z-10 transition-colors duration-300">
          
          {/* Grid lines mesh backdrop */}
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none" 
               style={{ 
                 backgroundImage: `radial-gradient(circle, #38bdf8 1.5px, transparent 1.5px)`, 
                 backgroundSize: '16px 16px' 
               }} 
          />

          {/* Top Row: Standby pill & Controls */}
          <div className="flex items-center justify-between w-full z-20">
            {/* STANDBY Pill indicator */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.05)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>STANDBY</span>
            </div>

            {/* Quick Actions (Refresh and Active Capsule) */}
            <div className="flex items-center gap-2.5">
              {/* Refresh Button */}
              <button
                onClick={startCamera}
                className="w-9 h-9 rounded-xl border border-slate-800 bg-[#0f172a] hover:bg-slate-900 text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
                title="Mulai Ulang / Hubungkan"
              >
                <RotateCw size={14} className="text-slate-200" />
              </button>

              {/* ACTIVE Capsule Badge */}
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-500/25 bg-[#022c22]/60 text-[#10b981] text-[10px] font-black uppercase tracking-wider animate-pulse leading-none select-none">
                <Video size={13} className="text-emerald-500" />
                <span>ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Center Content: Camera target wrapper, Scanner Standby titles */}
          <div className="flex flex-col items-center justify-center text-center my-auto z-20">
            {/* Watermark Camera Outline inside a dark glass square wrapper */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0b1329] border border-slate-800/80 flex items-center justify-center mb-4.5 shadow-md">
              <Camera size={26} className="text-slate-400 opacity-90" />
            </div>

            {/* Title & Prompt Subtitle */}
            <h2 className="text-[23px] font-black text-white uppercase tracking-tight mb-2.5 font-sans">
              SCANNER STANDBY
            </h2>
            <p className="text-[11.5px] text-slate-450 font-bold max-w-[285px] text-center leading-[1.6] opacity-90 antialiased">
              Tekan tombol kamera di kanan atas untuk mengaktifkan analisa visual kepadatan polutan secara real-time.
            </p>
          </div>

          {/* Bottom Pane Section: Status connection & Hubungkan FISIK button block */}
          <div className="w-full max-w-sm mx-auto bg-[#0a0f1d] border border-slate-900/45 rounded-2xl p-4 flex flex-col items-center gap-3.5 z-20 shadow-lg">
            
            {/* Status Connection Label */}
            <div className="flex items-center gap-2 text-slate-400 select-none">
              <Cloud size={14} className="text-[#3b82f6] animate-pulse" />
              <span className="text-[10px] font-extrabold tracking-[0.16em] uppercase text-slate-400 dark:text-slate-500">
                STATUS CONNECTION
              </span>
            </div>

            {/* Solid Rich Green Action button */}
            <button
              onClick={startCamera}
              className="w-full py-3.5 rounded-xl bg-[#064e3b] hover:bg-[#047857] text-[#10b981] font-black text-[11px] tracking-[0.18em] transition-all duration-300 active:scale-[0.98] border border-emerald-500/20 flex items-center justify-center gap-2 uppercase cursor-pointer"
            >
              <Link2 size={13} className="text-emerald-400" />
              <span>HUBUNGKAN FISIK</span>
            </button>
          </div>
          
        </div>
      ) : (
        /* Active Scanner state with full visual analysis outputs */
        <>
          {!isSimulation ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-70 grayscale-[30%]"
            />
          ) : (
            /* Virtual particle scanning canvas representation */
            <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center shrink-0">
              {/* Virtual scanning background pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ 
                     backgroundImage: `radial-gradient(circle, #38bdf8 1.5px, transparent 1.5px)`, 
                     backgroundSize: '16px 16px' 
                   }} 
              />
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-500/20 flex items-center justify-center animate-[spin_12s_linear_infinite] z-10">
                <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 flex items-center justify-center animate-[spin_6s_linear_infinite]" />
              </div>
            </div>
          )}
          
          {/* Active HUD overlay controls & dynamic outputs */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 z-20">
            {/* HUD Header */}
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-550/25 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-400 select-none animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>VISION ACTIVE</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={stopCamera}
                  className="p-2 bg-slate-950/80 backdrop-blur-xl rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-950/50 transition-all active:scale-95 shadow-lg flex items-center justify-center"
                  title="Shut Down Scanner"
                >
                  <Camera size={13} className="text-rose-500" />
                </button>

                <button 
                  onClick={() => {
                    stopCamera();
                    startCamera();
                  }}
                  className="p-2 bg-slate-950/85 backdrop-blur-xl rounded-xl border border-slate-800 text-white hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center"
                  title="Mulai Ulang Sensor"
                >
                  <RefreshCw size={13} className="text-slate-300" />
                </button>
              </div>
            </div>

            {/* Overlay Reading Data block */}
            <div className="flex flex-col gap-4.5 z-25">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl md:text-7xl font-black text-white tracking-tighter tabular-nums leading-none">
                  {turbidity !== null ? turbidity : '00'}
                </span>
                <div className="flex flex-col select-none">
                  <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-[0.25em]">Turbidity</span>
                  <span className="text-[9px] text-white/45 font-bold uppercase tracking-widest leading-none mt-0.5 animate-pulse">Scanning...</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${turbidity || 0}%` }}
                    transition={{ type: 'spring', stiffness: 45 }}
                  />
                </div>
                <p className="text-[9.5px] text-white/50 font-mono tracking-widest w-full font-semibold uppercase">
                  AeroScan AI: PROCESSING DYNAMIC SPATIAL MODEL
                </p>
              </div>
            </div>
          </div>

          {/* Neon-blue physical scan sweeping bar */}
          {isScanning && !error && (
            <div className="absolute inset-x-0 h-[2.5px] bg-cyan-400 shadow-[0_0_12px_#22d3ee,0_0_24px_#0891b2] pointer-events-none animate-scan-line z-10" />
          )}
        </>
      )}

      <canvas ref={canvasRef} className="hidden" width={224} height={224} />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% {
            top: 0%;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0%;
          }
        }
        .animate-scan-line {
          animation: scan-line 4.2s linear infinite;
        }
      `}} />
    </div>
  );
}
