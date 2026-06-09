'use client';

import { useState, useEffect } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  Search, 
  Plus, 
  MoreHorizontal,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Database,
  X,
  Table
} from 'lucide-react';
import { datasetsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    fetchDatasets();

    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;
      
      const text = e.clipboardData?.getData('text');
      if (text && text.trim().length > 0) {
        setPasteContent(text);
        setIsPasteModalOpen(true);
        // Auto-generate name
        const now = new Date();
        setManualName(`Manual Import ${now.toLocaleDateString()} ${now.getHours()}:${now.getMinutes()}`);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      const res = await datasetsApi.getAll();
      setDatasets(res.data);
    } catch (err) {
      console.error('Failed to fetch datasets', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await datasetsApi.upload(file);
      fetchDatasets();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      alert(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleManualSubmit = async () => {
    if (!pasteContent.trim()) return;

    // Parse numeric values from paste content
    const values = pasteContent
      .split(/[\n\t,]/)
      .map(v => v.trim())
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    if (values.length < 5) {
      alert('Please provide at least 5 valid numeric values.');
      return;
    }

    // Create a CSV blob
    const csvContent = values.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], `${manualName || 'Manual Import'}.csv`, { type: 'text/csv' });

    setIsPasteModalOpen(false);
    setPasteContent('');
    setManualName('');
    await handleFileUpload(file);
  };

  const handleDownload = async (id: string, name: string) => {
    console.log('Downloading dataset ID:', id);
    try {
      const res = await datasetsApi.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Download error:', err);
      // If error is a blob, convert it to see the message
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        alert(json.message || 'Failed to download dataset.');
      } else {
        alert(err.response?.data?.message || 'Failed to download dataset.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dataset Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your inspection data and statistical inputs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setPasteContent('');
              setManualName(`Manual Import ${new Date().toLocaleDateString()}`);
              setIsPasteModalOpen(true);
            }}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Table className="w-4 h-4" />
            Paste Data
          </button>
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Add New Dataset
            <input 
              type="file" 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "relative h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-150",
          dragActive 
            ? "bg-blue-50 border-blue-500" 
            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="font-bold text-xs uppercase">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <Upload className="w-6 h-6 text-gray-400" />
            <div>
              <p className="text-gray-900 font-semibold text-sm">Drop CSV or Excel here</p>
              <p className="text-gray-500 text-xs mt-0.5">Maximum file size: 50MB</p>
            </div>
          </div>
        )}
      </div>


      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search datasets..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-4 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
            <Database className="w-4 h-4 text-blue-600" />
            {datasets.length} Datasets
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Dataset Name</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date Uploaded</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-48 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-24 animate-pulse" /></td>
                    <td className="p-4"><div className="flex justify-center"><div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" /></div></td>
                    <td className="p-4"><div className="h-8 bg-gray-100 rounded-md w-24 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : datasets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                    <p className="text-gray-400 text-sm">No datasets found.</p>
                  </td>
                </tr>
              ) : (
                datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{dataset.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">ID: {dataset.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(dataset.uploadedAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <div className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                          dataset.status === 'VALIDATED' 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        )}>
                          {dataset.status === 'VALIDATED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {dataset.status}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleDownload(dataset.id, dataset.name)}
                          className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      <PasteModal 
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        content={pasteContent}
        setContent={setPasteContent}
        name={manualName}
        setName={setManualName}
        onSubmit={handleManualSubmit}
      />
    </div>
  );
}

function PasteModal({ 
  isOpen, 
  onClose, 
  content, 
  setContent, 
  name, 
  setName, 
  onSubmit 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  content: string, 
  setContent: (v: string) => void,
  name: string,
  setName: (v: string) => void,
  onSubmit: () => void
}) {
  if (!isOpen) return null;

  const parsedValues = content
    .split(/[\n\t,]/)
    .map(v => v.trim())
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded flex items-center justify-center text-blue-600">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Manual Data Import</h2>
              <p className="text-xs text-gray-500">Paste your values directly from Excel or Sheets.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dataset Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tank 42 Inspection 2024"
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none text-gray-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between">
              Paste Area
              <span className={cn(
                "text-[10px] font-bold uppercase",
                parsedValues.length >= 5 ? "text-emerald-600" : "text-amber-600"
              )}>
                {parsedValues.length} Values Detected
              </span>
            </label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste columns here..."
              className="w-full h-40 bg-gray-50 border border-gray-200 rounded-md p-3 text-sm font-mono focus:border-blue-500 outline-none text-gray-900 resize-none"
            />
          </div>

          {parsedValues.length > 0 && (
            <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Preview (First 10 values)</label>
               <div className="flex flex-wrap gap-2">
                 {parsedValues.slice(0, 10).map((v, i) => (
                   <span key={i} className="px-2 py-0.5 bg-white text-gray-700 rounded border border-gray-200 text-[11px] font-mono">
                     {v.toFixed(3)}
                   </span>
                 ))}
               </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            disabled={parsedValues.length < 5}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-semibold transition-colors"
          >
            Create Dataset
          </button>
        </div>
      </div>
    </div>

  );
}
