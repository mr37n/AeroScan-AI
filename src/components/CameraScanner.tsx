import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [turbidity, setTurbidity] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const startCamera = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Browser Anda tidak mendukung akses kamera.');
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput');

      if (!hasVideoDevice) {
        setError('Tidak ada kamera yang terdeteksi pada perangkat ini.');
        return;
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1285 },
          height: { ideal: 725 }
        }
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('Failed to get constrained camera, falling back to basic video:', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Mohon aktifkan izin kamera di pengaturan browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Kamera tidak ditemukan pada perangkat Anda.');
      } else {
        setError(`Gagal mengakses kamera: ${err.message || 'Error tidak diketahui'}`);
      }
      console.error('Camera access error:', err);
      setIsScanning(false);
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
      if (!isScanning || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState === 4) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Tensor processing for Turbidity/Haze estimation
        // Real logic: Measure brightness variance and contrast
        const imageTensor = tf.browser.fromPixels(canvas);
        const gray = tf.image.rgbToGrayscale(imageTensor);
        
        // Simple heuristic: Standard deviation of pixel values correlates with visibility
        const moments = tf.moments(gray);
        const std = Math.sqrt((await moments.variance.data())[0]);
        const mean = (await moments.mean.data())[0];

        // Normalize to a 0-100 scale (example heuristic)
        // High std = clear/high contrast, Low std = hazy/foggy
        const turbidityValue = Math.max(0, Math.min(100, 100 - (std * 2)));
        setTurbidity(Math.round(turbidityValue));

        imageTensor.dispose();
        gray.dispose();
        moments.mean.dispose();
        moments.variance.dispose();
      }

      animationFrameId = requestAnimationFrame(analyzeFrame);
    };

    if (isScanning) {
      analyzeFrame();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning]);

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden" id="camera-scanner-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-70 grayscale-[30%]"
      />
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
