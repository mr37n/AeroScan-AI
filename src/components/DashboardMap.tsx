/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Activity, CloudSun, MapPin, Wind, Info, Plus, Minus, Compass } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Pre-defined locations around Jakarta to create a high-fidelity environment
const INITIAL_STATIONS = [
  { id: 'pusat', name: 'Stasiun Jakarta Pusat', lat: -6.1751, lng: 106.8272, aqi: 48, status: 'Baik' },
  { id: 'selatan', name: 'Stasiun Kuningan (Selatan)', lat: -6.2297, lng: 106.8159, aqi: 122, status: 'Tidak Sehat' },
  { id: 'barat', name: 'Stasiun Kebon Jeruk (Barat)', lat: -6.1683, lng: 106.7588, aqi: 68, status: 'Sedang' },
  { id: 'utara', name: 'Stasiun Ancol (Utara)', lat: -6.1261, lng: 106.8416, aqi: 82, status: 'Sedang' },
  { id: 'timur', name: 'Stasiun Halim (Timur)', lat: -6.2588, lng: 106.8833, aqi: 96, status: 'Sedang' }
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

  if (!API_KEY) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
        <div className={`p-4 rounded-xl shadow-sm mb-4 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Maps API Key Required</p>
        </div>
        <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
          Set VITE_GOOGLE_MAPS_API_KEY in secrets to view interactive real-time telemetry.
        </p>
      </div>
    );
  }

  // Color helper based on AQI to match pulses
  const getStationColor = (aqi: number) => {
    if (aqi <= 50) return { ring: 'bg-emerald-500/35 ring-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-500', statusColor: 'bg-emerald-100 text-emerald-800' };
    if (aqi <= 100) return { ring: 'bg-amber-500/35 ring-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-500', statusColor: 'bg-amber-100 text-amber-800' };
    return { ring: 'bg-rose-500/35 ring-rose-500/20', dot: 'bg-rose-500', text: 'text-rose-500', statusColor: 'bg-rose-100 text-rose-800' };
  };

  return (
    <div className="w-full h-full relative group" id="pollution-map-container">
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
          options={{
            styles: darkMode ? darkMapStyle : lightMapStyle,
            disableDefaultUI: true,
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          {stations.map(station => {
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
          })}
        </Map>
      </APIProvider>

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
      </div>

      {/* Floating Station Info Pane & Global Air Quality State */}
      <div className={`absolute bottom-4 right-4 md:bottom-5 md:right-5 w-76 max-w-[calc(100%-2rem)] flex flex-col gap-2.5 p-3.5 rounded-[22px] border shadow-2xl transition-all duration-300 backdrop-blur-xl z-20 ${
        darkMode 
          ? 'bg-slate-950/90 border-slate-800 text-slate-100 shadow-slate-950/50' 
          : 'bg-white/95 border-slate-200/50 text-slate-900 shadow-slate-200/40'
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
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Sensor Aktif</span>
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
            <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest leading-none">AQI</span>
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
    </div>
  );
}
