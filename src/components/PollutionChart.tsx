import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

const data = [
  { day: 'Mon', pm25: 12, pm10: 18, aqi: 45 },
  { day: 'Tue', pm25: 15, pm10: 22, aqi: 52 },
  { day: 'Wed', pm25: 10, pm10: 15, aqi: 38 },
  { day: 'Thu', pm25: 25, pm10: 35, aqi: 75 },
  { day: 'Fri', pm25: 18, pm10: 28, aqi: 62 },
  { day: 'Sat', pm25: 14, pm10: 21, aqi: 48 },
  { day: 'Sun', pm25: 11, pm10: 17, aqi: 42 },
];

export default function PollutionChart({ darkMode = false, userCity = "Jakarta" }: { darkMode?: boolean; userCity?: string }) {
  return (
    <div className={`w-full transition-all duration-300 p-8 md:p-12 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`} id="historical-chart-container">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg mb-3 border transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
            <Activity size={10} className="text-blue-500" />
            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Analytics Dashboard</span>
          </div>
          <h3 className={`text-base sm:text-lg font-black tracking-tight leading-none mb-2 transition-colors ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Tren Polusi Udara Mingguan</h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm">
            Visualisasi data PM2.5 dan Indeks AQI selama 7 hari terakhir di wilayah <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{userCity}</strong> berdasarkan pemindaian satelit dan kamera.
          </p>
        </div>
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
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '20px', 
                border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0', 
                backgroundColor: darkMode ? '#0f172a' : '#FFFFFF',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                padding: '12px 16px'
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: darkMode ? '#e2e8f0' : '#1e293b' }}
              labelStyle={{ fontSize: '10px', fontWeight: 900, marginBottom: '4px', color: '#94a3b8' }}
            />
            <Area 
              type="monotone" 
              dataKey="pm25" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorPm)" 
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
              animationDuration={2500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
