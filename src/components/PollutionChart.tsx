import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, BarChart2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, darkMode }: any) => {
  if (active && payload && payload.length) {
    const pmValues = payload.find((p: any) => p.dataKey === 'pm25')?.value;
    const aqiValues = payload.find((p: any) => p.dataKey === 'aqi')?.value;
    return (
      <div className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md flex flex-col gap-2 transition-all duration-200 ${
        darkMode 
          ? 'bg-slate-950/90 border-slate-800 text-slate-100 shadow-slate-950/80' 
          : 'bg-white/95 border-slate-100 text-slate-900 shadow-slate-200/50'
      }`}>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{label}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-xs font-bold opacity-80">PM2.5:</span>
            <span className="text-xs font-black">{pmValues} µg/m³</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
            <span className="text-xs font-bold opacity-80">AQI Index:</span>
            <span className="text-xs font-black text-orange-500 dark:text-orange-400">{aqiValues}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};export default function PollutionChart({ darkMode = false, userCity = "Jakarta" }: { darkMode?: boolean; userCity?: string }) {
  const chartData = useMemo(() => {
    const result = [];
    const today = new Date();
    const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    const basePatterns: Record<string, { pm25: number; pm10: number; aqi: number }> = {
      'Senin': { pm25: 12, pm10: 18, aqi: 45 },
      'Selasa': { pm25: 15, pm10: 22, aqi: 52 },
      'Rabu': { pm25: 10, pm10: 15, aqi: 38 },
      'Kamis': { pm25: 25, pm10: 35, aqi: 75 },
      'Jumat': { pm25: 18, pm10: 28, aqi: 62 },
      'Sabtu': { pm25: 14, pm10: 21, aqi: 48 },
      'Minggu': { pm25: 11, pm10: 17, aqi: 42 },
    };

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = INDO_DAYS[d.getDay()];
      const pattern = basePatterns[dayName] || { pm25: 15, pm10: 20, aqi: 50 };
      
      result.push({
        day: i === 0 ? `${dayName} (Hari Ini)` : dayName,
        pm25: pattern.pm25,
        pm10: pattern.pm10,
        aqi: pattern.aqi
      });
    }
    return result;
  }, []);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeData = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div className={`w-full transition-all duration-300 p-8 md:p-12 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`} id="historical-chart-container">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg mb-3 border transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
            <Activity size={10} className="text-blue-500" />
            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Interactive Analytics</span>
          </div>
          <h3 className={`text-base sm:text-lg font-black tracking-tight leading-none mb-2 transition-colors ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Tren Polusi Udara Mingguan</h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm leading-relaxed">
            Arahkan kursor pada grafik untuk memantau fluktuasi polutan harian secara interaktif di wilayah <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{userCity}</strong>.
          </p>
        </div>

        {/* Dynamic Interactive Panel values based on hover state */}
        <div className="flex gap-4 items-center">
          {activeData ? (
            <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all duration-300 ${
              darkMode ? 'bg-blue-950/20 border-blue-900/40' : 'bg-blue-50 border-blue-105'
            }`}>
              <BarChart2 size={16} className="text-blue-500 animate-pulse" />
              <div className="flex gap-6">
                <div>
                  <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block mb-0.5">{activeData.day}</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-sm font-black transition-colors ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{activeData.pm25}</span>
                    <span className="text-[9px] font-bold text-slate-450">µg/m³</span>
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-800 self-center" />
                <div>
                  <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block mb-0.5">AQI</span>
                  <span className="text-sm font-black text-orange-500 dark:text-orange-400">{activeData.aqi}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex gap-8 items-center px-6 py-4 rounded-2xl border transition-colors ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary</span>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className={`text-xs font-bold transition-colors ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>PM2.5</span>
                </div>
              </div>
              <div className={`w-px h-6 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secondary</span>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                  <span className={`text-xs font-bold transition-colors ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>AQI Index</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-[295px] w-full pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            margin={{ top: 15, right: 15, left: -15, bottom: 25 }}
            onMouseMove={(state: any) => {
              if (state && typeof state.activeTooltipIndex === 'number') {
                setHoveredIndex(state.activeTooltipIndex);
              } else {
                setHoveredIndex(null);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="colorPm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={darkMode ? '#1e293b' : '#E2E8F0'} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              height={45}
              tick={{ fontSize: 10, fontWeight: 705, fill: '#94a3b8' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 705, fill: '#94a3b8' }}
            />
            <Tooltip 
              content={<CustomTooltip darkMode={darkMode} />}
              cursor={{ stroke: darkMode ? '#334155' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="pm25" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorPm)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
              animationDuration={2000}
            />
            <Area 
              type="monotone" 
              dataKey="aqi" 
              stroke="#fb923c" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorAqi)" 
              strokeDasharray="5 5"
              activeDot={{ r: 6, strokeWidth: 0, fill: '#fb923c' }}
              animationDuration={2500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
