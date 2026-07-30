import { Button } from '@/components/ui/button';
import { Download, Upload, FileText } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface ExportImportButtonsProps {
  data: any[];
  filename: string;
  headers: { label: string; key: string }[];
  onImport?: (data: any[]) => void;
  pdfTitle?: string;
  pdfColumns?: string[];
  summary?: { label: string; value: string | number }[];
}

export function ExportImportButtons({ 
  data, 
  filename, 
  headers, 
  onImport,
  pdfTitle,
  pdfColumns,
  summary = [],
}: ExportImportButtonsProps) {
  const getExportValue = (item: any, key: string) => {
    const value = item[key];
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value?.toString() || '';
  };

  const escapeCsvCell = (value: string | number) => {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const handleExportCSV = () => {
    const lines: string[] = [];
    if (summary.length) {
      lines.push('Summary,Value');
      summary.forEach(item => lines.push(`${escapeCsvCell(item.label)},${escapeCsvCell(item.value)}`));
      lines.push('');
    }
    lines.push(headers.map(header => escapeCsvCell(header.label)).join(','));
    data.forEach(item => {
      lines.push(headers.map(header => escapeCsvCell(getExportValue(item, header.key))).join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };
  
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (onImport) {
          onImport(results.data);
          toast.success(`Imported ${results.data.length} records`);
        }
      },
      error: (error) => {
        toast.error(`Import failed: ${error.message}`);
      }
    });
    e.target.value = '';
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(pdfTitle || filename, 14, 15);
    let startY = 25;

    if (summary.length) {
      autoTable(doc, {
        head: [['Summary', 'Value']],
        body: summary.map(item => [item.label, String(item.value)]),
        startY,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] }
      });
      startY = (doc as any).lastAutoTable.finalY + 8;
    }
    
    const columns = pdfColumns || headers.map(h => h.label);
    const rows = data.map(item => 
      headers.map(h => getExportValue(item, h.key))
    );

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`${filename}.pdf`);
    toast.success('PDF exported successfully');
  };

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportCSV}>
        <Download className="h-3 w-3" /> CSV
      </Button>

      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportPDF}>
        <FileText className="h-3 w-3" /> PDF
      </Button>

      {onImport && (
        <label>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
            <span>
              <Upload className="h-3 w-3" /> Import
            </span>
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
