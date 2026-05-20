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
  BarChart3, 
  CloudSun, 
  Map as MapIcon, 
  MapPin,
  Info, 
  Settings, 
  X, 
  Sliders, 
  Check 
} from 'lucide-react';
import CameraScanner from './components/CameraScanner';
import DashboardMap from './components/DashboardMap';
import PollutionChart from './components/PollutionChart';
import WeatherForecast from './components/WeatherForecast';
import ReportGenerator from './components/ReportGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'health-hub'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showGridLines, setShowGridLines] = useState(true);
  const [denseMapData, setDenseMapData] = useState(false);
  const [saveLocalHistory, setSaveLocalHistory] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showHistoricalTrends, setShowHistoricalTrends] = useState(false);

  // Real-time device coordinate geocoding status values
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userCity, setUserCity] = useState<string>('Jakarta');
  const [isLocating, setIsLocating] = useState<boolean>(false);

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
    <div className={`min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F1F5F9] text-slate-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b py-1.5 transition-all duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/70 border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto pl-2 pr-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:scale-105 transition-transform duration-300 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* OUTER FRAME CORNERS WITH GAPS */}
                {/* Top-Left */}
                <path d="M 32 9 C 18 9, 9 18, 9 32 V 45" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                {/* Bottom-Left */}
                <path d="M 9 55 V 68 C 9 82, 18 92, 32 92" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                {/* Bottom-Right */}
                <path d="M 68 92 C 82 92, 92 82, 92 68 V 55" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                {/* Top-Right */}
                <path d="M 92 45 V 32 C 92 18, 82 9, 68 9" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />

                {/* Top Pill centered in gap */}
                <rect x="41" y="7.5" width="18" height="3" rx="1.5" fill="#38BDF8" />

                {/* FOCUS BRACKETS (L-CORNER MARKS) */}
                <path d="M 15 24 V 17 C 15 16, 16 15, 17 15 H 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 85 24 V 17 C 85 16, 84 15, 83 15 H 76" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 15 76 V 83 C 15 84, 16 85, 17 85 H 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 85 76 V 83 C 85 84, 84 85, 83 85 H 76" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />

                {/* RED SILHOUETTES: CITY SKYLINE (LEFT) & INDUSTRY (RIGHT) */}
                <path 
                  d="M 11 63 V 49 H 17 V 63 M 18.5 63 V 35 L 23.5 30 V 63 M 24.5 63 V 41 L 28.5 39 V 63 M 31 63 V 47 H 35 V 63" 
                  fill="none" 
                  stroke="#F43F5E" 
                  strokeWidth="2" 
                  strokeLinejoin="round" 
                  strokeLinecap="round"
                />
                
                <path 
                  d="M 64.5 63 V 58 H 70.5 V 63 M 71 63 V 38 H 73.5 V 63 M 76.5 63 V 38 H 79 V 63 M 80 63 C 80 53, 81.5 48, 84 48 H 88 C 90.5 48, 91.5 53, 91.5 63" 
                  fill="none" 
                  stroke="#F43F5E" 
                  strokeWidth="2" 
                  strokeLinejoin="round" 
                  strokeLinecap="round"
                />

                {/* HORIZONTAL BASELINE */}
                <line x1="8" y1="63" x2="92" y2="63" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

                {/* SEMICIRCULAR SCANNING ARCH */}
                <path d="M 19 63 A 31 31 0 0 1 81 63" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

                {/* VERTICAL DOTED INDICATOR */}
                <line x1="50" y1="32" x2="50" y2="63" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" />

                {/* SUMMIT NODES */}
                <circle cx="50" cy="32" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="19" cy="63" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="81" cy="63" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
              </svg>
            </div>
            <div className="flex items-center gap-1 select-none">
              <span className={`font-black text-xs sm:text-base tracking-tight leading-none ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>AeroScan</span>
              <span className="font-bold text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider leading-none">AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-5 md:gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`text-[8.5px] sm:text-[10px] font-black transition-all uppercase tracking-widest pb-0.5 border-b-2 ${activeTab === 'dashboard' ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-900'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`text-[8.5px] sm:text-[10px] font-black transition-all uppercase tracking-widest pb-0.5 border-b-2 ${activeTab === 'analytics' ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-900'}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('health-hub')}
              className={`text-[8.5px] sm:text-[10px] font-black transition-all uppercase tracking-widest pb-0.5 border-b-2 ${activeTab === 'health-hub' ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-900'}`}
            >
              Health
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* GPS Lock Dynamic Telemetry Badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] font-black transition-all ${
              darkMode 
                ? 'bg-slate-900 border-slate-850 text-slate-400' 
                : 'bg-slate-100/80 border-slate-200/50 text-slate-650'
            }`}>
              <MapPin size={11} className={`${isLocating ? 'animate-bounce text-amber-500' : 'text-blue-500'}`} />
              <span className="opacity-60 uppercase tracking-widest text-[8px]">GPS:</span>
              <span className="text-blue-600 dark:text-blue-400 font-extrabold tracking-tight">{userCity}</span>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-lg transition-all active:scale-95 border flex items-center justify-center shadow-sm relative group ${darkMode ? 'bg-slate-800 border-slate-700/80 hover:bg-slate-750 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'}`}
              aria-label="Settings"
              id="settings-trigger-button"
            >
              <Settings size={15} className="group-hover:rotate-45 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-16">
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
                  <div className="rounded-[36px] overflow-hidden shadow-2xl shadow-slate-205 border border-white h-[420px] bg-slate-950">
                    <CameraScanner />
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

              {/* Row 1.5: Historical Trends Expandable Container */}
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                      <BarChart3 size={11} />
                    </div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Historical Trends</h3>
                  </div>
                  <button
                    onClick={() => setShowHistoricalTrends(!showHistoricalTrends)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 cursor-pointer ${
                      showHistoricalTrends
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : darkMode
                          ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
                    }`}
                  >
                    <span>{showHistoricalTrends ? 'Sembunyikan Grafik' : 'Tampilkan Analisis Tren'}</span>
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {showHistoricalTrends && (
                    <motion.div
                      key="trends-expand"
                      initial={{ opacity: 0, height: 0, scale: 0.98 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.98 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className={`rounded-[36px] overflow-hidden border transition-all duration-300 ${
                        darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-white bg-white shadow-2xl shadow-slate-100/50'
                      }`}>
                        <PollutionChart darkMode={darkMode} userCity={userCity} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <div className="bg-white p-8 rounded-[36px] border border-slate-200/60 shadow-xl shadow-slate-100 flex flex-col gap-5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Particulate Analysis (PM)</h4>
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                      <span className="text-xs font-bold text-slate-700">PM1.0 (Very Fine)</span>
                      <span className="text-xs font-mono font-black text-slate-800">8 µg/m³</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                      <span className="text-xs font-bold text-slate-700">PM2.5 (Fine Particulates)</span>
                      <span className="text-xs font-mono font-black text-slate-855">12 µg/m³</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs font-bold text-slate-700">PM10 (Inhalable Coarse)</span>
                      <span className="text-xs font-mono font-black text-slate-800">18 µg/m³</span>
                    </div>
                  </div>
                </div>

                {/* Gaseous values */}
                <div className="bg-white p-8 rounded-[36px] border border-slate-200/60 shadow-xl shadow-slate-100 flex flex-col gap-5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Gaseous Pollutants</h4>
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                      <span className="text-xs font-bold text-slate-700">CO (Carbon Monoxide)</span>
                      <span className="text-xs font-mono font-black text-slate-800">0.4 ppm</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                      <span className="text-xs font-bold text-slate-700">NO2 (Nitrogen Dioxide)</span>
                      <span className="text-xs font-mono font-black text-slate-800">15 ppb</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs font-bold text-slate-700">O3 (Ozone)</span>
                      <span className="text-xs font-mono font-black text-slate-800">22 ppb</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="bg-white p-8 rounded-[36px] border border-slate-200/60 shadow-xl shadow-slate-100 flex flex-col gap-5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Calibration Info</h4>
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                      <span className="text-xs font-bold text-slate-700">Camera Visual Fit</span>
                      <span className="text-xs font-mono font-black text-slate-800">95.8%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                      <span className="text-xs font-bold text-slate-700">Satellite Cross-Sync</span>
                      <span className="text-xs font-mono font-black text-slate-800">±1.2%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs font-bold text-slate-700">Accuracy Confidence</span>
                      <span className="text-xs font-mono font-black text-emerald-600">99.1% High</span>
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
                          darkMode 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100/80'
                        }`}>
                          <ShieldCheck size={28} />
                        </div>
                        <div>
                          <span className={`text-[9.5px] font-black uppercase tracking-widest block leading-none ${
                            darkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }`}>Safe Air Quality</span>
                          <h3 className={`text-sm sm:text-base md:text-lg font-black tracking-tight mt-1 leading-tight transition-colors ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}>Health Advisory & Rekomendasi</h3>
                        </div>
                      </div>
                      <div className={`px-4 py-3 rounded-2xl border self-start md:self-auto shrink-0 flex flex-col justify-center transition-colors ${
                        darkMode 
                          ? 'bg-emerald-950/20 border-emerald-900/30' 
                          : 'bg-emerald-50 border-emerald-100/50'
                      }`}>
                        <span className={`text-[8.5px] font-black uppercase tracking-widest block leading-none mb-1 ${
                          darkMode ? 'text-emerald-450 text-emerald-400/80' : 'text-emerald-600'
                        }`}>Status Kualitas Udara</span>
                        <span className={`text-sm font-extrabold leading-none ${
                          darkMode ? 'text-emerald-400' : 'text-emerald-700'
                        }`}>Terpantau Sehat</span>
                      </div>
                    </div>

                    <p className={`text-sm font-medium leading-relaxed mb-8 max-w-2xl relative z-10 transition-colors ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Berdasarkan pindaian sensor AeroScan AI di wilayah <strong className={darkMode ? 'text-blue-400 font-extrabold' : 'text-blue-600 font-black'}>{userCity}</strong> saat ini, konsentrasi partikulat PM2.5 berada pada tingkat rendah. Indeks kualitas udara tergolong aman untuk seluruh lapisan masyarakat.
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
                        darkMode 
                          ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' 
                          : 'bg-emerald-50/85 text-emerald-600 border-emerald-100/40'
                      }`}>
                        ✓
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className={`text-sm font-bold tracking-tight transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Aktivitas Luar Ruangan</h4>
                        <p className={`text-xs font-semibold leading-relaxed transition-colors ${darkMode ? 'text-slate-450 text-slate-400' : 'text-slate-500'}`}>Diperbolehkan sepenuhnya tanpa pembatasan, sangat disarankan untuk berolahraga pagi atau beraktivitas.</p>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className={`p-7 rounded-[24px] border flex flex-col gap-4 transform transition-all duration-300 ${
                      darkMode 
                        ? 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 hover:border-slate-800' 
                        : 'bg-slate-50/60 border-slate-100/80 hover:bg-white hover:shadow-xl hover:shadow-slate-100/80 hover:-translate-y-0.5'
                    }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black border shrink-0 ${
                        darkMode 
                          ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' 
                          : 'bg-emerald-50/85 text-emerald-600 border-emerald-100/40'
                      }`}>
                        ✓
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className={`text-sm font-bold tracking-tight transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Sirkulasi Udara Rumah</h4>
                        <p className={`text-xs font-semibold leading-relaxed transition-colors ${darkMode ? 'text-slate-450 text-slate-400' : 'text-slate-500'}`}>Buka ventilasi udara lebar-lebar untuk menjaga kesegaran hunian dan sirkulasi udara alami.</p>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className={`p-7 rounded-[24px] border flex flex-col gap-4 transform transition-all duration-300 ${
                      darkMode 
                        ? 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 hover:border-slate-800' 
                        : 'bg-slate-50/60 border-slate-100/80 hover:bg-white hover:shadow-xl hover:shadow-slate-100/80 hover:-translate-y-0.5'
                    }`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black border shrink-0 ${
                        darkMode 
                          ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' 
                          : 'bg-emerald-50/85 text-emerald-600 border-emerald-100/40'
                      }`}>
                        ✓
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className={`text-sm font-bold tracking-tight transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Kelompok Sensitif</h4>
                        <p className={`text-xs font-semibold leading-relaxed transition-colors ${darkMode ? 'text-slate-450 text-slate-400' : 'text-slate-500'}`}>Bagi penderita asma atau gangguan pernapasan, kondisi ini sangat aman untuk aktivitas normal luar ruangan.</p>
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

                {/* Section 2: Unduh Laporan Mingguan */}
                <div className={`border-t pt-6 flex flex-col gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-blue-500" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ekspor Data</h4>
                  </div>
                  
                  <div className={`p-6 rounded-2xl border flex flex-col items-center text-center gap-4 transition-colors ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <h5 className={`text-sm font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Unduh Laporan Mingguan</h5>
                      <p className="text-[11px] text-slate-400 px-4 leading-relaxed">
                        Unduh ringkasan menyeluruh data polusi udara mingguan dalam format PDF beresolusi tinggi.
                      </p>
                    </div>
                    <div className="w-full flex justify-center pt-2">
                      <ReportGenerator userCity={userCity} userCoords={userCoords} />
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
