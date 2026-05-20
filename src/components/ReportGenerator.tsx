import { FileText, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text('AeroScan AI: Laporan Polusi & Cuaca', 15, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Dihasilkan pada: ${new Date().toLocaleString('id-ID')}`, 15, 28);
      
      doc.line(15, 32, pageWidth - 15, 32);

      // Helper to capture component
      const captureComponent = async (id: string) => {
        const element = document.getElementById(id);
        if (!element) return null;
        return await html2canvas(element, { scale: 2, useCORS: true });
      };

      // Summary Text
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Ringkasan Analisis Kamera:', 15, 42);
      
      // Capture Camera Section
      const cameraCanvas = await captureComponent('camera-scanner-container');
      if (cameraCanvas) {
        const imgData = cameraCanvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const imgHeight = (imgProps.height * (pageWidth - 30)) / imgProps.width;
        doc.addImage(imgData, 'PNG', 15, 45, pageWidth - 30, imgHeight);
      }

      // Capture Chart Section
      doc.text('Tren Historikal 7 Hari:', 15, 125);
      const chartCanvas = await captureComponent('historical-chart-container');
      if (chartCanvas) {
        const imgData = chartCanvas.toDataURL('image/png');
        const imgHeight = (chartCanvas.height * (pageWidth - 30)) / chartCanvas.width;
        doc.addImage(imgData, 'PNG', 15, 130, pageWidth - 30, imgHeight);
      }

      // Next Page for Weather
      doc.addPage();
      doc.text('Prakiraan Cuaca Mingguan:', 15, 20);
      const weatherCanvas = await captureComponent('weather-forecast-container');
      if (weatherCanvas) {
        const imgData = weatherCanvas.toDataURL('image/png');
        const imgHeight = (weatherCanvas.height * (pageWidth - 30)) / weatherCanvas.width;
        doc.addImage(imgData, 'PNG', 15, 25, pageWidth - 30, imgHeight);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('AeroScan AI - Sistem Pemantauan Kualitas Udara Cerdas', pageWidth / 2, 285, { align: 'center' });

      doc.save(`AeroScan_Report_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Gagal membuat laporan PDF. Pastikan semua komponen sudah dimuat.');
    } finally {
      setIsGenerating(false);
    }
  };

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
          <span className="text-sm tracking-tight">Export PDF Report</span>
        </div>
      </div>

      <div className="p-2 bg-white/10 rounded-xl group-hover:bg-blue-600 transition-colors relative z-10">
        <Download size={18} />
      </div>
    </button>
  );
}
