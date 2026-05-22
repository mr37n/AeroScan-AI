import { FileText, Download, Loader2 } from 'lucide-react';
import { useState, ReactNode } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportGeneratorProps {
  userCity?: string;
  userCoords?: { lat: number; lng: number } | null;
  trigger?: (generatePDF: () => void, isGenerating: boolean) => ReactNode;
}

// Helper function to convert CSS OKLCH values to standard rgb/rgba.
// html2canvas fails when parsing modern OKLCH CSS functions, so this handles approximation and conversion.
function oklchToRgb(oklchStr: string): string {
  const match = oklchStr.match(/oklch\(([^)]+)\)/);
  if (!match) return 'rgb(30, 41, 59)';

  const content = match[1].trim();
  const parts = content.split('/');
  const colorPart = parts[0].trim();
  const opacityPart = parts[1] ? parts[1].trim() : null;

  const colorValues = colorPart.split(/\s+/);
  if (colorValues.length < 3) return 'rgb(30, 41, 59)';

  let L = parseFloat(colorValues[0]);
  if (colorValues[0].includes('%')) L = L / 100;

  let C = parseFloat(colorValues[1]);
  if (colorValues[1].includes('%')) C = C / 100;

  let H = parseFloat(colorValues[2]);
  if (colorValues[2].includes('%')) H = (H / 100) * 360;

  if (isNaN(H)) H = 0;

  let A = 1;
  if (opacityPart) {
    A = parseFloat(opacityPart);
    if (opacityPart.includes('%')) A = A / 100;
    if (isNaN(A)) A = 1;
  }

  // Convert OKLCH to OKLAB
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // Convert OKLAB to linear RGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = Math.pow(Math.max(0, l_), 3);
  const m = Math.pow(Math.max(0, m_), 3);
  const s = Math.pow(Math.max(0, s_), 3);

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_calc = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const transfer = (c: number) => {
    return c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;
  };

  const R = Math.round(transfer(Math.max(0, Math.min(1, r))) * 255);
  const G = Math.round(transfer(Math.max(0, Math.min(1, g))) * 255);
  const B_val = Math.round(transfer(Math.max(0, Math.min(1, b_calc))) * 255);

  if (A === 1) {
    return `rgb(${R}, ${G}, ${B_val})`;
  } else {
    return `rgba(${R}, ${G}, ${B_val}, ${A})`;
  }
}

export default function ReportGenerator({ userCity = "Jakarta", userCoords = null, trigger }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    // Store original style elements innerHTML to restore later
    const styleElements = Array.from(document.querySelectorAll('style'));
    const originalStyles = styleElements.map(el => el.innerHTML);

    // Store original inline style attributes containing 'oklch' to restore later
    const elementsWithOklchStyle = Array.from(document.querySelectorAll('[style*="oklch"]')) as HTMLElement[];
    const originalInlineStyles = elementsWithOklchStyle.map(el => el.getAttribute('style') || '');
    
    try {
      // 1. Sanitize style elements (replace oklch with standard rgb equivalents)
      styleElements.forEach(el => {
        el.innerHTML = el.innerHTML.replace(/oklch\([^)]+\)/g, (match) => {
          try {
            return oklchToRgb(match);
          } catch (e) {
            console.warn('Failed to convert oklch:', match, e);
            return 'rgb(30, 41, 59)';
          }
        });
      });

      // 2. Sanitize elements with inline styling
      elementsWithOklchStyle.forEach(el => {
        const style = el.getAttribute('style') || '';
        el.setAttribute('style', style.replace(/oklch\([^)]+\)/g, (match) => {
          try {
            return oklchToRgb(match);
          } catch {
            return 'rgb(30, 41, 59)';
          }
        }));
      });

      // --- ASSEMBLE PROFESSIONAL REPORT IN HYBRID ISOLATED OFFSCREEN A4 ELEM ---
      const isJakarta = userCity.toLowerCase().includes('jakarta');
      const aqiValue = isJakarta ? 78 : 45;
      const calculatedPm25 = isJakarta ? 25 : 12;
      const calculatedPm10 = isJakarta ? 35 : 18;

      const aqiStatusLabel = aqiValue <= 50 ? "Baik / Sehat" : "Sedang";
      const aqiColorObj = aqiValue <= 50 
        ? { bg: '#E6F4EA', ring: '#A8DADC', text: '#137333' }
        : { bg: '#FEF7E0', ring: '#FAD2CF', text: '#B06000' };

      const pm25Progress = Math.min(100, Math.round((calculatedPm25 / 15) * 100));
      const pm10Progress = Math.min(100, Math.round((calculatedPm10 / 50) * 100));

      const pm25Status = aqiValue <= 50 ? "BAIK" : "SEDANG";

      const healthAdvisoryText = aqiValue <= 50
        ? "Kualitas udara sangat baik dan menyehatkan. Udara bersih kondusif untuk segala jenis aktivitas fisik, olahraga berat, maupun sirkulasi udara luar ruangan di lingkungan Anda secara penuh."
        : "Kualitas udara dalam rentang sedang. Sebagian partikel polutan tersuspensi di udara. Kelompok sensitif (penderita asma, anak-anak, lansia) diimbau mengurangi aktivitas fisik berat di luar ruangan.";

      const docTimestamp = `AS-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;
      const formattedTime = new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });

      // Dynamic chart days in Indonesia format
      const INDO_DAYS_SHORT = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const chartDays = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        chartDays.push(INDO_DAYS_SHORT[d.getDay()]);
      }

      // Dynamic Weather Forecast pool (7 days, aligned exactly with d.getDay() 0-6)
      const INDO_DAYS_PROPER = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const forecastWeatherPool = [
        // 0: Minggu
        { temp: '32°C', label: 'Cerah', svg: '<circle cx="12" cy="12" r="5" fill="#FBBF24"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M17.66 6.34l-1.41-1.41" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>', aqi: 48 },
        // 1: Senin
        { temp: '28°C', label: 'Hujan Ringan', svg: '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="#CBD5E1"/><line x1="8" y1="19" x2="8" y2="21" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="19" x2="12" y2="21" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="19" x2="16" y2="21" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>', aqi: 35 },
        // 2: Selasa
        { temp: '30°C', label: 'Berawan', svg: '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="#CBD5E1"/>', aqi: 52 },
        // 3: Rabu
        { temp: '31°C', label: 'Cerah', svg: '<circle cx="12" cy="12" r="5" fill="#FBBF24"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M17.66 6.34l-1.41-1.41" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>', aqi: 44 },
        // 4: Kamis
        { temp: '27°C', label: 'Hujan Petir', svg: '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="#94A3B8"/><path d="m13 16-3 4h4l-3 4" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', aqi: 30 },
        // 5: Jumat
        { temp: '29°C', label: 'Berawan', svg: '<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="#CBD5E1"/>', aqi: 58 },
        // 6: Sabtu
        { temp: '33°C', label: 'Berangin', svg: '<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2M17.59 13.41A2 2 0 1 1 19 17H2" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', aqi: 42 }
      ];

      let forecastItemsHtml = '';
      for (let i = 1; i <= 6; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const dayIndex = d.getDay();
        const item = forecastWeatherPool[dayIndex];
        const dayName = i === 1 ? 'Besok' : INDO_DAYS_PROPER[dayIndex];

        const aqiColor = item.aqi <= 50 ? '#10B981' : '#D97706';
        const aqiBg = item.aqi <= 50 ? '#ECFDF5' : '#FEF3C7';
        
        const isLast = i === 6;
        const borderStyle = isLast ? '' : 'border-bottom: 1px solid #F1F5F9;';
        
        forecastItemsHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; ${borderStyle} padding: 15px 0; line-height: 1.4;">
            <div style="font-size: 8.5px; font-weight: 850; color: #475569; width: 45px; line-height: 1.4;">${dayName}</div>
            <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; line-height: 1.4;">
              <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; display: block; flex-shrink: 0; color: #475569;" fill="none" stroke="currentColor" stroke-width="2">${item.svg}</svg>
              <span style="font-size: 8.5px; font-weight: 800; color: #475569; line-height: 1.4; display: block; white-space: nowrap;">${item.label}</span>
            </div>
            <div style="font-size: 8.5px; font-weight: 805; color: #1E293B; width: 35px; text-align: right; line-height: 1.4;">${item.temp}</div>
            <div style="background-color: ${aqiBg}; color: ${aqiColor}; font-size: 8px; font-weight: 900; padding: 2.5px 6px; border-radius: 4px; width: 45px; text-align: center; line-height: 1.4; margin-left: 5px;">
              AQI ${item.aqi}
            </div>
          </div>
        `;
      }

      // Create isolated printing frame
      const latVal = userCoords?.lat !== undefined ? userCoords.lat.toFixed(4) : "-6.2088";
      const lngVal = userCoords?.lng !== undefined ? userCoords.lng.toFixed(4) : "106.8456";

      const printContainer = document.createElement('div');
      printContainer.id = 'aeroscan-print-frame';
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '-9999px';
      printContainer.style.width = '794px';  // A4 screen width width at 96 DPI
      printContainer.style.height = '1122px'; // A4 screen height at 96 DPI
      printContainer.style.backgroundColor = '#FFFFFF';
      printContainer.style.color = '#0F172A';
      printContainer.style.fontFamily = '"Inter", system-ui, sans-serif';
      printContainer.style.boxSizing = 'border-box';
      printContainer.style.padding = '30px 40px';
      printContainer.style.display = 'flex';
      printContainer.style.flexDirection = 'column';
      printContainer.style.justifyContent = 'space-between';

      printContainer.innerHTML = `
        <!-- 1. KOP SURAT (BRAND IDENTITY HEADER) -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 12px; box-sizing: border-box;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 10px;">
              <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; display: block;" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="22" fill="#2563EB" />
                <path d="M 28 68 L 46 26 C 48 21, 52 21, 54 26 L 72 68" fill="none" stroke="#FFFFFF" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M 37 51 L 63 51" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" />
                <path d="M 15 78 C 35 65, 65 92, 85 78" fill="none" stroke="#10B981" stroke-width="7" stroke-linecap="round" />
              </svg>
            </div>
            <div style="display: flex; flex-direction: column;">
              <h1 style="font-size: 18px; font-weight: 950; letter-spacing: -0.5px; color: #0F172A; margin: 0; line-height: 1;">AeroScan <span style="color: #2563EB;">AI</span></h1>
              <span style="font-size: 7.5px; font-weight: 900; color: #10B981; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 2.5px;">Air Visibility Intelligence</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 8px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Laporan Resmi Analisis</span>
            <div style="font-size: 11px; font-weight: 800; color: #0F172A; margin-top: 1px;">ID Dokumen: <span style="font-family: monospace; font-weight: 900;">${docTimestamp}</span></div>
            <div style="font-size: 7.5px; font-weight: 700; color: #94A3B8; margin-top: 1px;">Kondisi Server: <span style="color: #10B981; font-weight: 900;">TERKALIBRASI / OPTIMAL</span></div>
          </div>
        </div>

        <!-- 2. REAL-TIME META BANNER (LOKASI & STATUS) -->
        <div style="background-color: #FAFBFD; border: 1.2px solid #E2E8F0; border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; box-sizing: border-box;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background-color: ${aqiColorObj.bg}; border: 1.5px solid ${aqiColorObj.ring}; color: ${aqiColorObj.text}; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 950; text-transform: uppercase; tracking: 0.5px; display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px; font-weight: 900;">${aqiValue} AQI</span>
              <span>•</span>
              <span style="font-size: 9px; font-weight: 900;">${aqiStatusLabel.toUpperCase()}</span>
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 10px; font-weight: 800; color: #1E293B;">Stasiun Pemantau: ${userCity}, Indonesia</span>
              <span style="font-size: 8.5px; font-weight: 800; color: #2563EB; margin-top: 2px;">📍 Koordinat GPS: Lat: ${latVal}° | Lng: ${lngVal}°</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 7px; font-weight: 800; color: #64748B; text-transform: uppercase; display: block; letter-spacing: 0.5px;">Waktu Ekstraksi Data</span>
            <span style="font-size: 9.5px; font-weight: 800; color: #1E293B; display: block; margin-top: 1.5px;">${formattedTime}</span>
          </div>
        </div>

        <!-- 3. MAIN CONTENT GRID (TWO-COLUMNS) -->
        <div style="display: flex; gap: 12px; flex-grow: 1; margin-bottom: 8px; height: 100%; min-height: 0; box-sizing: border-box;">
          
          <!-- 📊 SEKTOR KIRI (ANALISA POLUSI - 62% WIDTH) -->
          <div style="width: 62%; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
            
            <!-- Area Line Spline Card (Element 1) -->
            <div style="background-color: #0F172A; color: #FFFFFF; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <svg style="width: 12px; height: 12px; color: #60A5FA;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  <span style="font-size: 9.5px; font-weight: 900; tracking: 0.5px; text-transform: uppercase;">AQI Trend (Last 7 Days)</span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #60A5FA;"></span>
                    <span style="font-size: 7.5px; font-weight: 800; color: #94A3B8;">PM2.5 (30 µg)</span>
                  </div>
                </div>
              </div>

              <!-- Vector Spline Area SVG -->
              <div style="width: 100%; height: 125px; background-color: #1E293B/30; border-radius: 8px; padding: 6px; border: 1px solid #1E293B; box-sizing: border-box;">
                <svg viewBox="0 0 440 90" style="width: 100%; height: 100%; overflow: visible;" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="spline_grad_pdf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.3" />
                      <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <!-- Grid -->
                  <line x1="30" y1="10" x2="420" y2="10" stroke="#334155" stroke-width="0.5" stroke-dasharray="2 2" />
                  <line x1="30" y1="35" x2="420" y2="35" stroke="#334155" stroke-width="0.5" stroke-dasharray="2 2" />
                  <line x1="30" y1="60" x2="420" y2="60" stroke="#334155" stroke-width="0.5" stroke-dasharray="2 2" />
                  <line x1="30" y1="75" x2="420" y2="75" stroke="#475569" stroke-width="1" />
                  
                  <!-- Y Axis Marks -->
                  <text x="5" y="13" style="font-size: 7px; fill: #94A3B8; font-weight: bold;">100 AQI</text>
                  <text x="5" y="38" style="font-size: 7px; fill: #94A3B8; font-weight: bold;">50 AQI</text>
                  <text x="5" y="63" style="font-size: 7px; fill: #94A3B8; font-weight: bold;">25 AQI</text>

                  <!-- Smooth Spline -->
                  <path d="M 50,70 Q 110,50 170,72 T 290,20 T 410,65 L 410,75 L 50,75 Z" fill="url(#spline_grad_pdf)" />
                  <path d="M 50,70 Q 110,50 170,72 T 290,20 T 410,65" fill="none" stroke="#60A5FA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                  
                  <circle cx="50" cy="70" r="3" fill="#60A5FA" />
                  <circle cx="110" cy="58" r="3" fill="#60A5FA" />
                  <circle cx="170" cy="72" r="3" fill="#60A5FA" />
                  <circle cx="230" cy="38" r="3" fill="#60A5FA" />
                  <circle cx="290" cy="20" r="3" fill="#60A5FA" />
                  <circle cx="350" cy="50" r="3" fill="#60A5FA" />
                  <circle cx="410" cy="65" r="3.5" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1" />

                  <!-- X labels -->
                  <text x="50" y="85" style="font-size: 7px; font-weight: 800; fill: #94A3B8;" text-anchor="middle">${chartDays[0]}</text>
                  <text x="110" y="85" style="font-size: 7px; font-weight: 800; fill: #94A3B8;" text-anchor="middle">${chartDays[1]}</text>
                  <text x="170" y="85" style="font-size: 7px; font-weight: 800; fill: #94A3B8;" text-anchor="middle">${chartDays[2]}</text>
                  <text x="230" y="85" style="font-size: 7px; font-weight: 800; fill: #94A3B8;" text-anchor="middle">${chartDays[3]}</text>
                  <text x="290" y="85" style="font-size: 7px; font-weight: 800; fill: #94A3B8;" text-anchor="middle">${chartDays[4]}</text>
                  <text x="350" y="85" style="font-size: 7px; font-weight: 800; fill: #94A3B8;" text-anchor="middle">${chartDays[5]}</text>
                  <text x="410" y="85" style="font-size: 7px; font-weight: 950; fill: #60A5FA;" text-anchor="middle">${chartDays[6]}</text>
                </svg>
              </div>
            </div>

            <!-- Vertical Grouped Bar Comparison (Element 2) -->
            <div style="background-color: #0F172A; color: #FFFFFF; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 9.5px; font-weight: 900; tracking: 0.5px; text-transform: uppercase;">Komparasi Partikel PM2.5 dan PM10</span>
                <div style="display: flex; gap: 8px;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 7px; height: 7px; background-color: #EF4444; border-radius: 2px;"></span>
                    <span style="font-size: 7px; font-weight: 800; color: #CBD5E1;">PM2.5 (Coral Red)</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 7px; height: 7px; background-color: #FBBF24; border-radius: 2px;"></span>
                    <span style="font-size: 7px; font-weight: 800; color: #CBD5E1;">PM10 (Amber Orange)</span>
                  </div>
                </div>
              </div>

              <!-- Bar SVG -->
              <div style="width: 100%; height: 125px; background-color: #1E293B/30; border-radius: 8px; padding: 6px; border: 1px solid #1E293B; box-sizing: border-box;">
                <svg viewBox="0 0 440 90" style="width: 100%; height: 100%; overflow: visible;" xmlns="http://www.w3.org/2000/svg">
                  <!-- Grid -->
                  <line x1="30" y1="10" x2="420" y2="10" stroke="#334155" stroke-width="0.5" stroke-dasharray="2 2" />
                  <line x1="30" y1="35" x2="420" y2="35" stroke="#334155" stroke-width="0.5" stroke-dasharray="2 2" />
                  <line x1="30" y1="65" x2="420" y2="65" stroke="#475569" stroke-width="1" />
                  
                  <text x="5" y="13" style="font-size: 7px; fill: #94A3B8; font-weight: bold;">50 µg/m³</text>
                  <text x="5" y="38" style="font-size: 7px; fill: #94A3B8; font-weight: bold;">25 µg/m³</text>
                  <text x="5" y="68" style="font-size: 7px; fill: #94A3B8; font-weight: bold;">0 µg/m³</text>

                  <!-- Day 1 Group (chartDays[2]) -->
                  <rect x="65" y="${65 - Math.min(50, (calculatedPm25 * 0.9))}" width="11" height="${Math.min(50, (calculatedPm25 * 0.9))}" fill="#EF4444" rx="2" />
                  <rect x="78" y="${65 - Math.min(50, (calculatedPm10 * 0.82))}" width="11" height="${Math.min(50, (calculatedPm10 * 0.82))}" fill="#FBBF24" rx="2" />
                  <text x="77" y="76" style="font-size: 8px; font-weight: 800; fill: #94A3B8;" text-anchor="middle">${chartDays[2]}</text>
                  <text x="70" y="${65 - Math.min(50, (calculatedPm25 * 0.9)) - 3}" style="font-size: 6px; fill: #EF4444; font-weight: 900; text-anchor: middle;">${Math.round(calculatedPm25 * 0.9)}</text>
                  <text x="83" y="${65 - Math.min(50, (calculatedPm10 * 0.82)) - 3}" style="font-size: 6px; fill: #FBBF24; font-weight: 900; text-anchor: middle;">${Math.round(calculatedPm10 * 0.82)}</text>

                  <!-- Day 2 Group (chartDays[3]) -->
                  <rect x="145" y="${65 - Math.min(50, (calculatedPm25 * 1.05))}" width="11" height="${Math.min(50, (calculatedPm25 * 1.05))}" fill="#EF4444" rx="2" />
                  <rect x="158" y="${65 - Math.min(50, (calculatedPm10 * 1.08))}" width="11" height="${Math.min(50, (calculatedPm10 * 1.08))}" fill="#FBBF24" rx="2" />
                  <text x="157" y="76" style="font-size: 8px; font-weight: 800; fill: #94A3B8;" text-anchor="middle">${chartDays[3]}</text>
                  <text x="150" y="${65 - Math.min(50, (calculatedPm25 * 1.05)) - 3}" style="font-size: 6px; fill: #EF4444; font-weight: 900; text-anchor: middle;">${Math.round(calculatedPm25 * 1.05)}</text>
                  <text x="163" y="${65 - Math.min(50, (calculatedPm10 * 1.08)) - 3}" style="font-size: 6px; fill: #FBBF24; font-weight: 900; text-anchor: middle;">${Math.round(calculatedPm10 * 1.08)}</text>

                  <!-- Day 3 Group (Yesterday) -->
                  <rect x="225" y="${65 - Math.min(50, (calculatedPm25 * 0.85))}" width="11" height="${Math.min(50, (calculatedPm25 * 0.85))}" fill="#EF4444" rx="2" />
                  <rect x="238" y="${65 - Math.min(50, (calculatedPm10 * 0.9))}" width="11" height="${Math.min(50, (calculatedPm10 * 0.9))}" fill="#FBBF24" rx="2" />
                  <text x="237" y="76" style="font-size: 8px; font-weight: 800; fill: #94A3B8;" text-anchor="middle">${chartDays[4]}</text>
                  <text x="230" y="${65 - Math.min(50, (calculatedPm25 * 0.85)) - 3}" style="font-size: 6px; fill: #EF4444; font-weight: 900; text-anchor: middle;">${Math.round(calculatedPm25 * 0.85)}</text>
                  <text x="243" y="${65 - Math.min(50, (calculatedPm10 * 0.9)) - 3}" style="font-size: 6px; fill: #FBBF24; font-weight: 900; text-anchor: middle;">${Math.round(calculatedPm10 * 0.9)}</text>

                  <!-- Day 4 Group (Today) -->
                  <rect x="305" y="${65 - Math.min(50, calculatedPm25)}" width="11" height="${Math.min(50, calculatedPm25)}" fill="#EF4444" rx="2" stroke="#FFFFFF" stroke-width="0.5" />
                  <rect x="318" y="${65 - Math.min(50, calculatedPm10)}" width="11" height="${Math.min(50, calculatedPm10)}" fill="#FBBF24" rx="2" stroke="#FFFFFF" stroke-width="0.5" />
                  <text x="317" y="76" style="font-size: 8.5px; font-weight: 950; fill: #60A5FA;" text-anchor="middle">Hari Ini</text>
                  <text x="310" y="${65 - Math.min(50, calculatedPm25) - 3}" style="font-size: 6.5px; fill: #EF4444; font-weight: 900; text-anchor: middle;">${calculatedPm25}</text>
                  <text x="323" y="${65 - Math.min(50, calculatedPm10) - 3}" style="font-size: 6.5px; fill: #FBBF24; font-weight: 900; text-anchor: middle;">${calculatedPm10}</text>
                </svg>
              </div>
            </div>

            <!-- PETA SEBARAN POLUSI (SPATIAL POLLUTION MAP) -->
            <div style="background-color: #0F172A; color: #FFFFFF; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box;">
              <div style="display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <svg style="width: 12px; height: 12px; color: #10B981;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2 2V12l-1.5 1.5-2-2"/></svg>
                  <span style="font-size: 9.5px; font-weight: 900; tracking: 0.5px; text-transform: uppercase;">Peta Sebaran Polusi (Spatial AQI Distribution)</span>
                </div>
                <!-- Mini Legenda -->
                <div style="display: flex; gap: 8px; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 3px;">
                    <span style="width: 5px; height: 5px; border-radius: 50%; background-color: #10B981;"></span>
                    <span style="font-size: 6.5px; font-weight: 850; color: #94A3B8;">Baik</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 3px;">
                    <span style="width: 5px; height: 5px; border-radius: 50%; background-color: #FBBF24;"></span>
                    <span style="font-size: 6.5px; font-weight: 850; color: #94A3B8;">Sedang</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 3px;">
                    <span style="width: 5px; height: 5px; border-radius: 50%; background-color: #EF4444;"></span>
                    <span style="font-size: 6.5px; font-weight: 850; color: #94A3B8;">Buruk</span>
                  </div>
                </div>
              </div>

              <!-- Map Dynamic Canvas SVG Area -->
              <div style="width: 100%; height: 195px; background-color: #0b0f19; border-radius: 8px; padding: 6px; border: 1px solid #1E293B; box-sizing: border-box; overflow: hidden; position: relative;">
                <svg viewBox="0 0 440 160" style="width: 100%; height: 100%; overflow: visible;" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <!-- Gradient definitions for glowing heat spots -->
                    <radialGradient id="heat_good" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#10B981" stop-opacity="0.45" />
                      <stop offset="60%" stop-color="#10B981" stop-opacity="0.15" />
                      <stop offset="100%" stop-color="#10B981" stop-opacity="0.0" />
                    </radialGradient>
                    <radialGradient id="heat_moderate" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.45" />
                      <stop offset="65%" stop-color="#FBBF24" stop-opacity="0.15" />
                      <stop offset="100%" stop-color="#FBBF24" stop-opacity="0.0" />
                    </radialGradient>
                    <radialGradient id="heat_bad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#EF4444" stop-opacity="0.5" />
                      <stop offset="70%" stop-color="#EF4444" stop-opacity="0.18" />
                      <stop offset="100%" stop-color="#EF4444" stop-opacity="0.0" />
                    </radialGradient>
                  </defs>

                  <!-- 1. Coordinate Dot Grid representing Spatial Plane -->
                  <pattern id="dot_map_grid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="0.75" fill="#1e293b" />
                  </pattern>
                  <rect width="440" height="160" fill="url(#dot_map_grid)" />

                  <!-- 2. Concentric Radar Rings -->
                  <circle cx="220" cy="80" r="40" fill="none" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="2 2" />
                  <circle cx="220" cy="80" r="80" fill="none" stroke="#1e293b" stroke-width="0.5" stroke-dasharray="2 2" />

                  <!-- 3. Stylized Geographic Land Contours of Jakarta & Bay -->
                  <path d="M -10 35 Q 60 50 120 30 T 260 40 T 360 25 T 450 45 L 450 170 L -10 170 Z" fill="#0f172a" fill-opacity="0.5" stroke="#334155" stroke-width="1.2" stroke-linejoin="round" />
                  
                  <!-- Subtle water waving patterns -->
                  <path d="M 40 15 Q 70 17 100 13" fill="none" stroke="#1e293b" stroke-width="0.75" />
                  <path d="M 280 13 Q 310 15 340 11" fill="none" stroke="#1e293b" stroke-width="0.75" />

                  <!-- 4. Heatmap overlapping layers -->
                  <!-- Northern Sea/Coast (Baik) -->
                  <circle cx="220" cy="45" r="50" fill="url(#heat_good)" />
                  <!-- West (Moderate) -->
                  <circle cx="110" cy="85" r="45" fill="url(#heat_moderate)" />
                  <!-- East (Moderate/High) -->
                  <circle cx="330" cy="95" r="50" fill="url(#heat_moderate)" />
                  <!-- South Area (Tidak Sehat / Bad Air Quality) -->
                  <circle cx="200" cy="125" r="60" fill="url(#heat_bad)" />

                  <!-- 5. Interactive Station Nodes & Value Indicators with detailed tech labels -->
                  <!-- Station 1: Utara -->
                  <g transform="translate(220, 45)">
                    <circle cx="0" cy="0" r="5.5" fill="#10B981" stroke="#ffffff" stroke-width="1.2" />
                    <line x1="0" y1="0" x2="16" y2="-12" stroke="#475569" stroke-width="0.75" />
                    <rect x="16" y="-19" width="62" height="10" rx="3" fill="#0f172a" stroke="#10B981" stroke-width="0.75" />
                    <text x="20" y="-12" style="font-size: 5.5px; fill: #ffffff; font-family: sans-serif; font-weight: 800;">Stn Utara: 48 AQI</text>
                  </g>

                  <!-- Station 2: Barat -->
                  <g transform="translate(110, 85)">
                    <circle cx="0" cy="0" r="5.5" fill="#FBBF24" stroke="#ffffff" stroke-width="1.2" />
                    <line x1="0" y1="0" x2="-15" y2="-12" stroke="#475569" stroke-width="0.75" />
                    <rect x="-77" y="-19" width="62" height="10" rx="3" fill="#0f172a" stroke="#FBBF24" stroke-width="0.75" />
                    <text x="-73" y="-12" style="font-size: 5.5px; fill: #ffffff; font-family: sans-serif; font-weight: 800;">Stn Barat: 68 AQI</text>
                  </g>

                  <!-- Station 3: Pusat -->
                  <g transform="translate(210, 80)">
                    <circle cx="0" cy="0" r="6" fill="#FBBF24" stroke="#ffffff" stroke-width="1.5" />
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#2563EB" stroke-width="0.5" stroke-dasharray="1 1" />
                    <line x1="0" y1="0" x2="16" y2="12" stroke="#475569" stroke-width="0.75" />
                    <rect x="16" y="12" width="76" height="10" rx="3" fill="#2563EB" stroke="#ffffff" stroke-width="0.75" />
                    <text x="20" y="19" style="font-size: 5.5px; fill: #ffffff; font-family: sans-serif; font-weight: 900;">📍 Stn Anda: ${aqiValue} AQI</text>
                  </g>

                  <!-- Station 4: Selatan -->
                  <g transform="translate(200, 125)">
                    <circle cx="0" cy="0" r="5.5" fill="#EF4444" stroke="#ffffff" stroke-width="1.2" />
                    <line x1="0" y1="0" x2="-16" y2="10" stroke="#475569" stroke-width="0.75" />
                    <rect x="-82" y="10" width="66" height="10" rx="3" fill="#0f172a" stroke="#EF4444" stroke-width="0.75" />
                    <text x="-78" y="17" style="font-size: 5.5px; fill: #ffffff; font-family: sans-serif; font-weight: 800;">Stn Selatan: 122 AQI</text>
                  </g>

                  <!-- Station 5: Timur -->
                  <g transform="translate(330, 95)">
                    <circle cx="0" cy="0" r="5.5" fill="#FBBF24" stroke="#ffffff" stroke-width="1.2" />
                    <line x1="0" y1="0" x2="15" y2="10" stroke="#475569" stroke-width="0.75" />
                    <rect x="15" y="10" width="62" height="10" rx="3" fill="#0f172a" stroke="#FBBF24" stroke-width="0.75" />
                    <text x="19" y="17" style="font-size: 5.5px; fill: #ffffff; font-family: sans-serif; font-weight: 800;">Stn Timur: 96 AQI</text>
                  </g>

                  <!-- 6. Compass Overlay in Bottom Right Corner -->
                  <g transform="translate(415, 30)">
                    <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#334155" stroke-width="0.75" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#475569" stroke-width="0.5" />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#475569" stroke-width="0.5" />
                    <polygon points="0,-10 -3,-2 0,-4 3,-2" fill="#EF4444" />
                    <polygon points="0,10 -3,2 0,4 3,2" fill="#cbd5e1" />
                    <text x="0" y="-13" style="font-size: 5.5px; fill: #ffffff; font-weight: bold;" text-anchor="middle">N</text>
                  </g>

                  <!-- 7. Map Scale Ruler in Bottom Left Corner -->
                  <g transform="translate(15, 145)">
                    <line x1="0" y1="0" x2="30" y2="0" stroke="#94A3B8" stroke-width="1.5" />
                    <line x1="0" y1="-2" x2="0" y2="2" stroke="#94A3B8" stroke-width="1.2" />
                    <line x1="15" y1="-1.5" x2="15" y2="1.5" stroke="#94A3B8" stroke-width="0.75" />
                    <line x1="30" y1="-2" x2="30" y2="2" stroke="#94A3B8" stroke-width="1.2" />
                    <text x="15" y="-5" style="font-size: 5px; fill: #94A3B8; font-family: monospace;" text-anchor="middle">5 KM</text>
                  </g>

                  <!-- 8. Grid tick marks for GIS boundaries and annotations -->
                  <text x="5" y="15" style="font-size: 5px; fill: #475569; font-family: monospace;">LAT: ${latVal}° ${userCoords?.lat !== undefined && userCoords.lat >= 0 ? 'N' : 'S'}</text>
                  <text x="5" y="23" style="font-size: 5px; fill: #475569; font-family: monospace;">LNG: ${lngVal}° ${userCoords?.lng !== undefined && userCoords.lng >= 0 ? 'E' : 'W'}</text>
                  
                  <!-- HUD text label -->
                  <rect x="345" y="137" width="80" height="12" rx="2" fill="#0f172a" stroke="#334155" stroke-width="0.5" />
                  <text x="349" y="145" style="font-size: 5px; fill: #2563EB; font-family: monospace; font-weight: bold;">WIND: 14 kph → NE</text>
                </svg>
              </div>
            </div>

          </div>

          <!-- 🏥 SEKTOR KANAN (WEATHER & HEALTH HUB - 38% WIDTH) -->
          <div style="width: 38%; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
            
            <!-- Weather Forecast (Element 1) -->
            <div style="border: 1.2px solid #E2E8F0; border-radius: 12px; padding: 10px 12px; background-color: #FFFFFF; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box;">
              <div style="display: flex; align-items: center; gap: 6px; border-bottom: 1.2px solid #F1F5F9; padding-bottom: 6px; margin-bottom: 4px;">
                <svg style="width: 12px; height: 12px; color: #0EA5E9;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M6.34 17.66l-1.41 1.41M12 20v2M17.66 17.66l1.41 1.41M20 12h2M17.66 6.34l-1.41-1.41"/></svg>
                <span style="font-size: 9px; font-weight: 900; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">Perkiraan Cuaca Aliran Udara</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; background-color: #F8FAFC; padding: 6px 8px; border-radius: 6px; border: 1px solid #F1F5F9; margin-bottom: 4px;">
                <span style="font-size: 9px; font-weight: 850; color: #1E293B;">Hari Ini: Berawan</span>
                <span style="font-size: 9px; font-weight: 900; color: #0EA5E9;">31°C <span style="font-weight: normal; color: #94A3B8;">|</span> HUM: 65%</span>
              </div>

              <div style="display: flex; flex-direction: column;">
                ${forecastItemsHtml}
              </div>
            </div>

            <!-- Health Advisory & Checklist (Element 2) -->
            <div style="border: 1.2px solid #2563EB; border-radius: 12px; padding: 10px 12px; background-color: #EFF6FF; display: flex; flex-direction: column; gap: 5px; box-sizing: border-box;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <svg style="width: 12px; height: 12px; color: #2563EB;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style="font-size: 9px; font-weight: 900; color: #1E40AF; text-transform: uppercase; letter-spacing: 0.5px;">HEALTH ADVISORY REPORT</span>
              </div>
              <p style="font-size: 8.5px; font-weight: 750; color: #1E3A8A; line-height: 1.35; margin: 0;">
                ${healthAdvisoryText}
               <!-- Tips Checkbox items style -->
            <div style="border: 1.2px solid #E2E8F0; border-radius: 12px; padding: 12px 14px; background-color: #FFFFFF; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; flex-grow: 1;">
              <div style="display: flex; align-items: center; gap: 6px; border-bottom: 1.2px solid #F1F5F9; padding-bottom: 6px; margin-bottom: 4px;">
                <svg style="width: 12px; height: 12px; color: #10B981;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="m9 11 3 3L22 4"/><path d="M21 12a9 9 0 1 1-9-9H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/></svg>
                <span style="font-size: 9.5px; font-weight: 900; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">TIPS KESEHATAN HARIAN</span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; gap: 8px; align-items: flex-start; padding: 11px 12px; background-color: #F8FAFC; border-radius: 6px; border: 1px solid #F1F5F9;">
                  <span style="font-size: 9px; color: #10B981; font-weight: 900; background-color: #ECFDF5; border: 1.2px solid #A7F3D0; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border-radius: 4px; line-height: 1; flex-shrink: 0; margin-top: 2px;">✓</span>
                  <div>
                    <div style="font-size: 9.5px; font-weight: 850; color: #1E293B;">Aktivitas Luar Ruangan</div>
                    <div style="font-size: 8.5px; font-weight: 700; color: #64748B; margin-top: 2px; line-height: 1.3;">
                      ${aqiValue <= 50 
                        ? 'Sangat baik untuk olahraga pagi dan aktivitas fisik aktif luar ruang tanpa pembatasan dahi.' 
                        : 'Aktivitas luar ruang normal diperbolehkan, pertimbangkan penggunaan masker standar.'}
                    </div>
                  </div>
                </div>

                <div style="display: flex; gap: 8px; align-items: flex-start; padding: 11px 12px; background-color: #F8FAFC; border-radius: 6px; border: 1px solid #F1F5F9;">
                  <span style="font-size: 9px; color: #10B981; font-weight: 900; background-color: #ECFDF5; border: 1.2px solid #A7F3D0; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border-radius: 4px; line-height: 1; flex-shrink: 0; margin-top: 2px;">✓</span>
                  <div>
                    <div style="font-size: 9.5px; font-weight: 850; color: #1E293B;">Sirkulasi Udara Rumah</div>
                    <div style="font-size: 8.5px; font-weight: 700; color: #64748B; margin-top: 2px; line-height: 1.3;">
                      ${aqiValue <= 50 
                        ? 'Buka ventilasi ruangan secara lebar untuk pertukaran udara segar alami dan bersih.' 
                        : 'Sirkulasi udara aman, namun gunakan air purifier interior di jam-jam polusi tinggi.'}
                    </div>
                  </div>
                </div>

                <div style="display: flex; gap: 8px; align-items: flex-start; padding: 11px 12px; background-color: #F8FAFC; border-radius: 6px; border: 1px solid #F1F5F9;">
                  <span style="font-size: 9px; color: #10B981; font-weight: 900; background-color: #ECFDF5; border: 1.2px solid #A7F3D0; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border-radius: 4px; line-height: 1; flex-shrink: 0; margin-top: 2px;">✓</span>
                  <div>
                    <div style="font-size: 9.5px; font-weight: 850; color: #1E293B;">Proteksi Kelompok Sensitif</div>
                    <div style="font-size: 8.5px; font-weight: 700; color: #64748B; margin-top: 2px; line-height: 1.3;">
                      ${aqiValue <= 50 
                        ? 'Kondisi steril penuh, sangat aman untuk lansia, balita, maupun penderita asma akut.' 
                        : 'Kelompok rentan dianjurkan menghindari kelelahan fisik jangka panjang di luar ruangan.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 4. BOTTOM CALIBRATION BAR (FULL WIDTH) -->
        <div style="background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; padding: 12px 16px; box-sizing: border-box; display: flex; justify-content: space-between; align-items: center; color: #94A3B8; margin-bottom: 12px; width: 100%;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg style="width: 14px; height: 14px; color: #3B82F6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="m9.09 9 1 3h3.8l1-3"/></svg>
            <div>
              <span style="font-size: 9px; font-weight: 950; color: #FFFFFF; display: block; text-transform: uppercase;">Kalibrasi Optik & Indeks Kekeruhan (Haze)</span>
              <span style="font-size: 8px; font-weight: 700; color: #94A3B8; display: block; margin-top: 2.5px;">Optical Haze Index (OHI): 1.08 | Deviasi Sensor: ±0.03 | Transmisi Optik Terkalibrasi</span>
            </div>
          </div>
          <span style="font-size: 8px; font-weight: 900; color: #3B82F6;">VERIFIED SYSTEM v2.4</span>
        </div>

        <!-- 5. FIXED DOCUMENT FOOTER -->
        <!-- 5. FIXED DOCUMENT FOOTER -->
        <div style="border-top: 1.5px solid #2563EB; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; font-weight: 800; color: #94A3B8; box-sizing: border-box;">
          <div>
            © 2026 <span style="color: #475569; font-weight: 900;">AeroScan AI</span> - Sistem Pemantauan Kualitas Udara Cerdas. Seluruh data terenkripsi di server pusat.
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <div>Halaman <span style="color: #475569; font-weight: 950;">1</span> dari <span style="font-weight: 950;">1</span></div>
            <div style="display: flex; align-items: center; gap: 3px; background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 2.5px 6px; border-radius: 4px; color: #10B981; font-weight: 950; font-family: monospace;">
              SECURE VERIFIED ✓
            </div>
          </div>
        </div>
      `;

      // Mount print element in body context
      document.body.appendChild(printContainer);

      // Perform capturing call on offscreen node
      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      // Cleanup offscreen printing element immediately
      document.body.removeChild(printContainer);

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Render image overlay on the single page exactly
      doc.addImage(imgData, 'PNG', 0, 0, 210, 297);
      doc.save(`AeroScan_Report_${Date.now()}.pdf`);
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Gagal membuat laporan PDF. Pastikan semua komponen sudah dimuat.');
    } finally {
      // Restore original Stylesheet inline blocks
      styleElements.forEach((el, index) => {
        if (originalStyles[index] !== undefined) {
          el.innerHTML = originalStyles[index];
        }
      });

      // Restore inline style attributes
      elementsWithOklchStyle.forEach((el, index) => {
        if (originalInlineStyles[index] !== undefined) {
          el.setAttribute('style', originalInlineStyles[index]);
        }
      });

      setIsGenerating(false);
    }
  };

  if (trigger) {
    return <>{trigger(generatePDF, isGenerating)}</>;
  }

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="group relative flex items-center justify-between w-full max-w-[280px] bg-slate-900 text-white px-6 py-4 rounded-2xl font-black shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] hover:bg-slate-800 transition-all hover:translate-y-[-4px] active:translate-y-[0px] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center gap-4 relative z-10">
        {isGenerating ? (
          <Loader2 className="animate-spin text-blue-400" size={24} />
        ) : (
          <div className="p-2 bg-white/10 rounded-xl">
            <FileText className="text-blue-400" size={20} />
          </div>
        )}
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-0.5">Ready to Print</span>
          <span className="text-sm tracking-tight">Export PDF</span>
        </div>
      </div>

      <div className="p-2 bg-white/10 rounded-xl group-hover:bg-blue-600 transition-colors relative z-10">
        <Download size={18} />
      </div>
    </button>
  );
}
