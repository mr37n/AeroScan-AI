import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';
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
    startCamera();

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
    <div className="w-full h-full relative bg-slate-950 overflow-hidden" id="camera-scanner-container">
      {!isSimulation ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-70 grayscale-[30%]"
        />
      ) : (
        /* High-fidelity virtual particle simulation background */
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 overflow-hidden pointer-events-none select-none">
          {/* Subtle grid backdrop */}
          <div className="absolute inset-0 opacity-[0.05]" 
               style={{ 
                 backgroundImage: `radial-gradient(circle, #38bdf8 1.5px, transparent 1.5px)`, 
                 backgroundSize: '18px 18px' 
               }} 
          />
          
          {/* Neon corner bracket targets */}
          <div className="absolute top-6 left-6 w-5 h-5 border-t border-l border-cyan-500/40" />
          <div className="absolute top-6 right-6 w-5 h-5 border-t border-r border-cyan-500/40" />
          <div className="absolute bottom-16 left-6 w-5 h-5 border-b border-l border-cyan-500/40" />
          <div className="absolute bottom-16 right-6 w-5 h-5 border-b border-r border-cyan-500/40" />

          {/* Central radar overlay */}
          <div className="relative w-48 h-48 rounded-full border border-dashed border-cyan-500/10 flex items-center justify-center animate-[spin_30s_linear_infinite]">
            <div className="absolute w-40 h-40 rounded-full border border-dashed border-cyan-500/5" />
            <div className="absolute w-32 h-32 rounded-full border border-cyan-500/20" />
            <div className="absolute w-16 h-16 rounded-full border border-cyan-500/30" />
          </div>

          {/* Scanning lines */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
            <div className="w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/30 via-transparent to-transparent rounded-full animate-[spin_8s_linear_infinite]" />
          </div>
          
          {/* Flowing particle elements representing air-visibility tracking particles */}
          <div className="absolute inset-x-8 bottom-24 top-16 flex flex-wrap gap-8 items-center justify-center opacity-30">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" 
                style={{ animationDelay: `${i * 0.3}s`, transform: `translateY(${Math.sin(i) * 12}px)` }} 
              />
            ))}
          </div>

          <div className="absolute bottom-16 bg-cyan-500/10 border border-cyan-500/25 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg max-w-[90%] pointer-events-auto z-20">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-450 animate-ping shrink-0" />
            <span className="text-[8px] font-mono font-bold text-cyan-300 tracking-wider">
              SENSOR VIRTUAL AKTIF (KAMERA TIDAK TERDETEKSI)
            </span>
            <button 
              onClick={() => {
                setIsSimulation(false);
                setError(null);
                startCamera();
              }}
              className="ml-1 px-1.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-700 text-[7.5px] font-black text-white tracking-widest transition active:scale-95 uppercase select-none cursor-pointer"
              title="Coba hubungkan perangkat keras kamera fisik Anda"
            >
              Hubungkan Fisik
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" width={224} height={224} />
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40">
        <div className="flex justify-between items-center w-full z-15">
          {isScanning ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-xl rounded-xl border border-rose-500/20 text-[9px] font-black uppercase tracking-widest text-rose-400 shadow-xl select-none animate-pulse-fast">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.85)]"></span>
              </span>
              <span>VISION ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-xl rounded-xl border border-amber-500/20 text-[9px] font-black uppercase tracking-widest text-amber-500 shadow-xl select-none">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.85)]"></span>
              </span>
              <span>STANDBY</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">


            {isScanning ? (
              <button
                onClick={stopCamera}
                className="p-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/15 text-white hover:bg-white/25 transition-all active:scale-95 shadow-lg flex items-center justify-center"
                title="Stop Scanning"
              >
                <Camera size={13} className="text-red-500 fill-red-500/20" />
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="p-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/15 text-white hover:bg-white/25 transition-all active:scale-95 shadow-lg flex items-center justify-center"
                title="Start Scanning"
              >
                <Camera size={13} className="text-blue-400 fill-blue-500/20" />
              </button>
            )}

            <button 
              onClick={() => {
                stopCamera();
                startCamera();
              }}
              className="p-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 text-white hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center"
              title="Mulai Ulang Kamera"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-4 bg-slate-950/80 backdrop-blur-sm z-10">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-500/5 mb-1">
              <Camera size={28} className="text-red-400" />
            </div>
            <p className="text-white font-black text-xs uppercase tracking-[0.15em] leading-normal max-w-xs">{error}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider max-w-xs leading-relaxed">
              Hubungkan kamera atau berikan izin browser untuk menganalisis kepadatan polutan secara real-time.
            </p>
          </div>
        ) : !isScanning ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-4 bg-slate-950/85 backdrop-blur-sm z-10">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5 mb-1 animate-pulse">
              <Camera size={24} className="text-blue-400" />
            </div>
            <p className="text-white font-black text-[11px] uppercase tracking-[0.15em] leading-normal max-w-xs">Scanner Standby</p>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider max-w-xs leading-relaxed">
              Tekan tombol kamera biru di kanan atas untuk mengaktifkan analisa visual kepadatan polutan secara real-time.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-white tracking-tighter tabular-nums leading-none">
                {turbidity !== null ? turbidity : '--'}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em]">Turbidity</span>
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest leading-none">Scanning...</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${turbidity || 0}%` }}
                  transition={{ type: 'spring', stiffness: 40 }}
                />
              </div>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest w-full">
                System: Processing Visual Data
              </p>
            </div>
          </div>
        )}

        {/* Neon-blue horizontal scanning line */}
        {isScanning && !error && (
          <div className="absolute inset-x-0 h-[2.5px] bg-cyan-400 shadow-[0_0_12px_#22d3ee,0_0_24px_#0891b2] pointer-events-none animate-scan-line" />
        )}
      </div>

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
          animation: scan-line 4s linear infinite;
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </div>
  );
}
