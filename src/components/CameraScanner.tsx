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
        <div className="flex justify-between items-start">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center justify-center w-7 h-7 bg-white/10 backdrop-blur-xl rounded-xl border border-white/15 shadow-xl select-none"
            title={isScanning ? 'Vision active' : 'Vision paused'}
          >
            <div className="relative flex items-center justify-center w-2 h-2">
              {isScanning ? (
                <>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.95)] animate-pulse" />
                </>
              ) : (
                <>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.95)] animate-pulse" />
                </>
              )}
            </div>
          </motion.div>
          
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
          <div className="absolute inset-x-6 top-20 bottom-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-500/5 mb-2">
              <Camera size={28} className="text-red-400" />
            </div>
            <p className="text-white font-black text-xs uppercase tracking-[0.15em] leading-normal max-w-xs">{error}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider max-w-xs leading-relaxed">
              Hubungkan kamera atau berikan izin browser untuk menganalisis kepadatan polutan secara real-time.
            </p>
          </div>
        ) : !isScanning ? (
          <div className="absolute inset-x-6 top-20 bottom-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5 mb-2 animate-pulse">
              <Camera size={24} className="text-blue-400" />
            </div>
            <p className="text-white font-black text-[11px] uppercase tracking-[0.15em] leading-normal max-w-xs">Scanner Standby</p>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider max-w-xs leading-relaxed">
              Tekan tombol kamera biru di kanan atas untuk mengaktifkan analisa visual kepadatan polutan secara real-time.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
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
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                System: Processing Visual Data
              </p>
            </div>
          </div>
        )}

        {/* Scanning Line */}
        {isScanning && (
          <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-blue-500/25 to-transparent pointer-events-none animate-[scan_3.5s_linear_infinite]" style={{ top: 0 }} />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% {
            top: 0%;
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            transform: translateY(0%);
            opacity: 0;
          }
        }
      `}} />
    </div>
  );
}
