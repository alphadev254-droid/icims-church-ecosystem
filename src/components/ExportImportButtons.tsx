import { Button } from '@/components/ui/button';
import { Download, Upload, FileText } from 'lucide-react';
import { CSVLink } from 'react-csv';
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
}

export function ExportImportButtons({ 
  data, 
  filename, 
  headers, 
  onImport,
  pdfTitle,
  pdfColumns 
}: ExportImportButtonsProps) {
  
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
    
    const columns = pdfColumns || headers.map(h => h.label);
    const rows = data.map(item => 
      headers.map(h => {
        const value = item[h.key];
        if (value instanceof Date) return value.toLocaleDateString();
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return value?.toString() || '';
      })
    );

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`${filename}.pdf`);
    toast.success('PDF exported successfully');
  };

  return (
    <div className="flex gap-2">
      <CSVLink
        data={data}
        headers={headers}
        filename={`${filename}.csv`}
        className="inline-flex"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </CSVLink>

      <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
        <FileText className="h-4 w-4" /> PDF
      </Button>

      {onImport && (
        <label>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <span>
              <Upload className="h-4 w-4" /> Import CSV
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
