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
  ChevronRight,
  Radio,
  Database,
  LayoutGrid,
  Droplet,
  Cpu,
  Zap,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2
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

  const INITIAL_STATIONS = [
    { id: 'pusat', name: 'Stasiun Jakarta Pusat', lat: -6.1751, lng: 106.8272, aqi: 48, status: 'Baik' },
    { id: 'selatan', name: 'Stasiun Kuningan (Selatan)', lat: -6.2297, lng: 106.8159, aqi: 122, status: 'Tidak Sehat' },
    { id: 'barat', name: 'Stasiun Kebon Jeruk (Barat)', lat: -6.1683, lng: 106.7588, aqi: 68, status: 'Sedang' },
    { id: 'utara', name: 'Stasiun Ancol (Utara)', lat: -6.1261, lng: 106.8416, aqi: 82, status: 'Sedang' },
    { id: 'timur', name: 'Stasiun Halim (Timur)', lat: -6.2588, lng: 106.8833, aqi: 96, status: 'Sedang' }
  ];

  const [stations, setStations] = useState<any[]>(INITIAL_STATIONS);
  const [selectedStation, setSelectedStation] = useState<any | null>(INITIAL_STATIONS[0]);

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

  // Synchronize stations dynamically when user location is resolved
  useEffect(() => {
    if (userCoords) {
      const label = userCity || 'Anda';
      const dynamicStations = [
        { id: 'pusat', name: `Stasiun ${label} Pusat`, lat: userCoords.lat, lng: userCoords.lng, aqi: 48, status: 'Baik' },
        { id: 'selatan', name: `Stasiun ${label} Selatan`, lat: userCoords.lat - 0.015, lng: userCoords.lng, aqi: 122, status: 'Tidak Sehat' },
        { id: 'barat', name: `Stasiun ${label} Barat`, lat: userCoords.lat, lng: userCoords.lng - 0.015, aqi: 68, status: 'Sedang' },
        { id: 'utara', name: `Stasiun ${label} Utara`, lat: userCoords.lat + 0.015, lng: userCoords.lng, aqi: 82, status: 'Sedang' },
        { id: 'timur', name: `Stasiun ${label} Timur`, lat: userCoords.lat, lng: userCoords.lng + 0.015, aqi: 96, status: 'Sedang' }
      ];
      setStations(dynamicStations);
      setSelectedStation(dynamicStations[0]);
    } else {
      setStations(INITIAL_STATIONS);
      setSelectedStation(INITIAL_STATIONS[0]);
    }
  }, [userCoords, userCity]);

  // Symmetrically map custom helper variables based on currently selected map station to keep everything unified
  useEffect(() => {
    if (selectedStation) {
      const liveAqi = selectedStation.aqi;
      setPm25(Math.max(3.0, Number((liveAqi * 0.35).toFixed(1))));
      setPm10(Math.max(5.0, Number((liveAqi * 0.65).toFixed(1))));
      setPm100(Math.max(10.0, Number((liveAqi * 1.1).toFixed(1))));
      setCo(Math.max(0.1, Number((liveAqi * 0.006).toFixed(2))));
      setNo2(Math.max(2, Math.round(liveAqi * 0.25)));
      setO3(Math.max(5, Math.round(liveAqi * 0.32)));
    }
  }, [selectedStation?.aqi]);

  // Maintain selectedStation link whenever elements inside stations change
  useEffect(() => {
    if (selectedStation) {
      const current = stations.find(s => s.id === selectedStation.id);
      if (current) {
        setSelectedStation(current);
      }
    }
  }, [stations]);

  // Synchronize dynamic updates on other system diagnostics
  useEffect(() => {
    const timer = setInterval(() => {
      // Fluid variations for other sensor readouts
      setCameraFit(prev => Math.max(92.0, Math.min(99.5, Number((prev + (Math.random() * 0.4 - 0.2)).toFixed(1)))));
      setSatelliteSync(prev => Math.max(0.4, Math.min(3.2, Number((prev + (Math.random() * 0.2 - 0.1)).toFixed(1)))));
      setAccuracyConfidence(prev => Math.max(98.1, Math.min(99.9, Number((prev + (Math.random() * 0.08 - 0.04)).toFixed(1)))));

      // Gently variate AQI of stations dynamically to keep markers live and actual
      setStations(prev => prev.map(s => {
        const variance = Math.floor(Math.random() * 3) - 1; // subtle variance
        const updatedAqi = Math.max(15, Math.min(250, s.aqi + variance));
        let status = 'Sedang';
        if (updatedAqi <= 50) status = 'Baik';
        else if (updatedAqi <= 100) status = 'Sedang';
        else status = 'Tidak Sehat';
        return { ...s, aqi: updatedAqi, status };
      }));
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // Sync camera Scan results back into current active station's AQI
  const handleScanUpdate = (turbidity: number) => {
    const computedAqi = Math.max(15, Math.round(15 + turbidity * 2.1));
    if (selectedStation) {
      const updated = {
        ...selectedStation,
        aqi: computedAqi,
        status: computedAqi <= 50 ? 'Baik' : computedAqi <= 100 ? 'Sedang' : 'Tidak Sehat'
      };
      setSelectedStation(updated);
      setStations(prev => prev.map(s => s.id === selectedStation.id ? updated : s));
    }
    
    // Elevate diagnostic telemetry on scan lock
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
  const dynamicAQI = selectedStation?.aqi || 48;
  const dynamicCO2 = Math.round(380 + co * 70);

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
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-[18px] sm:text-[24px] text-black dark:text-white leading-none">AeroScan</span>
                <span className="font-bold text-[18px] sm:text-[24px] text-blue-600 leading-none">AI</span>
              </div>
              <span className="text-[9px] sm:text-[12px] font-bold text-green-600 dark:text-green-500 mt-1 uppercase tracking-wider">Air Intelligence</span>
            </div>
          </div>
        </div>

        {/* Location button removed as requested */}
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
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-[24px] text-black dark:text-white leading-none">AeroScan</span>
                      <span className="font-bold text-[24px] text-blue-600 leading-none">AI</span>
                    </div>
                    <span className="text-[12px] font-bold text-green-600 dark:text-green-500 mt-1">Air Visibility Intelligence</span>
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
                  <span className="text-xs uppercase font-semibold tracking-wider">Scan Area</span>
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
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-[24px] text-black dark:text-white leading-none">AeroScan</span>
                <span className="font-bold text-[24px] text-blue-600 leading-none">AI</span>
              </div>
              <span className="text-[12px] font-bold text-green-600 dark:text-green-500 mt-1">
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
                : (darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-l-4 border-transparent' : 'text-slate-500 hover:bg-slate-900 hover:bg-slate-100 border-l-4 border-transparent')
            }`}
            title="Scan Area"
          >
            <Sliders size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span className="text-xs uppercase tracking-wider font-semibold">Scan Area</span>}
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
              className="flex flex-col gap-6 max-w-5xl mx-auto w-full"
            >
              {/* Header Info Section matching the provided reference photograph exactly */}
              <div className="flex flex-row items-center gap-2.5 sm:gap-4 px-1 select-none w-full flex-wrap">
                {/* Left side broadcast layout */}
                <div className="flex items-center gap-2">
                  <Radio size={16} className="text-[#2b7ca5] dark:text-[#38bdf8]" />
                  <span className="text-[12px] font-black tracking-[0.12em] text-[#2b7ca5] dark:text-[#38bdf8] uppercase leading-none">
                    Scanner Area
                  </span>
                </div>
                
                {/* Capsules matching photograph */}
                <div className="flex items-center gap-2">
                  {/* System Ready Capsule */}
                  <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border text-[11px] font-bold leading-none shadow-sm ${
                    darkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-300' 
                      : 'bg-[#eaeff5] border-slate-200/50 text-[#475569]'
                  }`}>
                    <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                    <span>System Ready</span>
                  </div>

                  {/* Location Capsule */}
                  <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border text-[11px] font-bold leading-none shadow-sm ${
                    darkMode 
                      ? 'bg-slate-900 border-slate-800/80 text-slate-300' 
                      : 'bg-[#eaeff5] border-slate-200/50 text-[#475569]'
                  }`}>
                    <MapPin size={11} className="text-[#2b7ca5] dark:text-[#38bdf8] shrink-0" />
                    <span>{userCity} Facility</span>
                  </div>
                </div>
              </div>

              {/* Camera Scanner Container */}
              <div className={`rounded-[32px] overflow-hidden shadow-2xl border h-[480px] bg-slate-950 ${darkMode ? 'border-slate-800' : 'border-white'}`}>
                <CameraScanner onScanUpdate={handleScanUpdate} />
              </div>

              {/* Four Metrics Columns arranged in a responsive 2-column layout matching the photo */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                
                {/* Card 1: Air Quality */}
                <div className={`rounded-[20px] p-5 border shadow-sm flex flex-col justify-between h-[135px] transition-colors ${
                  darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-[#f8fafc]/90 border-slate-200/50'
                }`}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans">
                      Air Quality
                    </span>
                    <Wind size={15} className="text-[#10b981]" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-[32px] md:text-[38px] font-black tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {dynamicAQI}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase select-none font-mono">
                        AQI
                      </span>
                    </div>
                    {/* Progress Slider */}
                    <div className={`h-[5px] w-full rounded-full mt-3 overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-[#e2e8f0]/80'}`}>
                      <div 
                        className="h-full bg-[#10b981] rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (dynamicAQI / 150) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: CO2 Concentration */}
                <div className={`rounded-[20px] p-5 border shadow-sm flex flex-col justify-between h-[135px] transition-colors ${
                  darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-[#f8fafc]/90 border-slate-200/50'
                }`}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans">
                      CO2 Conc.
                    </span>
                    <Database size={15} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-[32px] md:text-[38px] font-black tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {dynamicCO2}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase select-none font-mono">
                        PPM
                      </span>
                    </div>
                    {/* Progress Slider */}
                    <div className={`h-[5px] w-full rounded-full mt-3 overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-[#e2e8f0]/80'}`}>
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(10, ((dynamicCO2 - 350) / 450) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3: Active Sensors */}
                <div className={`rounded-[20px] p-5 border shadow-sm flex flex-col justify-between h-[135px] transition-colors ${
                  darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-[#f8fafc]/90 border-slate-200/50'
                }`}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans">
                      Active
                    </span>
                    <Cpu size={15} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-[32px] md:text-[38px] font-black tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        08
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase select-none font-mono">
                        On
                      </span>
                    </div>
                    {/* block indicators lights */}
                    <div className="flex gap-1 mt-3">
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-full h-2.5 rounded-[2.5px] transition-all duration-300 ${
                            idx < 8 
                              ? 'bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.18)]' 
                              : (darkMode ? 'bg-slate-800' : 'bg-[#eaeff5]')
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 4: Humidity */}
                <div className={`rounded-[20px] p-5 border shadow-sm flex flex-col justify-between h-[135px] transition-colors ${
                  darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-[#f8fafc]/90 border-slate-200/50'
                }`}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] dark:text-slate-505 font-sans">
                      Humidity
                    </span>
                    <Droplet size={15} className="text-[#0284c7]" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-[32px] md:text-[38px] font-black tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        65
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase select-none font-mono">
                        %
                      </span>
                    </div>
                    {/* Progress Slider */}
                    <div className={`h-[5px] w-full rounded-full mt-3 overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-[#e2e8f0]/80'}`}>
                      <div 
                        className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                        style={{ width: '65%' }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Telemetry status footer removed as requested */}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* Top Facility Header Row */}
              <div className={`flex items-center justify-between pb-3.5 border-b transition-colors ${
                darkMode ? 'border-slate-800' : 'border-slate-200/60'
              }`}>
                <div className="flex items-center gap-2">
                  <Radio size={20} className="text-[#0284c7]" />
                  <span className={`text-[16px] font-black tracking-tight ${
                    darkMode ? 'text-white' : 'text-[#1e3a8a]'
                  }`}>
                    {userCity} Sector
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{userCity}</span>
                  <MapPin size={18} className={darkMode ? 'text-slate-400' : 'text-slate-600'} />
                </div>
              </div>

              {/* INTELLIGENCE OVERVIEW */}
              <div className="flex flex-col gap-1.5 px-0.5">
                <div className="flex items-center gap-2 select-none">
                  <Zap size={13} className="text-[#0284c7]" />
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">
                    Intelligence Overview
                  </span>
                </div>
                <p className={`text-[12px] sm:text-sm font-medium leading-relaxed ${
                  darkMode ? 'text-slate-300' : 'text-[#334155]'
                }`}>
                  System integrity at 98.4%. No critical deviations detected in {userCity} sector A-12.
                </p>
              </div>

              {/* LOCAL FORECAST */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 select-none px-0.5">
                  <CloudSun size={13} className="text-[#0284c7]" />
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">
                    Local Forecast
                  </span>
                </div>
                <div className={`rounded-[24px] overflow-hidden border transition-all ${
                  darkMode 
                    ? 'border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/20' 
                    : 'border-slate-100 bg-white shadow-xl shadow-slate-200/40'
                }`}>
                  <WeatherForecast darkMode={darkMode} className="h-full" userCity={userCity} />
                </div>
              </div>

              {/* Analisis Polusi Udara Historis Header Line */}
              <div className="flex items-center justify-between px-0.5 select-none pt-2">
                <span className={`text-base font-black tracking-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Analisis Polusi Udara Historis
                </span>
                <MoreHorizontal size={18} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer" />
              </div>

              {/* The separate freestanding Chart cards */}
              <div className="w-full">
                <PollutionChart darkMode={darkMode} userCity={userCity} currentAqi={dynamicAQI} />
              </div>

              {/* GEO OVERLAY */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-2 select-none px-0.5">
                  <MapIcon size={13} className="text-[#0284c7]" />
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">
                    Geo Overlay
                  </span>
                </div>
                <div className={`rounded-[24px] overflow-hidden h-[420px] w-full border relative transition-all ${
                  darkMode 
                    ? 'border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/20' 
                    : 'border-slate-150 bg-white shadow-xl shadow-slate-200/40'
                }`}>
                  <DashboardMap 
                    darkMode={darkMode} 
                    userCoords={userCoords} 
                    userCity={userCity}
                    stations={stations}
                    setStations={setStations}
                    selectedStation={selectedStation}
                    setSelectedStation={setSelectedStation}
                  />
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
              className="flex flex-col gap-6"
            >
              {/* Top Facility Header Row */}
              <div className={`flex items-center justify-between pb-3.5 border-b transition-colors ${
                darkMode ? 'border-slate-800' : 'border-slate-200/60'
              }`}>
                <div className="flex items-center gap-2">
                  <Activity size={20} className="text-[#0284c7]" />
                  <span className={`text-[16px] font-black tracking-tight ${
                    darkMode ? 'text-white' : 'text-[#1e3a8a]'
                  }`}>
                    Health Hub - {userCity}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{userCity}</span>
                  <MapPin size={18} className={darkMode ? 'text-slate-400' : 'text-slate-600'} />
                </div>
              </div>

              {/* CARD 1: Health Advisory & Rekomendasi */}
              <div className={`rounded-[24px] overflow-hidden border relative flex flex-col p-5 sm:p-6 transition-all duration-300 ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/40' 
                  : 'bg-white border-slate-200/50 text-[#0f172a] shadow-xl shadow-slate-100/30'
              } ${
                aqs.themeColor === 'emerald'
                  ? 'border-l-[6px] border-l-[#10b981]'
                  : aqs.themeColor === 'amber'
                  ? 'border-l-[6px] border-l-[#eab308]'
                  : 'border-l-[6px] border-l-[#ef4444]'
              }`}>
                
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4 w-full mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                      aqs.themeColor === 'emerald'
                        ? (darkMode ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-100/50 text-emerald-700')
                        : aqs.themeColor === 'amber'
                        ? (darkMode ? 'bg-amber-950/40 text-amber-405 text-amber-400' : 'bg-amber-100/50 text-amber-700')
                        : (darkMode ? 'bg-rose-950/40 text-rose-400' : 'bg-rose-100/50 text-rose-700')
                    }`}>
                      <ShieldCheck size={20} />
                    </div>
                    <div className="flex flex-col gap-0.5 select-none font-sans">
                      <span className={`text-[9.5px] font-black uppercase tracking-[0.16em] leading-none ${
                        aqs.themeColor === 'emerald' ? 'text-emerald-500' : aqs.themeColor === 'amber' ? 'text-amber-600' : 'text-rose-500'
                      }`}>
                        {aqs.statusText}
                      </span>
                      <h4 className={`text-[15px] font-black tracking-tight leading-none mt-1 ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        Health Advisory & Rekomendasi
                      </h4>
                    </div>
                  </div>

                  {/* Dynamic Status Badge (Pill style on Right) */}
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none shrink-0 ${
                    aqs.themeColor === 'emerald'
                      ? (darkMode ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-100/80')
                      : aqs.themeColor === 'amber'
                      ? (darkMode ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#fffbeb] text-[#b45309] border border-[#fef3c7]')
                      : (darkMode ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' : 'bg-rose-50 text-rose-750 text-rose-700 border border-rose-100/80')
                  }`}>
                    {aqs.label}
                  </span>
                </div>

                {/* Main Paragraph */}
                <p className={`text-[12px] sm:text-sm font-medium leading-relaxed mb-6 ${
                  darkMode ? 'text-slate-350 bg-slate-950/20 p-3 rounded-lg border border-slate-800/50' : 'text-[#334155]'
                }`}>
                  {aqs.text}
                </p>

                {/* Stacks List */}
                <div className="flex flex-col gap-3 w-full">
                  
                  {/* Item 1 */}
                  <div className={`p-4 rounded-xl border flex flex-col gap-1.5 transition-all duration-300 ${
                    darkMode 
                      ? 'bg-slate-950/45 border-slate-800' 
                      : 'bg-[#f8fafc]/90 border-slate-200/50'
                  }`}>
                    <div className="flex items-center gap-2 select-none">
                      <AlertTriangle size={15} className="text-[#eab308]" />
                      <span className={`text-[12.5px] font-extrabold tracking-tight ${
                        darkMode ? 'text-slate-200' : 'text-[#0f172a]'
                      }`}>
                        Aktivitas Luar Ruangan
                      </span>
                    </div>
                    <p className={`text-[11px] font-semibold leading-relaxed ${
                      darkMode ? 'text-slate-400' : 'text-[#57606a]'
                    }`}>
                      {aqs.themeColor === 'emerald' 
                        ? 'Diperbolehkan sepenuhnya tanpa pembatasan, sangat disarankan untuk berolahraga pagi atau beraktivitas.'
                        : aqs.themeColor === 'amber'
                        ? 'Dapat beraktivitas normal. Kelompok sangat sensitif agar mengurangi kelelahan fisik berlebih di luar.'
                        : 'Batasi kegiatan luar ruang yang terlalu intens. Selalu sediakan dan gunakan masker pelindung standar.'
                      }
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className={`p-4 rounded-xl border flex flex-col gap-1.5 transition-all duration-300 ${
                    darkMode 
                      ? 'bg-slate-950/45 border-slate-800' 
                      : 'bg-[#f8fafc]/90 border-slate-200/50'
                  }`}>
                    <div className="flex items-center gap-2 select-none">
                      <CheckCircle2 size={15} className="text-[#10b981]" />
                      <span className={`text-[12.5px] font-extrabold tracking-tight ${
                        darkMode ? 'text-slate-200' : 'text-[#0f172a]'
                      }`}>
                        Sirkulasi Udara Rumah
                      </span>
                    </div>
                    <p className={`text-[11px] font-semibold leading-relaxed ${
                      darkMode ? 'text-slate-400' : 'text-[#57606a]'
                    }`}>
                      {aqs.themeColor === 'emerald'
                        ? 'Buka ventilasi udara lebar-lebar untuk menjaga kesegaran hunian dan sirkulasi udara alami.'
                        : aqs.themeColor === 'amber'
                        ? 'Sirkulasi udara aman, namun pertimbangkan waktu pagi hari untuk pertukaran udara optimal.'
                        : 'Tutup ventilasi jendela selama polusi memuncak. Nyalakan pembersih udara (Air Purifier) jika ada.'
                      }
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className={`p-4 rounded-xl border flex flex-col gap-1.5 transition-all duration-300 ${
                    darkMode 
                      ? 'bg-slate-950/45 border-slate-800' 
                      : 'bg-[#f8fafc]/90 border-slate-200/50'
                  }`}>
                    <div className="flex items-center gap-2 select-none">
                      <AlertTriangle size={15} className="text-[#ef4444]" />
                      <span className={`text-[12.5px] font-extrabold tracking-tight ${
                        darkMode ? 'text-slate-200' : 'text-[#0f172a]'
                      }`}>
                        Kelompok Sensitif
                      </span>
                    </div>
                    <p className={`text-[11px] font-semibold leading-relaxed ${
                      darkMode ? 'text-slate-400' : 'text-[#57606a]'
                    }`}>
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

              {/* CARD 2: Health Quick Tips */}
              <div className={`rounded-[24px] border p-5 sm:p-6 flex flex-col gap-5 transition-all duration-300 ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/40' 
                  : 'bg-white border-slate-200/50 text-[#0f172a] shadow-xl shadow-slate-100/30'
              }`}>
                {/* Header Title with Custom Black Box icon */}
                <div className="flex items-center gap-3 select-none">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 dark:bg-slate-800 flex items-center justify-center text-white shrink-0">
                    <Zap size={15} fill="white" />
                  </div>
                  <h4 className={`text-[13px] sm:text-[14px] font-black uppercase tracking-wider ${
                    darkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    HEALTH QUICK TIPS
                  </h4>
                </div>

                <div className="flex flex-col gap-4">
                  
                  {/* Tip 1 */}
                  <div className={`p-4 sm:p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${
                    darkMode 
                      ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-950' 
                      : 'bg-[#ecfeff]/50 border-cyan-100/70'
                  }`}>
                    <div className={`p-3 rounded-xl shrink-0 transition-colors ${
                      darkMode ? 'bg-cyan-950/40 text-cyan-400' : 'bg-[#e0f2fe] text-[#0284c7]'
                    }`}>
                      <Wind size={20} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h5 className={`text-[13px] font-black ${
                        darkMode ? 'text-slate-300 text-slate-200' : 'text-[#0f172a]'
                      }`}>
                        Penggunaan Masker
                      </h5>
                      <p className={`text-[11px] font-semibold leading-normal ${
                        darkMode ? 'text-slate-400' : 'text-[#334155]'
                      }`}>
                        Masker tidak wajib dalam kondisi saat ini, namun direkomendasikan jika berada di dekat area industri.
                      </p>
                    </div>
                  </div>

                  {/* Tip 2 */}
                  <div className={`p-4 sm:p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${
                    darkMode 
                      ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-950' 
                      : 'bg-[#fffbeb]/50 border-amber-100/70'
                  }`}>
                    <div className={`p-3 rounded-xl shrink-0 transition-colors ${
                      darkMode ? 'bg-orange-950/40 text-orange-400' : 'bg-[#fef3c7] text-[#ca8a04]'
                    }`}>
                      <Droplet size={20} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h5 className={`text-[13px] font-black ${
                        darkMode ? 'text-slate-300 text-slate-200' : 'text-[#0f172a]'
                      }`}>
                        Hidrasi Cairan Tubuh
                      </h5>
                      <p className={`text-[11px] font-semibold leading-normal ${
                        darkMode ? 'text-slate-400' : 'text-[#334155]'
                      }`}>
                        Tetap konsumsi minimal 2 Liter air per hari karena suhu udara berawan cukup hangat (31°C).
                      </p>
                    </div>
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

                    {/* Offline persistence removed */}
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
