import { Cloud, Sun, CloudRain, Wind, ThermometerSun } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';

const forecasts = [
  { day: 'Besok', temp: 32, icon: 'sun', label: 'Cerah' },
  { day: 'Rab', temp: 28, icon: 'cloud-rain', label: 'Hujan Ringan' },
  { day: 'Kam', temp: 30, icon: 'cloud', label: 'Berawan' },
  { day: 'Jum', temp: 31, icon: 'sun', label: 'Cerah' },
  { day: 'Sab', temp: 27, icon: 'cloud-rain', label: 'Hujan Petir' },
  { day: 'Min', temp: 29, icon: 'cloud', label: 'Berawan' },
];

const WeatherIcon = ({ type, size = 24, animated = true }: { type: string, size?: number, animated?: boolean }) => {
  const props = { size, className: "text-slate-700" };
  
  const iconWrapper = (child: ReactNode) => (
    <motion.div
      animate={animated ? { 
        rotate: type === 'sun' ? [0, 90, 180, 270, 360] : 0,
        y: type === 'cloud-rain' ? [0, 4, 0] : 0,
        scale: [1, 1.05, 1]
      } : {}}
      transition={{ 
        duration: type === 'sun' ? 10 : 2, 
        repeat: Infinity, 
        ease: "linear" 
      }}
    >
      {child}
    </motion.div>
  );

  switch (type) {
    case 'sun': return iconWrapper(<Sun {...props} className="text-orange-400" />);
    case 'cloud-rain': return iconWrapper(<CloudRain {...props} className="text-blue-400" />);
    case 'cloud': return iconWrapper(<Cloud {...props} className="text-slate-400" />);
    case 'wind': return iconWrapper(<Wind {...props} className="text-teal-400" />);
    default: return iconWrapper(<Sun {...props} />);
  }
};

export default function WeatherForecast({ darkMode = false, className = "p-6 md:p-7 flex flex-col gap-6" }: { darkMode?: boolean, className?: string }) {
  return (
    <div className={`w-full transition-all duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'} ${className}`} id="weather-forecast-container">
      <div className={`flex items-center justify-between border-b pb-4 transition-colors ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border shadow-sm shrink-0 transition-all duration-300 ${darkMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-950/5' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
            <ThermometerSun size={20} />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-[0.16em] leading-none mb-1">Local Feed</p>
            <h3 className={`text-xs sm:text-sm font-black tracking-tight leading-none uppercase transition-colors ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Forecast</h3>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-base sm:text-lg font-black tracking-tighter tabular-nums drop-shadow-sm leading-none block transition-colors ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>31°C</span>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Jakarta, ID</p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {forecasts.map((f, i) => (
          <div key={i} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-0.5 group ${
            darkMode 
              ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950 hover:shadow-slate-950/50' 
              : 'bg-slate-50/60 border-slate-100/70 hover:bg-white hover:shadow-slate-100/50'
          }`}>
            <span className="text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-wider group-hover:text-blue-500 transition-colors">{f.day}</span>
            <div className="mb-2">
              <WeatherIcon type={f.icon} size={20} />
            </div>
            <span className={`text-sm font-black leading-none transition-colors ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{f.temp}°</span>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl p-4.5 flex items-center justify-between text-white overflow-hidden relative group transition-all duration-300 ${darkMode ? 'bg-slate-950 border border-slate-800' : 'bg-slate-900'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="z-10 flex flex-col gap-0.5">
          <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.25em] leading-none mb-1">Live Status</p>
          <p className="text-sm font-bold tracking-tight">Cukup Berawan</p>
          <p className={`text-[9.5px] font-semibold leading-none mt-1 ${darkMode ? 'text-slate-400' : 'text-white/40'}`}>Lembap • Jarak pandang 12km</p>
        </div>
        <div className="relative z-10 opacity-30 group-hover:opacity-80 transition-all group-hover:scale-105">
          <Cloud size={40} />
        </div>
      </div>
    </div>
  );
}
