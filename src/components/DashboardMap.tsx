/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { 
  Activity, CloudSun, MapPin, Wind, Info, Plus, Minus, Compass, Layers, 
  AlertTriangle, X, HelpCircle, Check, Settings 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Google Maps official Air Quality API Heatmap Layer overlay
function AirQualityHeatmapLayer({ apiKey, enabled }: { apiKey: string; enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !apiKey || !enabled) return;

    const g = (window as any).google;
    if (!g || !g.maps) return;

    try {
      const layer = new g.maps.ImageMapType({
        getTileUrl: (coord: any, zoom: number) => {
          return `https://airquality.googleapis.com/v1/mapTypes/UAQI_INDIGO_PERSIAN/heatmapTiles/${zoom}/${coord.x}/${coord.y}?key=${apiKey}`;
        },
        tileSize: new g.maps.Size(256, 256),
        name: "AirQualityHeatmap",
        opacity: 0.55,
      });

      map.overlayMapTypes.push(layer);

      return () => {
        let foundIndex = -1;
        for (let i = 0; i < map.overlayMapTypes.getLength(); i++) {
          if (map.overlayMapTypes.getAt(i) === layer) {
            foundIndex = i;
            break;
          }
        }
        if (foundIndex !== -1) {
          map.overlayMapTypes.removeAt(foundIndex);
        }
      };
    } catch (e) {
      console.error("[DashboardMap] Failed to load Air Quality Heatmap overlay:", e);
    }
  }, [map, apiKey, enabled]);

  return null;
}

const API_KEY =
  (process.env as any).GOOGLE_MAPS_PLATFORM_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const isValidKey = (key: string): boolean => {
  if (!key) return false;
  const cleanKey = key.trim();
  if (cleanKey === '' || 
      cleanKey.toLowerCase() === 'undefined' || 
      cleanKey.toLowerCase() === 'null' ||
      cleanKey.includes('YOUR_') || 
      cleanKey.includes('PLACEHOLDER') ||
      cleanKey === 'AIzaSy'
  ) {
    return false;
  }
  return cleanKey.length > 5;
};

// Pre-defined locations around Jakarta to create a high-fidelity environment
const INITIAL_STATIONS = [
  { id: 'pusat', name: 'Stasiun Jakarta Pusat', lat: -6.1751, lng: 106.8272, aqi: 48, status: 'Baik' },
  { id: 'selatan', name: 'Stasiun Kuningan (Selatan)', lat: -6.2297, lng: 106.8159, aqi: 122, status: 'Tidak Sehat' },
  { id: 'barat', name: 'Stasiun Kebon Jeruk (Barat)', lat: -6.1683, lng: 106.7588, aqi: 68, status: 'Sedang' },
  { id: 'utara', name: 'Stasiun Ancol (Utara)', lat: -6.1261, lng: 106.8416, aqi: 82, status: 'Sedang' },
  { id: 'timur', name: 'Stasiun Halim (Timur)', lat: -6.2588, lng: 106.8833, aqi: 96, status: 'Sedang' }
];

const LANDMARKS = [
  { name: 'Monumen Nasional (Monas)', lat: -6.1754, lng: 106.8272 },
  { name: 'Bundaran HI', lat: -6.1950, lng: 106.8231 },
  { name: 'Gelora Bung Karno', lat: -6.2183, lng: 106.8018 },
  { name: 'Sarinah', lat: -6.1882, lng: 106.8241 },
  { name: 'Sudirman Boulevard', lat: -6.2120, lng: 106.8160 },
  { name: 'Kota Tua Historic', lat: -6.1376, lng: 106.8144 },
  { name: 'Halim Airport Zone', lat: -6.2650, lng: 106.8900 },
  { name: 'Taman Impian Ancol', lat: -6.1180, lng: 106.8300 }
];

const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#F1F5F9" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748B" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F8FAFC" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#E2E8F0" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#CBD5E1" }] }
];

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0B0F19" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0F19" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#111827" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1E293B" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#030712" }] }
];

export default function DashboardMap({ 
  darkMode = false, 
  userCoords, 
  userCity 
}: { 
  darkMode?: boolean;
  userCoords?: { lat: number; lng: number } | null;
  userCity?: string;
}) {
  const defaultCenter = { lat: -6.1850, lng: 106.8250 };
  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [selectedStation, setSelectedStation] = useState<typeof INITIAL_STATIONS[0] | null>(INITIAL_STATIONS[0]);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(11.5);
  const [showStations, setShowStations] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Error recovery & simulation states
  const hasKey = isValidKey(API_KEY);
  const [useSimulation, setUseSimulation] = useState(!hasKey);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showKeyInstructions, setShowKeyInstructions] = useState(false);
  const [simulationAlertDismissed, setSimulationAlertDismissed] = useState(false);

  // Drag-to-pan implementation for Simulation Map
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Intercept global uncaught script errors specifically targeting Google Maps script load blockages
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent | Event) => {
      const msg = (event as any).message || '';
      const src = (event as any).filename || '';
      if (
        msg.toLowerCase().includes('google') ||
        msg.toLowerCase().includes('maps') ||
        msg.toLowerCase().includes('quota') ||
        msg.toLowerCase().includes('script error') ||
        src.includes('maps.googleapis.com')
      ) {
        console.warn("[DashboardMap] Intercepted Maps Quota or Script Blockage, auto-recovering silently to Simulation Matrix...");
        setQuotaExceeded(true);
        setUseSimulation(true);
      }
    };

    window.addEventListener('error', handleGlobalError, true);
    return () => window.removeEventListener('error', handleGlobalError, true);
  }, []);

  // Adjust stations dynamically when user location is detected
  useEffect(() => {
    if (userCoords) {
      setCenter(userCoords);
      setZoom(12);
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

  // Simulate real-time sensor updates/fluctuations to make the map markers alive
  useEffect(() => {
    const interval = setInterval(() => {
      setStations(prev =>
        prev.map(station => {
          // Subtle variance of +/- 1 or 2
          const variance = Math.floor(Math.random() * 5) - 2;
          const updatedAqi = Math.max(15, Math.min(250, station.aqi + variance));
          
          let status = 'Sedang';
          if (updatedAqi <= 50) status = 'Baik';
          else if (updatedAqi <= 100) status = 'Sedang';
          else status = 'Tidak Sehat';

          return { ...station, aqi: updatedAqi, status };
        })
      );
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Update selected station values if stations array updates
  useEffect(() => {
    if (selectedStation) {
      const current = stations.find(s => s.id === selectedStation.id);
      if (current) {
        setSelectedStation(current);
      }
    }
  }, [stations, selectedStation?.id]);

  // Color helper based on AQI to match pulses
  const getStationColor = (aqi: number) => {
    if (aqi <= 50) return { ring: 'bg-emerald-500/35 ring-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-500', statusColor: 'bg-emerald-100 text-emerald-800' };
    if (aqi <= 100) return { ring: 'bg-amber-500/35 ring-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-500', statusColor: 'bg-amber-100 text-amber-800' };
    return { ring: 'bg-rose-500/35 ring-rose-500/20', dot: 'bg-rose-500', text: 'text-rose-500', statusColor: 'bg-rose-100 text-rose-800' };
  };

  // Convert real geographic Lat/Lng coords into local CSS positioning relative to current center & zoom level
  const getRelativePosition = (lat: number, lng: number) => {
    const latDiff = lat - center.lat;
    const lngDiff = lng - center.lng;
    
    // Dynamic math grid scale factor mapping
    const scale = Math.pow(2, zoom - 11.5) * 4500;
    
    return {
      x: 50 + (lngDiff * scale),
      y: 50 - (latDiff * 1.05 * scale) // Minor Mercator height projection multiplier
    };
  };

  // Pan functions with custom mouse boundary limits
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!useSimulation) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !useSimulation) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const scale = Math.pow(2, zoom - 11.5) * 450000;
    const latChange = dy / scale;
    const lngChange = -dx / scale;

    setCenter(prev => ({
      lat: Math.max(-6.5, Math.min(-5.9, prev.lat + latChange)),
      lng: Math.max(106.5, Math.min(107.2, prev.lng + lngChange))
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && useSimulation) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1 || !useSimulation) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;

    const scale = Math.pow(2, zoom - 11.5) * 450000;
    const latChange = dy / scale;
    const lngChange = -dx / scale;

    setCenter(prev => ({
      lat: Math.max(-6.5, Math.min(-5.9, prev.lat + latChange)),
      lng: Math.max(106.5, Math.min(107.2, prev.lng + lngChange))
    }));

    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const toggleManualMode = (targetSim: boolean) => {
    if (!targetSim && !hasKey) {
      setShowKeyInstructions(true);
      return;
    }
    setUseSimulation(targetSim);
  };


  return (
    <div 
      ref={mapContainerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      className={`w-full h-full relative overflow-hidden select-none transition-all duration-300 ${
        useSimulation ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      id="pollution-map-container"
    >
      {useSimulation ? (
        /* SENSATIONAL HIGH-FIDELITY SIMULATION MAP CANVAS */
        <div className={`w-full h-full relative flex items-center justify-center transition-colors duration-300 overflow-hidden ${
          darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-[#f1f5f9] text-slate-800'
        }`}>
          {/* Subtle Grid backdrop */}
          <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.1]" 
               style={{ 
                 backgroundImage: `radial-gradient(circle, ${darkMode ? '#38bdf8' : '#3b82f6'} 1.5px, transparent 1.5px)`, 
                 backgroundSize: '24px 24px' 
               }} 
          />
          
          {/* Radial concentric rings centered at screen */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-[300px] h-[300px] rounded-full border border-dashed border-blue-500/10 dark:border-blue-400/5 animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="w-[600px] h-[600px] rounded-full border border-dashed border-blue-500/10 dark:border-blue-400/5 animate-pulse" style={{ animationDuration: '10s' }} />
            <div className="w-[900px] h-[900px] rounded-full border border-dashed border-blue-500/10 dark:border-blue-400/5" />
          </div>

          {/* Radar sweeping scan line */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] dark:opacity-[0.1]">
            <div className="w-[800px] h-[800px] bg-gradient-to-tr from-blue-500/50 via-transparent to-transparent rounded-full animate-[spin_12s_linear_infinite]" />
          </div>

          {/* Heatmap Layer Simulation */}
          {showHeatmap && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-multiply dark:mix-blend-screen opacity-70">
              {stations.map(station => {
                const pos = getRelativePosition(station.lat, station.lng);
                if (pos.x < -20 || pos.x > 120 || pos.y < -20 || pos.y > 120) return null;
                
                let rgba = "16, 185, 129"; // Green (emerald-500)
                if (station.aqi > 50 && station.aqi <= 100) {
                  rgba = "245, 158, 11"; // Yellow (amber-500)
                } else if (station.aqi > 100) {
                  rgba = "244, 63, 94"; // Red/Orange (rose-500)
                }
                
                const baseSize = station.aqi * 1.8 + 120;
                const size = baseSize * Math.pow(2, (zoom - 11.5) / 2);

                return (
                  <div
                    key={`heatmap-cloud-${station.id}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full filter blur-2xl transition-all duration-305 ease-out"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundImage: `radial-gradient(circle, rgba(${rgba}, 0.35) 0%, rgba(${rgba}, 0.08) 50%, transparent 100%)`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Landmarks Layer */}
          {LANDMARKS.map((landmark, idx) => {
            const pos = getRelativePosition(landmark.lat, landmark.lng);
            if (pos.x < -10 || pos.x > 110 || pos.y < -10 || pos.y > 110) return null;
            return (
              <div 
                key={`landmark-${idx}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none select-none transition-all duration-150 ease-out"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 opacity-60" />
                <span className="mt-1 text-[8.5px] font-mono font-medium text-slate-400/80 dark:text-slate-500/80 tracking-widest uppercase whitespace-nowrap animate-pulse">
                  {landmark.name}
                </span>
              </div>
            );
          })}

          {/* User Location Tracker Pin */}
          {userCoords && (() => {
            const pos = getRelativePosition(userCoords.lat, userCoords.lng);
            if (pos.x < -5 || pos.x > 105 || pos.y < -5 || pos.y > 105) return null;
            return (
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-150 ease-out z-20"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="absolute w-24 h-24 rounded-full border border-blue-500/20 bg-blue-500/5 animate-pulse" />
                <div className="absolute w-12 h-12 rounded-full border border-blue-500/30 bg-blue-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                
                <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center ring-4 ring-blue-500/30">
                  <MapPin className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="absolute mt-12 text-[8px] font-black tracking-widest text-blue-500 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 backdrop-blur-md">
                  GPS PINNED
                </span>
              </div>
            );
          })()}

          {/* Simulated Stations Layer */}
          {showStations && stations.map(station => {
            const pos = getRelativePosition(station.lat, station.lng);
            if (pos.x < -10 || pos.x > 110 || pos.y < -10 || pos.y > 110) return null;

            const colors = getStationColor(station.aqi);
            const isSelected = selectedStation?.id === station.id;

            return (
              <div
                key={`sim-station-${station.id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-150 ease-out cursor-pointer"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={() => setSelectedStation(station)}
              >
                <div className="relative flex flex-col items-center group/marker transform hover:scale-110 active:scale-95 transition-all duration-300">
                  
                  {isSelected && (
                    <>
                      <div className={`absolute w-16 h-16 rounded-full ${colors.ring} animate-ping opacity-60 pointer-events-none`} style={{ animationDuration: '2.4s' }} />
                      <div className={`absolute w-12 h-12 rounded-full ${colors.ring} animate-ping opacity-45 pointer-events-none`} style={{ animationDuration: '1.6s' }} />
                      <div className={`absolute w-8 h-8 rounded-full ${colors.ring} animate-ping opacity-30 pointer-events-none`} style={{ animationDuration: '0.8s' }} />
                    </>
                  )}

                  <div className={`absolute w-10 h-10 rounded-full ${colors.ring} animate-ping opacity-60 pointer-events-none`} />

                  <div className={`relative w-4.5 h-4.5 rounded-full ${colors.dot} border-2 border-white shadow-lg flex items-center justify-center z-10 transition-transform duration-300 ${isSelected ? 'scale-125 ring-4 ring-blue-500/30' : ''}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>

                  <div className={`mt-1.5 px-2 py-0.5 rounded-full shadow-md border text-[8.5px] font-extrabold flex items-center gap-1 z-20 backdrop-blur-md transition-all duration-300 ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-500 text-white translate-y-[-2px]' 
                      : darkMode 
                        ? 'bg-slate-900/90 border-slate-700/80 text-slate-200' 
                        : 'bg-white/95 border-slate-100 text-slate-700'
                  }`}>
                    <span>AQI</span>
                    <span className={isSelected ? 'text-white' : colors.text}>{station.aqi}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1 items-start leading-none select-none">
            <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Grid Visualisasi Virtual</span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-550">
              {center.lat.toFixed(4)}°S , {center.lng.toFixed(4)}°E (Zoom {zoom.toFixed(1)})
            </span>
          </div>
        </div>
      ) : (
        /* GOOGLE MAPS ACTIVE MODE */
        <APIProvider apiKey={API_KEY}>
          <Map
            center={center}
            zoom={zoom}
            onCameraChanged={(ev) => {
              setCenter(ev.detail.center);
              setZoom(ev.detail.zoom);
            }}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={'aeroscan-pollution-map'}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            options={{
              styles: darkMode ? darkMapStyle : lightMapStyle,
              disableDefaultUI: true,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >
            {/* Google official Air Quality API Heatmap layer */}
            <AirQualityHeatmapLayer apiKey={API_KEY} enabled={showHeatmap} />

            {showStations ? (
              stations.map(station => {
                const colors = getStationColor(station.aqi);
                const isSelected = selectedStation?.id === station.id;

                return (
                  <AdvancedMarker
                    key={station.id}
                    position={{ lat: station.lat, lng: station.lng }}
                    onClick={() => setSelectedStation(station)}
                  >
                    {/* Advanced Live Animated Marker */}
                    <div className="relative flex flex-col items-center cursor-pointer group/marker transform hover:scale-110 active:scale-95 transition-all duration-300">
                      
                      {/* Concentric Pulsing Radar Circles for Live Sync Loop */}
                      {isSelected && (
                        <>
                          <div className={`absolute w-16 h-16 rounded-full ${colors.ring} animate-ping opacity-60 pointer-events-none`} style={{ animationDuration: '2.4s' }} />
                          <div className={`absolute w-12 h-12 rounded-full ${colors.ring} animate-ping opacity-45 pointer-events-none`} style={{ animationDuration: '1.6s' }} />
                          <div className={`absolute w-8 h-8 rounded-full ${colors.ring} animate-ping opacity-30 pointer-events-none`} style={{ animationDuration: '0.8s' }} />
                        </>
                      )}

                      {/* Real-time Indicator Wave / Glow Background */}
                      <div className={`absolute w-10 h-10 rounded-full ${colors.ring} animate-ping opacity-60 pointer-events-none`} />

                      {/* Marker Circle Inner Point */}
                      <div className={`relative w-4.5 h-4.5 rounded-full ${colors.dot} border-2 border-white shadow-lg flex items-center justify-center z-10 transition-transform duration-300 ${isSelected ? 'scale-125 ring-4 ring-blue-500/30' : ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </div>

                      {/* Bubble showing value above the marker */}
                      <div className={`mt-1.5 px-2 py-0.5 rounded-full shadow-md border text-[8.5px] font-extrabold flex items-center gap-1 z-20 backdrop-blur-md transition-all duration-300 ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-500 text-white translate-y-[-2px]' 
                          : darkMode 
                            ? 'bg-slate-900/90 border-slate-700/80 text-slate-200' 
                            : 'bg-white/95 border-slate-100 text-slate-700'
                      }`}>
                        <span>AQI</span>
                        <span className={isSelected ? 'text-white' : colors.text}>{station.aqi}</span>
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })
            ) : (
              /* Clean focus marker representing the pinned GPS coordinate */
              <AdvancedMarker position={center}>
                <div className="relative flex flex-col items-center">
                  <div className="absolute w-12 h-12 bg-blue-500/25 rounded-full animate-ping pointer-events-none" />
                  <div className="relative w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-xl flex items-center justify-center z-10">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>
      )}

      {/* Floating Map Utility Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <button
          onClick={() => setZoom(prev => Math.min(18, prev + 1))}
          className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xl ${
            darkMode 
              ? 'bg-slate-950/90 hover:bg-slate-905 border-slate-800 text-slate-200 shadow-slate-950/50' 
              : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-700 shadow-slate-200/30'
          }`}
          title="Zoom Masuk"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(4, prev - 1))}
          className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xl ${
            darkMode 
              ? 'bg-slate-950/90 hover:bg-slate-905 border-slate-800 text-slate-200 shadow-slate-950/50' 
              : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-700 shadow-slate-200/30'
          }`}
          title="Zoom Keluar"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => {
            if (userCoords) {
              setCenter(userCoords);
              setZoom(13.5);
            } else {
              setCenter(defaultCenter);
              setZoom(11.5);
            }
          }}
          className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xl ${
            darkMode 
              ? 'bg-slate-950/90 hover:bg-slate-905 border-slate-800 text-slate-200 shadow-slate-950/50' 
              : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-700 shadow-slate-200/30'
          }`}
          title="Pusatkan Lokasi"
        >
          <Compass size={14} className={userCoords ? 'text-blue-500' : 'text-slate-500'} />
        </button>
        <button
          onClick={() => setShowStations(prev => !prev)}
          className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center transition-all duration-205 active:scale-93 shadow-xl ${
            showStations
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700'
              : darkMode 
                ? 'bg-slate-950/90 hover:bg-slate-900 border-slate-800 text-slate-200 shadow-slate-950/50' 
                : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-700 shadow-slate-200/30'
          }`}
          title={showStations ? "Sembunyikan Stasiun AQI" : "Tampilkan Stasiun AQI"}
        >
          <Layers size={14} />
        </button>
        <button
          onClick={() => setShowHeatmap(prev => !prev)}
          className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center transition-all duration-205 active:scale-93 shadow-xl ${
            showHeatmap
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700'
              : darkMode 
                ? 'bg-slate-950/90 hover:bg-slate-900 border-slate-800 text-slate-200 shadow-slate-950/50' 
                : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-700 shadow-slate-200/30'
          }`}
          title={showHeatmap ? "Sembunyikan Peta Polusi (Heatmap)" : "Tampilkan Peta Polusi (Heatmap)"}
        >
          <Activity size={14} />
        </button>
      </div>

      {/* Simulation Warning Notification and Instruction Panel Overlay */}
      {useSimulation && (
        <AnimatePresence>
          {!simulationAlertDismissed ? (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute left-4 right-4 top-4 md:left-6 md:top-6 md:max-w-[440px] max-h-[85%] overflow-y-auto rounded-2xl border backdrop-blur-md shadow-2xl p-4 z-40 transition-all flex flex-col gap-3.5 bg-amber-500/10 border-amber-500/30 dark:bg-amber-955/20 text-slate-800 dark:text-slate-100"
            >
              {/* Alert Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2.5 items-center">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 select-none">
                    <AlertTriangle size={18} className="animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 leading-none">
                      <h4 className="font-extrabold text-[13px] text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                        Mode Simulasi Aktif
                      </h4>
                      <span className="px-1.2 py-0.4 rounded text-[7.5px] font-black tracking-wider uppercase bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 select-none animate-pulse">
                        Virtual Mode
                      </span>
                    </div>
                    <p className="text-[9px] font-black text-amber-600 dark:text-amber-450 mt-1 uppercase tracking-wider leading-none">
                      API Key Belum Dikonfigurasi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSimulationAlertDismissed(true)}
                  className="w-6 h-6 rounded-lg border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition"
                  title="Sembunyikan pesan"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Alert Explanation Body */}
              <div className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-sans flex flex-col gap-2">
                <p>
                  Sistem otomatis beralih menggunakan <strong className="text-slate-800 dark:text-slate-100 font-bold">mesin pemetaan virtual interaktif</strong> karena kunci layanan Google Maps tidak ditemukan di berkas environment lokal atau telah melebihi kuota pemakaian.
                </p>
                <div className="p-2.5 rounded-lg bg-white/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 flex flex-col gap-1.5 font-sans">
                  <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none">Batasan & Keuntungan:</span>
                  <div className="flex items-start gap-1.5 text-[10px]">
                    <span className="text-amber-500 font-black leading-none">•</span>
                    <span>Stasiun pemantau AQI diposisikan secara dinamis menggunakan model virtual real-time.</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[10px]">
                    <span className="text-amber-500 font-black leading-none">•</span>
                    <span>Anda tetap dapat melakukan seret-peta (drag to pan) serta pembesaran (zoom) grid.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-1.5 border-t pt-3 border-slate-100 dark:border-slate-805 transition-colors">
                <button
                  onClick={() => setShowKeyInstructions(prev => !prev)}
                  className="flex items-center gap-1 text-[9.5px] font-bold uppercase text-blue-600 dark:text-blue-400 hover:underline transition"
                >
                  <HelpCircle size={11} />
                  {showKeyInstructions ? "Sembunyikan Instruksi" : "Cara Pasang API Key"}
                </button>
                <button
                  onClick={() => setSimulationAlertDismissed(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 border border-amber-600/10 text-white font-extrabold text-[10.5px] shadow-sm select-none active:scale-95 transition-all duration-150 cursor-pointer"
                >
                  Eksplorasi Simulasi
                </button>
              </div>

              {/* Environment Key Instructions Block */}
              {showKeyInstructions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t pt-3 border-dashed border-slate-150 dark:border-slate-800 flex flex-col gap-2"
                >
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 select-none">Langkah Mudah Konfigurasi:</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Agar dapat memuat peta geografis Google Maps asli, silakan isi environment variable <code className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-xs font-mono">VITE_GOOGLE_MAPS_API_KEY</code> di berkas <code className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-xs font-mono">.env.example</code> atau <code className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-xs font-mono">.env</code>:
                  </p>
                  <pre className="p-2 rounded bg-slate-950 text-slate-200 font-mono text-[9px] select-all border border-slate-800 leading-normal overflow-x-auto">
                    VITE_GOOGLE_MAPS_API_KEY=KUNCI_API_ANDA
                  </pre>
                  <p className="text-[9px] italic text-slate-450 dark:text-slate-500 font-sans leading-none">
                    *Muat ulang browser Anda setelah menyimpan berkas environment.
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Pulsing Micro-Badge when Minimized */
            <motion.button
              key="sim-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSimulationAlertDismissed(false)}
              className={`absolute top-4 left-4 z-40 px-3 py-1.5 rounded-full border shadow-xl flex items-center gap-1.5 transition-all cursor-pointer font-sans active:scale-95 ${
                darkMode 
                  ? 'bg-amber-950/90 border-amber-800/60 text-amber-300 hover:bg-amber-900 shadow-slate-950/60' 
                  : 'bg-amber-500 border-amber-600/30 text-white hover:bg-amber-600 shadow-slate-200/50'
              }`}
              title="Perlihatkan Detail Simulasi"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-300 animate-ping shrink-0" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-300 absolute left-[15px] shrink-0 font-sans" />
              <span className="text-[8.5px] font-extrabold uppercase tracking-wider">
                Mode Simulasi Aktif
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {/* Floating Station Info Pane & Global Air Quality State */}
      {showStations && (
        <div className={`absolute bottom-4 right-4 md:bottom-5 md:right-5 w-76 max-w-[calc(100%-2rem)] flex flex-col gap-2.5 p-3.5 rounded-[22px] border shadow-2xl transition-all duration-300 backdrop-blur-md z-20 ${
          darkMode 
            ? 'bg-slate-950/90 border-slate-800 text-slate-100/95 shadow-slate-950/50' 
            : 'bg-white/90 border-slate-200/50 text-slate-900 shadow-slate-200/40'
        }`}>
          {/* Top Header Row with status */}
          <div className="flex items-center justify-between gap-2 border-b pb-2 transition-colors border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <Wind size={14} className="animate-pulse" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white dark:border-slate-950 ring-1 ring-emerald-500/20 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Sensor Aktivitas</span>
                  <span className="text-[7px] font-black uppercase text-blue-500 px-1.5 py-0.2 bg-blue-500/10 rounded border border-blue-500/20 select-none animate-pulse">Live</span>
                </div>
                <p className="text-[11px] font-black tracking-tight leading-tight mt-0.5 truncate max-w-[130px]" title={selectedStation?.name}>
                  {selectedStation ? selectedStation.name : 'Jakarta Core'}
                </p>
              </div>
            </div>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border select-none ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-500'
            }`}>
              ID
            </span>
          </div>

          {/* Center AQI and Air category */}
          <div className="flex items-center justify-between py-0.5">
            <div className="flex flex-col">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider leading-none">Kualitas Udara</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`w-2 h-2 rounded-full ${getStationColor(selectedStation?.aqi || 50).dot} animate-pulse`} />
                <span className={`text-[11px] font-extrabold leading-none ${getStationColor(selectedStation?.aqi || 50).text}`}>
                  {selectedStation?.status || '--'}
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className={`text-2xl font-black tracking-tighter leading-none ${getStationColor(selectedStation?.aqi || 50).text}`}>
                {selectedStation?.aqi || '--'}
              </span>
              <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest leading-none font-mono">AQI</span>
            </div>
          </div>

          {/* Bottom Switch button controls */}
          <div className="flex items-center justify-between border-t pt-2 border-slate-100 dark:border-slate-800">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest select-none">Stasiun</span>
            <div className="flex gap-1">
              {stations.map(station => (
                <button
                  key={station.id}
                  onClick={() => setSelectedStation(station)}
                  className={`w-6 h-6 rounded-md text-[8.5px] font-black transition-all duration-200 border flex items-center justify-center ${
                    selectedStation?.id === station.id
                      ? 'bg-blue-600 border-blue-500 text-white scale-105 shadow-md shadow-blue-500/20'
                      : darkMode
                        ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400'
                        : 'bg-white border-slate-200/60 hover:bg-slate-50 text-slate-500'
                  }`}
                  title={station.name}
                >
                  {station.id.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
