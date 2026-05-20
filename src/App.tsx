/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  ShieldCheck, 
  Activity, 
  CloudSun, 
  Map as MapIcon, 
  MapPin,
  Settings, 
  X, 
  Sliders, 
  Check,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import CameraScanner from './components/CameraScanner';
import DashboardMap from './components/DashboardMap';
import PollutionChart from './components/PollutionChart';
import WeatherForecast from './components/WeatherForecast';
import ReportGenerator from './components/ReportGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'health-hub'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showGridLines, setShowGridLines] = useState(true);
  const [denseMapData, setDenseMapData] = useState(false);
  const [saveLocalHistory, setSaveLocalHistory] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Real-time device coordinate geocoding status values
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userCity, setUserCity] = useState<string>('Jakarta');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Dynamic Real-time sensor readings state (updating automatically matching device usage & intervals)
  const [pm10, setPm10] = useState(8.2);
  const [pm25, setPm25] = useState(12.4);
  const [pm100, setPm100] = useState(18.6);
  const [co, setCo] = useState(0.42);
  const [no2, setNo2] = useState(15);
  const [o3, setO3] = useState(22);
  const [cameraFit, setCameraFit] = useState(95.8);
  const [satelliteSync, setSatelliteSync] = useState(1.2);
  const [accuracyConfidence, setAccuracyConfidence] = useState(99.1);

  // Automatic real-time atmospheric sensor updates simulating device telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setPm10(prev => Math.max(3.0, Math.min(25.0, Number((prev + (Math.random() * 0.8 - 0.4)).toFixed(1)))));
      setPm25(prev => Math.max(5.0, Math.min(45.0, Number((prev + (Math.random() * 1.2 - 0.6)).toFixed(1)))));
      setPm100(prev => Math.max(10.0, Math.min(55.0, Number((prev + (Math.random() * 1.8 - 0.9)).toFixed(1)))));
      
      setCo(prev => Math.max(0.15, Math.min(1.2, Number((prev + (Math.random() * 0.04 - 0.02)).toFixed(2)))));
      setNo2(prev => Math.max(5, Math.min(35, Math.round(prev + (Math.random() * 2 - 1)))));
      setO3(prev => Math.max(10, Math.min(50, Math.round(prev + (Math.random() * 2 - 1)))));

      setCameraFit(prev => Math.max(92.0, Math.min(99.5, Number((prev + (Math.random() * 0.4 - 0.2)).toFixed(1)))));
      setSatelliteSync(prev => Math.max(0.4, Math.min(3.2, Number((prev + (Math.random() * 0.2 - 0.1)).toFixed(1)))));
      setAccuracyConfidence(prev => Math.max(98.1, Math.min(99.9, Number((prev + (Math.random() * 0.08 - 0.04)).toFixed(1)))));
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  // When device camera scanner operates, feed the active visual computer telemetry into local readouts
  const handleScanUpdate = (turbidity: number) => {
    // Convert 0-100 visual turbidity to realistic PM concentrations
    // High turbidity (heavy air density / visual obstruction) yields higher PM2.5 (up to 45 µg/m³)
    const computedPm25 = Math.max(5.0, Math.min(48.0, Number((6.0 + (turbidity * 0.42)).toFixed(1))));
    setPm25(computedPm25);
    setPm10(Math.max(3.0, Number((computedPm25 * 0.65).toFixed(1))));
    setPm100(Math.max(10.0, Number((computedPm25 * 1.45).toFixed(1))));
    
    // Slightly adjust gaseous metrics on haze
    setCo(prev => Math.max(0.2, Math.min(1.1, Number((0.3 + (turbidity * 0.007)).toFixed(2)))));
    setNo2(prev => Math.max(8, Math.min(32, Math.round(12 + (turbidity * 0.18)))));
    
    // Elevate camera visual capture confidence fit on active lock
    setCameraFit(Math.max(95.0, Math.min(99.9, Number((96.5 + (Math.random() * 3.3)).toFixed(1)))));
    setAccuracyConfidence(prev => Math.max(99.2, Math.min(99.9, Number((99.2 + (Math.random() * 0.7)).toFixed(1)))));
  };

  const getAirQualityStatus = (pmValue: number) => {
    if (pmValue <= 15.0) {
      return {
        label: 'Terpantau Sehat',
        badgeColor: darkMode ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700',
        text: `Berdasarkan pindaian sensor AeroScan AI di wilayah ${userCity} saat ini, konsentrasi partikulat PM2.5 berada pada tingkat rendah (${pmValue} µg/m³). Indeks kualitas udara tergolong sangat aman untuk seluruh aktivitas masyarakat.`,
        statusText: 'Safe Air Quality',
        themeColor: 'emerald'
      };
    } else if (pmValue <= 30.0) {
      return {
        label: 'Terpantau Sedang',
        badgeColor: darkMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-700',
        text: `Berdasarkan pindaian sensor AeroScan AI di wilayah ${userCity} saat ini, konsentrasi partikulat PM2.5 berada pada tingkat sedang (${pmValue} µg/m³). Kualitas udara masih cukup baik namun disarankan kelompok sensitif berhati-hati.`,
        statusText: 'Moderate Air',
        themeColor: 'amber'
      };
    } else {
      return {
        label: 'Tidak Sehat (Haze)',
        badgeColor: darkMode ? 'bg-rose-950/20 border-rose-900/40 text-rose-400' : 'bg-rose-50 border-rose-105 text-rose-700',
        text: `Berdasarkan pindaian sensor AeroScan AI di wilayah ${userCity} saat ini, konsentrasi partikulat PM2.5 berada pada tingkat tinggi (${pmValue} µg/m³). Terdeteksi kepekatan optik (haze). Sebaiknya kenakan masker di luar.`,
        statusText: 'Unhealthy Air',
        themeColor: 'rose'
      };
    }
  };

  const aqs = getAirQualityStatus(pm25);

  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          setIsLocating(false);
          
          // Request real-world reverse name from free public Nominatim lookup api
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`)
            .then(res => res.json())
            .then(data => {
              const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.municipality || data.address?.region || data.address?.state || 'Jakarta';
              setUserCity(city);
            })
            .catch(() => {
              setUserCity('Lokasi Anda');
            });
        },
        (error) => {
          console.error("Geolocation status error:", error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, []);

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col lg:flex-row font-sans selection:bg-blue-105 selection:text-blue-900 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F1F5F9] text-slate-900'}`}>
      {/* MOBILE HEADER TOP-BAR (Visible only on screens < lg) */}
      <header className={`lg:hidden h-16 w-full flex items-center justify-between px-4 border-b shrink-0 z-40 transition-colors ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/60'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              darkMode ? 'bg-slate-800 border-slate-705 hover:bg-slate-750 text-slate-100' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="Open Navigation"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 flex items-center justify-center relative shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M 32 9 C 18 9, 9 18, 9 32 V 45" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 9 55 V 68 C 9 82, 18 92, 32 92" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 68 92 C 82 92, 92 82, 92 68 V 55" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 92 45 V 32 C 92 18, 82 9, 68 9" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="41" y="7.5" width="18" height="3" rx="1.5" fill="#38BDF8" />
                <path d="M 15 24 V 17 C 15 16, 16 15, 17 15 H 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 85 24 V 17 C 85 16, 84 15, 83 15 H 76" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 15 76 V 83 C 15 84, 16 85, 17 85 H 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 85 76 V 83 C 85 84, 84 85, 83 85 H 76" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 11 63 V 49 H 17 V 63 M 18.5 63 V 35 L 23.5 30 V 63 M 24.5 63 V 41 L 28.5 39 V 63 M 31 63 V 47 H 35 V 63" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M 64.5 63 V 58 H 70.5 V 63 M 71 63 V 38 H 73.5 V 63 M 76.5 63 V 38 H 79 V 63 M 80 63 C 80 53, 81.5 48, 84 48 H 88 C 90.5 48, 91.5 53, 91.5 63" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <line x1="8" y1="63" x2="92" y2="63" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                <path d="M 19 63 A 31 31 0 0 1 81 63" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="50" y1="32" x2="50" y2="63" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" />
                <circle cx="50" cy="32" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="19" cy="63" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="81" cy="63" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
              </svg>
            </div>
            <div className="flex flex-col select-none leading-none">
              <span className={`font-black text-xs tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>AeroScan AI</span>
              <span className="text-[5.5px] font-black uppercase text-emerald-500 tracking-wider">Air Visibility Intelligence</span>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9.5px] font-black ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-650'
        }`}>
          <MapPin size={11} className={`${isLocating ? 'animate-bounce text-amber-500' : 'text-blue-500'}`} />
          <span className="truncate max-w-[64px]">{userCity}</span>
        </div>
      </header>

      {/* MOBILE DRAWER SIDEBAR (Transiting smoothly in from the left) */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`relative z-10 w-72 max-w-[85vw] h-full flex flex-col transition-colors border-r ${
                darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className={`flex items-center justify-between gap-3 px-4 h-16 border-b shrink-0 ${
                darkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-2 select-none">
                  <div className="w-8 h-8 flex items-center justify-center relative shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 32 9 C 18 9, 9 18, 9 32 V 45" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 9 55 V 68 C 9 82, 18 92, 32 92" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 68 92 C 82 92, 92 82, 92 68 V 55" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 92 45 V 32 C 92 18, 82 9, 68 9" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                      <rect x="41" y="7.5" width="18" height="3" rx="1.5" fill="#38BDF8" />
                      <path d="M 15 24 V 17 C 15 16, 16 15, 17 15 H 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 85 24 V 17 C 85 16, 84 15, 83 15 H 76" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 15 76 V 83 C 15 84, 16 85, 17 85 H 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 85 76 V 83 C 85 84, 84 85, 83 85 H 76" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 11 63 V 49 H 17 V 63 M 18.5 63 V 35 L 23.5 30 V 63 M 24.5 63 V 41 L 28.5 39 V 63 M 31 63 V 47 H 35 V 63" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                      <path d="M 64.5 63 V 58 H 70.5 V 63 M 71 63 V 38 H 73.5 V 63 M 76.5 63 V 38 H 79 V 63 M 80 63 C 80 53, 81.5 48, 84 48 H 88 C 90.5 48, 91.5 53, 91.5 63" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                      <line x1="8" y1="63" x2="92" y2="63" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                      <path d="M 19 63 A 31 31 0 0 1 81 63" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                      <line x1="50" y1="32" x2="50" y2="63" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" />
                      <circle cx="50" cy="32" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
                      <circle cx="19" cy="63" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
                      <circle cx="81" cy="63" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
                    </svg>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-extrabold text-xs sm:text-sm tracking-tight">AeroScan AI</span>
                    <span className="text-[6.5px] font-black text-slate-400">Air Visibility Intelligence</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`p-1.5 rounded-xl transition-all ${
                    darkMode ? 'bg-slate-800 text-slate-300 hover:text-slate-100' : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative ${
                    activeTab === 'dashboard'
                      ? (darkMode ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400 font-extrabold' : 'bg-blue-50 border-l-4 border-blue-500 text-blue-600 font-extrabold shadow-sm')
                      : (darkMode ? 'text-slate-400 hover:bg-slate-800 border-l-4 border-transparent' : 'text-slate-500 hover:bg-slate-50 border-l-4 border-transparent')
                  }`}
                >
                  <Sliders size={18} />
                  <span className="text-xs uppercase font-semibold tracking-wider">Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('analytics');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative ${
                    activeTab === 'analytics'
                      ? (darkMode ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400 font-extrabold' : 'bg-blue-50 border-l-4 border-blue-500 text-blue-600 font-extrabold shadow-sm')
                      : (darkMode ? 'text-slate-400 hover:bg-slate-800 border-l-4 border-transparent' : 'text-slate-500 hover:bg-slate-50 border-l-4 border-transparent')
                  }`}
                >
                  <Activity size={18} />
                  <span className="text-xs uppercase font-semibold tracking-wider">Analytics</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('health-hub');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative ${
                    activeTab === 'health-hub'
                      ? (darkMode ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400 font-extrabold' : 'bg-blue-50 border-l-4 border-blue-500 text-blue-600 font-extrabold shadow-sm')
                      : (darkMode ? 'text-slate-400 hover:bg-slate-800 border-l-4 border-transparent' : 'text-slate-500 hover:bg-slate-50 border-l-4 border-transparent')
                  }`}
                >
                  <ShieldCheck size={18} />
                  <span className="text-xs uppercase font-semibold tracking-wider">Health Hub</span>
                </button>

                <ReportGenerator
                  userCity={userCity}
                  userCoords={userCoords}
                  trigger={(generatePDF, isGenerating) => (
                    <button
                      onClick={() => {
                        generatePDF();
                        setIsMobileNavOpen(false);
                      }}
                      disabled={isGenerating}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all border-l-4 border-transparent ${
                        isGenerating ? 'opacity-70 cursor-wait' : ''
                      } ${
                        darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-505 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Wind size={18} className={isGenerating ? 'animate-spin text-blue-400' : ''} />
                      <span className="text-xs uppercase font-semibold tracking-wider">Export PDF Report</span>
                    </button>
                  )}
                />
              </nav>

              <div className={`p-4 border-t flex flex-col gap-3 shrink-0 ${
                darkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black border ${
                    darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-550'
                  }`}>
                    <MapPin size={10} className={`${isLocating ? 'animate-bounce text-amber-500' : 'text-blue-500'}`} />
                    <span>{userCity}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setIsMobileNavOpen(false);
                    }}
                    className={`p-2 rounded-lg transition-transform active:scale-95 border flex items-center justify-center shadow-sm relative group ${
                      darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
                    }`}
                  >
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR (lg and above, sticky Left Layout) */}
      <aside className={`hidden lg:flex flex-col h-full shrink-0 border-r transition-all duration-300 ease-in-out relative ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/60'
      }`}>
        {/* Header / Branding */}
        <div className={`flex items-center gap-2.5 px-4 h-16 border-b select-none shrink-0 overflow-hidden transition-colors ${
          darkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="w-9 h-9 flex items-center justify-center relative shrink-0 transition-transform duration-350 hover:scale-105" onClick={() => setActiveTab('dashboard')}>
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path d="M 32 9 C 18 9, 9 18, 9 32 V 45" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 9 55 V 68 C 9 82, 18 92, 32 92" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 68 92 C 82 92, 92 82, 92 68 V 55" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 92 45 V 32 C 92 18, 82 9, 68 9" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="41" y="7.5" width="18" height="3" rx="1.5" fill="#38BDF8" />
              <path d="M 15 24 V 17 C 15 16, 16 15, 17 15 H 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 85 24 V 17 C 85 16, 84 15, 83 15 H 76" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 15 76 V 83 C 15 84, 16 85, 17 85 H 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 85 76 V 83 C 85 84, 84 85, 83 85 H 76" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 11 63 V 49 H 17 V 63 M 18.5 63 V 35 L 23.5 30 V 63 M 24.5 63 V 41 L 28.5 39 V 63 M 31 63 V 47 H 35 V 63" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M 64.5 63 V 58 H 70.5 V 63 M 71 63 V 38 H 73.5 V 63 M 76.5 63 V 38 H 79 V 63 M 80 63 C 80 53, 81.5 48, 84 48 H 88 C 90.5 48, 91.5 53, 91.5 63" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <line x1="8" y1="63" x2="92" y2="63" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
              <path d="M 19 63 A 31 31 0 0 1 81 63" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
              <line x1="50" y1="32" x2="50" y2="63" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" />
              <circle cx="50" cy="32" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="19" cy="63" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="81" cy="63" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
            </svg>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col select-none leading-none justify-center">
              <div className="flex items-baseline gap-0.5">
                <span className={`font-black text-sm tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>AeroScan</span>
                <span className="font-black text-sm tracking-tight text-blue-500">AI</span>
              </div>
              <span className="text-[6px] font-black tracking-[0.08em] uppercase text-emerald-500 mt-0.5">
                Air Visibility Intelligence
              </span>
            </div>
          )}
        </div>

        {/* Sidebar Middle links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all relative ${
              activeTab === 'dashboard'
                ? (darkMode ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400 font-extrabold' : 'bg-blue-50 border-l-4 border-blue-500 text-blue-600 font-extrabold shadow-sm')
                : (darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-l-4 border-transparent' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent')
            }`}
            title="Dashboard"
          >
            <Sliders size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span className="text-xs uppercase tracking-wider font-semibold">Dashboard</span>}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all relative ${
              activeTab === 'analytics'
                ? (darkMode ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400 font-extrabold' : 'bg-blue-50 border-l-4 border-blue-500 text-blue-600 font-extrabold shadow-sm')
                : (darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-l-4 border-transparent' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent')
            }`}
            title="Analytics"
          >
            <Activity size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span className="text-xs uppercase tracking-wider font-semibold">Analytics</span>}
          </button>

          <button
            onClick={() => setActiveTab('health-hub')}
            className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all relative ${
              activeTab === 'health-hub'
                ? (darkMode ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400 font-extrabold' : 'bg-blue-50 border-l-4 border-blue-500 text-blue-600 font-extrabold shadow-sm')
                : (darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-l-4 border-transparent' : 'text-slate-505 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent')
            }`}
            title="Health Hub"
          >
            <ShieldCheck size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span className="text-xs uppercase tracking-wider font-semibold">Health Hub</span>}
          </button>

          <ReportGenerator
            userCity={userCity}
            userCoords={userCoords}
            trigger={(generatePDF, isGenerating) => (
              <button
                onClick={generatePDF}
                disabled={isGenerating}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all border-l-4 border-transparent ${
                  isGenerating ? 'opacity-70 cursor-wait' : ''
                } ${
                  darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60' : 'text-slate-550 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Export PDF Report"
              >
                <div className="shrink-0">
                  <Wind size={18} className={isGenerating ? 'animate-spin text-blue-400' : ''} />
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-xs uppercase tracking-wider font-semibold text-left">Export Report</span>
                )}
              </button>
            )}
          />
        </nav>

        {/* Sidebar bottom Section (Session / settings / minimize sidebar) */}
        <div className={`p-4 border-t flex flex-col gap-3 shrink-0 ${
          darkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center justify-between gap-1.5">
            {!isSidebarCollapsed && (
              <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black border transition-colors ${
                darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-550'
              }`}>
                <MapPin size={9} className={`${isLocating ? 'animate-bounce text-amber-500' : 'text-blue-500'}`} />
                <span className="truncate max-w-[80px]">{userCity}</span>
              </div>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-lg border flex items-center justify-center shadow-sm relative group ${
                isSidebarCollapsed ? 'mx-auto' : ''
              } ${
                darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
              }`}
              title="Settings"
            >
              <Settings size={14} className="group-hover:rotate-45 transition-transform duration-300" />
            </button>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`hidden lg:flex p-2 rounded-lg border items-center justify-center transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-755 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
              }`}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Column 2: MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col relative transition-all duration-300">
        <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Tab views switcher with AnimatePresence for state transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              {/* Row 1: Camera & Local Forecast (Symmetrical Split) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Camera Scanner */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                      <Wind size={12} />
                    </div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Scanner Area</h3>
                  </div>
                  <div className={`rounded-[36px] overflow-hidden shadow-2xl border h-[420px] bg-slate-950 ${darkMode ? 'border-slate-800' : 'border-white'}`}>
                    <CameraScanner onScanUpdate={handleScanUpdate} />
                  </div>
                </div>

                {/* Local Forecast */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                      <CloudSun size={12} />
                    </div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Local Forecast</h3>
                  </div>
                  <div className={`rounded-[36px] overflow-hidden h-[420px] transition-all duration-300 border ${darkMode ? 'border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/20' : 'border-white bg-white shadow-2xl shadow-slate-200'}`}>
                    <WeatherForecast darkMode={darkMode} className="h-full" userCity={userCity} />
                  </div>
                </div>
              </div>

              {/* Row 2: Geo Overlay Map (Full Width with uniform top gap) */}
              <div className="flex flex-col mt-4 sm:mt-6">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <MapIcon size={12} />
                  </div>
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Geo Overlay</h3>
                </div>
                <div className={`rounded-[36px] overflow-hidden h-[480px] w-full transition-all duration-300 border ${darkMode ? 'border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/20' : 'border-white bg-slate-100 shadow-2xl shadow-slate-200'}`}>
                  <DashboardMap darkMode={darkMode} userCoords={userCoords} userCity={userCity} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              {/* Analytics Center Dashboard */}
              <div className={`rounded-[36px] overflow-hidden shadow-2xl border transition-colors ${darkMode ? 'shadow-slate-950/25 border-slate-800' : 'shadow-slate-200 border-white'}`}>
                <PollutionChart darkMode={darkMode} userCity={userCity} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Particulate Specs */}
                <div className={`${darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/40' : 'bg-white border-slate-200/60 shadow-slate-100'} p-8 rounded-[36px] border shadow-xl flex flex-col gap-5`}>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Particulate Analysis (PM)</h4>
                  <div className="space-y-3.5">
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100/60'}`}>
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>PM1.0 (Very Fine)</span>
                      <span className={`text-xs font-mono font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{pm10} µg/m³</span>
                    </div>
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100/60'}`}>
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>PM2.5 (Fine Particulates)</span>
                      <span className={`text-xs font-mono font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{pm25} µg/m³</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>PM10 (Inhalable Coarse)</span>
                      <span className={`text-xs font-mono font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{pm100} µg/m³</span>
                    </div>
                  </div>
                </div>

                {/* Gaseous values */}
                <div className={`${darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/40' : 'bg-white border-slate-200/60 shadow-slate-100'} p-8 rounded-[36px] border shadow-xl flex flex-col gap-5`}>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Gaseous Pollutants</h4>
                  <div className="space-y-3.5">
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100/60'}`}>
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>CO (Carbon Monoxide)</span>
                      <span className={`text-xs font-mono font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{co} ppm</span>
                    </div>
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100/60'}`}>
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>NO2 (Nitrogen Dioxide)</span>
                      <span className={`text-xs font-mono font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{no2} ppb</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>O3 (Ozone)</span>
                      <span className={`text-xs font-mono font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{o3} ppb</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy */}
                <div className={`${darkMode ? 'bg-slate-900 border-slate-800 shadow-slate-950/40' : 'bg-white border-slate-200/60 shadow-slate-100'} p-8 rounded-[36px] border shadow-xl flex flex-col gap-5`}>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Calibration Info</h4>
                  <div className="space-y-3.5">
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100/60'}`}>
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Camera Visual Fit</span>
                      <span className={`text-xs font-mono font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{cameraFit}%</span>
                    </div>
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100/60'}`}>
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Satellite Cross-Sync</span>
                      <span className={`text-xs font-mono font-black ${darkMode ? 'text-slate-100' : 'text-slate-805'}`}>±{satelliteSync}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Accuracy Confidence</span>
                      <span className={`text-xs font-mono font-black ${
                        accuracyConfidence >= 98.5 ? 'text-emerald-500' : 'text-amber-500'
                      }`}>{accuracyConfidence}% {accuracyConfidence >= 98.5 ? 'High' : 'Normal'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'health-hub' && (
            <motion.div
              key="health-hub"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
            >
              {/* Health Advisory left panel */}
              <div className="lg:col-span-2 flex flex-col h-full">
                <div className={`p-8 md:p-10 rounded-[40px] border shadow-2xl relative overflow-hidden flex flex-col justify-between h-full transition-all duration-300 ${
                  darkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/40' 
                    : 'bg-white border-slate-100 text-slate-900'
                }`}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                  <div>
                             {/* Header with modern left accent border to replace floating details and provide clean visual hierarchy */}
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b pb-8 relative z-10 transition-colors ${
                      darkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      <div className="flex items-center gap-4.5 border-l-4 border-amber-500 pl-4">
                        <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center border shadow-sm shrink-0 transition-colors ${
                          aqs.themeColor === 'emerald'
                            ? (darkMode ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100/80')
                            : aqs.themeColor === 'amber'
                            ? (darkMode ? 'bg-amber-950/40 text-amber-400 border-amber-900/50' : 'bg-amber-50 text-amber-600 border-amber-100/80')
                            : (darkMode ? 'bg-rose-950/40 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-100/80')
                        }`}>
                          <ShieldCheck size={28} />
                        </div>
                        <div>
                          <span className={`text-[9.5px] font-black uppercase tracking-widest block leading-none ${
                            aqs.themeColor === 'emerald' ? 'text-emerald-400' : aqs.themeColor === 'amber' ? 'text-amber-500' : 'text-rose-400'
                          }`}>{aqs.statusText}</span>
                          <h3 className={`text-sm sm:text-base md:text-lg font-black tracking-tight mt-1 leading-tight transition-colors ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}>Health Advisory & Rekomendasi</h3>
                        </div>
                      </div>
                      <div className={`px-4 py-3 rounded-2xl border self-start md:self-auto shrink-0 flex flex-col justify-center transition-colors ${aqs.badgeColor}`}>
                        <span className="text-[8.5px] font-black uppercase tracking-widest block leading-none mb-1">Status Kualitas Udara</span>
                        <span className="text-sm font-extrabold leading-none">{aqs.label}</span>
                      </div>
                    </div>

                    <p className={`text-sm font-medium leading-relaxed mb-8 max-w-2xl relative z-10 transition-colors ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {aqs.text}
                    </p>
                  </div>

                  {/* Symmetrical 3-Column CSS Grid with equal distribution and spacing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 w-full">
                    {/* Card 1 */}
                    <div className={`p-7 rounded-[24px] border flex flex-col gap-4 transform transition-all duration-300 ${
                      darkMode 
                        ? 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 hover:border-slate-800' 
                        : 'bg-slate-50/60 border-slate-100/80 hover:bg-white hover:shadow-xl hover:shadow-slate-100/80 hover:-translate-y-0.5'
                    }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black border shrink-0 ${
                        aqs.themeColor === 'emerald'
                          ? (darkMode ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50/85 text-emerald-600 border-emerald-100/40')
                          : aqs.themeColor === 'amber'
                          ? (darkMode ? 'bg-amber-950/30 text-amber-400 border-amber-900/30' : 'bg-amber-50/85 text-amber-600 border-amber-100/40')
                          : (darkMode ? 'bg-rose-950/30 text-rose-400 border-rose-900/30' : 'bg-rose-50/85 text-rose-600 border-rose-100/40')
                      }`}>
                        {aqs.themeColor === 'emerald' ? '✓' : aqs.themeColor === 'amber' ? '!' : '⚠'}
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className={`text-sm font-bold tracking-tight transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Aktivitas Luar Ruangan</h4>
                        <p className={`text-xs font-semibold leading-relaxed transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {aqs.themeColor === 'emerald' 
                            ? 'Diperbolehkan sepenuhnya tanpa pembatasan, sangat disarankan untuk berolahraga pagi atau beraktivitas.'
                            : aqs.themeColor === 'amber'
                            ? 'Dapat beraktivitas normal. Kelompok sangat sensitif agar mengurangi kelelahan fisik berlebih di luar.'
                            : 'Batasi kegiatan luar ruang yang terlalu intens. Selalu sediakan dan gunakan masker pelindung standar.'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className={`p-7 rounded-[24px] border flex flex-col gap-4 transform transition-all duration-300 ${
                      darkMode 
                        ? 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 hover:border-slate-800' 
                        : 'bg-slate-50/60 border-slate-100/80 hover:bg-white hover:shadow-xl hover:shadow-slate-100/80 hover:-translate-y-0.5'
                    }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black border shrink-0 ${
                        aqs.themeColor === 'emerald'
                          ? (darkMode ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50/85 text-emerald-600 border-emerald-100/40')
                          : aqs.themeColor === 'amber'
                          ? (darkMode ? 'bg-amber-950/30 text-amber-400 border-amber-900/30' : 'bg-amber-50/85 text-amber-600 border-amber-100/40')
                          : (darkMode ? 'bg-rose-950/30 text-rose-400 border-rose-900/30' : 'bg-rose-50/85 text-rose-600 border-rose-100/40')
                      }`}>
                        {aqs.themeColor === 'emerald' ? '✓' : aqs.themeColor === 'amber' ? '✓' : '⚠'}
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className={`text-sm font-bold tracking-tight transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Sirkulasi Udara Rumah</h4>
                        <p className={`text-xs font-semibold leading-relaxed transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {aqs.themeColor === 'emerald'
                            ? 'Buka ventilasi udara lebar-lebar untuk menjaga kesegaran hunian dan sirkulasi udara alami.'
                            : aqs.themeColor === 'amber'
                            ? 'Sirkulasi udara aman, namun pertimbangkan waktu pagi hari untuk pertukaran udara optimal.'
                            : 'Tutup ventilasi jendela selama polusi memuncak. Nyalakan pembersih udara (Air Purifier) jika ada.'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className={`p-7 rounded-[24px] border flex flex-col gap-4 transform transition-all duration-300 ${
                      darkMode 
                        ? 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 hover:border-slate-800' 
                        : 'bg-slate-50/60 border-slate-100/80 hover:bg-white hover:shadow-xl hover:shadow-slate-100/80 hover:-translate-y-0.5'
                    }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black border shrink-0 ${
                        aqs.themeColor === 'emerald'
                          ? (darkMode ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50/85 text-emerald-600 border-emerald-100/40')
                          : aqs.themeColor === 'amber'
                          ? (darkMode ? 'bg-amber-950/30 text-amber-400 border-amber-900/30' : 'bg-amber-50/85 text-amber-600 border-amber-100/40')
                          : (darkMode ? 'bg-rose-950/30 text-rose-400 border-rose-900/30' : 'bg-rose-50/85 text-rose-600 border-rose-100/40')
                      }`}>
                        {aqs.themeColor === 'emerald' ? '✓' : aqs.themeColor === 'amber' ? '!' : '⚠'}
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className={`text-sm font-bold tracking-tight transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Kelompok Sensitif</h4>
                        <p className={`text-xs font-semibold leading-relaxed transition-colors ${darkMode ? 'text-slate-405 text-slate-400' : 'text-slate-500'}`}>
                          {aqs.themeColor === 'emerald'
                            ? 'Bagi penderita asma atau gangguan pernapasan, kondisi ini sangat aman untuk aktivitas normal.'
                            : aqs.themeColor === 'amber'
                            ? 'Penderita gangguan pernapasan harap memantau respon fisik apabila beraktivitas lama di luar.'
                            : 'Kelompok rentan (anak-anak, lansia, atau asma kronis) sebaiknya tetap berada di dalam ruangan.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar on Health Hub for additional medical guides - Stretched to identical height */}
              <div className="lg:col-span-1 flex flex-col h-full">
                <div className={`p-8 md:p-10 rounded-[40px] border shadow-2xl flex flex-col gap-6 h-full justify-between transition-all duration-300 ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
                }`}>
                  <div>
                    <div className={`flex items-center gap-3 border-b pb-5 mb-5 shrink-0 transition-colors ${
                      darkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        darkMode ? 'bg-slate-850 text-blue-400 border border-slate-800' : 'bg-slate-900 text-white'
                      }`}>
                        <Activity size={16} />
                      </div>
                      <h4 className={`text-sm font-black uppercase tracking-wider transition-colors ${
                        darkMode ? 'text-slate-200' : 'text-slate-900'
                      }`}>Health Quick Tips</h4>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {/* Tip 1 */}
                      <div className={`p-5 rounded-[22px] border flex items-start gap-4 transition-all duration-300 ${
                        darkMode 
                          ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-950' 
                          : 'bg-blue-50/40 border-blue-100/50 hover:bg-blue-50/70'
                      }`}>
                        <div className={`p-3 rounded-xl shrink-0 transition-colors ${
                          darkMode ? 'bg-blue-950/40 text-blue-400' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <Wind size={18} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h5 className={`text-xs font-bold transition-colors ${darkMode ? 'text-slate-350 text-slate-300' : 'text-slate-800'}`}>Penggunaan Masker</h5>
                          <p className={`text-[11px] font-semibold leading-normal transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Masker tidak wajib dalam kondisi saat ini, namun direkomendasikan jika berada di dekat area industri.</p>
                        </div>
                      </div>

                      {/* Tip 2 */}
                      <div className={`p-5 rounded-[22px] border flex items-start gap-4 transition-all duration-300 ${
                        darkMode 
                          ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-950' 
                          : 'bg-orange-50/40 border-orange-100/50 hover:bg-orange-50/70'
                      }`}>
                        <div className={`p-3 rounded-xl shrink-0 transition-colors ${
                          darkMode ? 'bg-orange-950/40 text-orange-400' : 'bg-orange-100 text-orange-600'
                        }`}>
                          <CloudSun size={18} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h5 className={`text-xs font-bold transition-colors ${darkMode ? 'text-slate-350 text-slate-300' : 'text-slate-800'}`}>Hidrasi Cairan Tubuh</h5>
                          <p className={`text-[11px] font-semibold leading-normal transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tetap konsumsi minimal 2 Liter air per hari karena suhu udara berawan cukup hangat (31°C).</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informational badge at the bottom of the sidebar to anchor the spacing */}
                  <div className={`mt-8 pt-6 border-t flex items-center gap-3 text-slate-400 transition-colors ${
                    darkMode ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Verified by health advisory board</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>



      {/* Settings Modal Dialog Overlay */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              id="settings-backdrop"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className={`w-full max-w-lg rounded-[36px] shadow-2xl relative z-10 overflow-hidden border flex flex-col max-h-[90vh] transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
              id="settings-modal"
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
                    <Settings size={18} />
                  </div>
                  <div>
                    <h3 className={`text-base font-black tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Pengaturan Sistem</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AeroScan Preferences</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-slate-100' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto flex flex-col gap-6">
                {/* Section 1: Preference Toggle */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Opsi Dashboard</h4>
                  
                  <div className="flex flex-col gap-3">
                    {/* Dark Mode toggle */}
                    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100/50'}`}>
                      <div>
                        <p className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Mode Gelap / Dark Theme</p>
                        <p className="text-[10px] text-slate-400">Aktifkan tema gelap ramah mata untuk seluruh aplikasi.</p>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`w-10 h-6 rounded-full transition-all duration-300 relative ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                        id="darkmode-toggle"
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${darkMode ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>

                    {/* Grid line toggle */}
                    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100/50'}`}>
                      <div>
                        <p className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Tampilkan Grid Grafik</p>
                        <p className="text-[10px] text-slate-400">Tampilkan garis bantu presisi pada grafik mingguan.</p>
                      </div>
                      <button
                        onClick={() => setShowGridLines(!showGridLines)}
                        className={`w-10 h-6 rounded-full transition-all duration-300 relative ${showGridLines ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${showGridLines ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>

                    {/* Dense geo data */}
                    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100/50'}`}>
                      <div>
                        <p className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Kepadatan Data Geografis</p>
                        <p className="text-[10px] text-slate-400">Aktifkan detail polutan ekstra padat pada peta.</p>
                      </div>
                      <button
                        onClick={() => setDenseMapData(!denseMapData)}
                        className={`w-10 h-6 rounded-full transition-all duration-300 relative ${denseMapData ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${denseMapData ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>

                    {/* Offline persistence */}
                    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100/50'}`}>
                      <div>
                        <p className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Simpan Histori Lokal</p>
                        <p className="text-[10px] text-slate-400">Gunakan penyimpanan lokal untuk menyimpan log pindaian.</p>
                      </div>
                      <button
                        onClick={() => setSaveLocalHistory(!saveLocalHistory)}
                        className={`w-10 h-6 rounded-full transition-all duration-300 relative ${saveLocalHistory ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${saveLocalHistory ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`p-6 border-t flex items-center justify-between transition-colors ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Active Build: v2.4</span>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-slate-100 border-slate-200 text-slate-950 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'}`}
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
