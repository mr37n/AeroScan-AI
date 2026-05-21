import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

// Highly robust helper function to capture camera stream with multi-level fallbacks
async function getRobustCameraStream(deviceId?: string): Promise<MediaStream> {
  const isSpecific = !!deviceId && deviceId !== '';

  if (isSpecific) {
    try {
      // 1. Try exact device selection at ideal high definition
      return await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    } catch (e1) {
      console.warn('Failed exact device ID constraint with 720p, trying exact device only:', e1);
      try {
        // 2. Try exact device ID selection with absolutely no other constraints
        return await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId }
          }
        });
      } catch (e2) {
        console.warn('Failed exact device ID only, trying ideal device ID with 720p:', e2);
        try {
          // 3. Try ideal device selection (less strict)
          return await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { ideal: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
        } catch (e3) {
          console.warn('Failed ideal device ID with 720p, trying ideal device only:', e3);
          try {
            // 4. Try ideal device with no constraints
            return await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { ideal: deviceId }
              }
            });
          } catch (e4) {
            console.warn('Failed all specific device constraints, falling back to general constraints.', e4);
          }
        }
      }
    }
  }

  // 5. Try standard environment/rear-facing camera constraints with 720p
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
  } catch (e5) {
    console.warn('Failed facingMode environment with 720p, trying ideal environment only:', e5);
    try {
      // 6. Try ideal environment with no resolution constraints
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        }
      });
    } catch (e6) {
      console.warn('Failed ideal environment only, trying ideal 720p resolution only:', e6);
      try {
        // 7. Try standard 720p resolution (no facingMode)
        return await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (e7) {
        console.warn('Failed 720p ideal, trying basic video request:', e7);
        try {
          // 8. Try basic video request (any available camera device)
          return await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (e8) {
          console.error('All camera request combinations failed:', e8);
          throw e8;
        }
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

  const startCamera = async (deviceIdx = currentDeviceIndex) => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Browser Anda tidak mendukung akses kamera.');
        return;
      }

      // Ensure that any previous tracks are Stopped before turning on a new camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Query available video inputs
      let videoIn = await getCameraDevices();
      
      // Determine if permissions were already granted (browsers only expose device labels after permission)
      const hasPermission = videoIn.length > 0 && videoIn.some(d => d.label !== "");
      
      let stream: MediaStream;

      if (!hasPermission || videoIn.length === 0) {
        // First-time load or permission not yet active: trigger the browser's generic permission dialog
        stream = await getRobustCameraStream();
        // Now that permission is granted, list and cache available cameras
        videoIn = await getCameraDevices();
      } else {
        // Permission is already active, choose targeted camera from the enumerated list
        const targetDevice = videoIn[deviceIdx % videoIn.length];
        setCurrentDeviceIndex(deviceIdx % videoIn.length);
        
        if (targetDevice && targetDevice.deviceId) {
          stream = await getRobustCameraStream(targetDevice.deviceId);
        } else {
          stream = await getRobustCameraStream();
        }
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

  const cycleCamera = async () => {
    if (devices.length <= 1) return;
    const nextIdx = (currentDeviceIndex + 1) % devices.length;
    stopCamera();
    // Allow small timeout for browser to release hardware safely
    setTimeout(() => {
      startCamera(nextIdx);
    }, 150);
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

      const now = Date.now();
      // Throttle: Process frame only every 200ms (5 FPS)
      // This reduces processing load by up to 90%, preventing browser hang, overheating,
      // and stuttering on mid-to-high class mobile devices/tablets.
      if (now - lastAnalysisTimeRef.current < 200) {
        animationFrameId = requestAnimationFrame(analyzeFrame);
        return;
      }

      if (ctx && video.readyState === 4) {
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
          console.error('Video frame analysis error:', err);
        }
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
            {/* Camera Cycle Trigger for Multi-Lens Mobile/Tablets */}
            {devices.length > 1 && (
              <button
                onClick={cycleCamera}
                className="p-2 gap-1.5 px-3 bg-indigo-500/20 backdrop-blur-xl rounded-xl border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-all active:scale-95 shadow-lg flex items-center justify-center"
                title="Ganti Lensa Kamera"
              >
                <RefreshCw size={13} className="text-indigo-400 transition-transform duration-300 active:rotate-180" />
                <span className="text-[9px] font-black tracking-wider uppercase">Ganti Kamera</span>
              </button>
            )}

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
