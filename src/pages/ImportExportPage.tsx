import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { 
  exportAllJSON, 
  exportToExcel, 
  exportMembersCSV, 
  exportPaymentsCSV, 
  exportToXML, 
  importFromJSON, 
  importFromExcel 
} from '../services/exportImportService';
import { ImportSummary } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { 
  DatabaseBackup, 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';

export const ImportExportPage: React.FC = () => {
  const { settings } = useSettings();

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  // Export handlers
  const handleExportJSON = async () => {
    const json = await exportAllJSON(settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gym_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportExcel = async () => {
    const blob = await exportToExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gym_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
  };

  const handleExportCSV = async () => {
    const membersCsv = await exportMembersCSV();
    const blob = new Blob([membersCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gym_Members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportXML = async () => {
    const xml = await exportToXML(settings);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gym_Backup_${new Date().toISOString().split('T')[0]}.xml`;
    a.click();
  };

  // Import trigger
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportSummary(null);
    }
  };

  const startImportProcess = async () => {
    if (!selectedFile) return;

    if (importMode === 'replace') {
      setShowReplaceConfirm(true);
    } else {
      await executeImport();
    }
  };

  const executeImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setImportSummary(null);

    try {
      const fileName = selectedFile.name.toLowerCase();
      let summary: ImportSummary;

      if (fileName.endsWith('.json')) {
        const text = await selectedFile.text();
        summary = await importFromJSON(text, importMode);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        summary = await importFromExcel(arrayBuffer, importMode);
      } else {
        summary = {
          importedMembersCount: 0,
          importedPaymentsCount: 0,
          skippedMembersCount: 0,
          skippedPaymentsCount: 0,
          errors: ['Unsupported file format. Please upload JSON or Excel (.xlsx) file.'],
        };
      }

      setImportSummary(summary);
      setSelectedFile(null);
    } catch (err: any) {
      setImportSummary({
        importedMembersCount: 0,
        importedPaymentsCount: 0,
        skippedMembersCount: 0,
        skippedPaymentsCount: 0,
        errors: [err?.message || 'Failed to process file import'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-3">
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <DatabaseBackup className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            Backup & Data Import / Export
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export complete gym database backups offline. Restore or merge records anytime.
          </p>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Export Backup Options</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download complete backup files stored locally in IndexedDB
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* JSON Export */}
          <div
            onClick={handleExportJSON}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <FileJson className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Full JSON Backup</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Complete app structure with members, payments, and settings.
            </p>
          </div>

          {/* Excel Export */}
          <div
            onClick={handleExportExcel}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Excel Workbook (.xlsx)</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Formatted sheets for Members and Payments history.
            </p>
          </div>

          {/* CSV Export */}
          <div
            onClick={handleExportCSV}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Members CSV</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Raw tabular CSV data for member profile list.
            </p>
          </div>

          {/* XML Export */}
          <div
            onClick={handleExportXML}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <FileCode className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">XML Backup</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Standard XML structured schema database backup.
            </p>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Import Restore Options</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Restore app data from a previously exported JSON or Excel file
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Import Mode Radio */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>Merge with existing data (Safest)</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer font-medium text-rose-600 dark:text-rose-400">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-rose-600 focus:ring-rose-500"
              />
              <span>Replace all existing data</span>
            </label>
          </div>

          {/* File Picker */}
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <label className="cursor-pointer">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Click to browse file
              </span>
              <span className="text-slate-500 dark:text-slate-400"> or drag and drop</span>
              <input
                type="file"
                accept=".json,.xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">Supported formats: .JSON, .XLSX, .CSV</p>

            {selectedFile && (
              <div className="mt-4 p-2.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl font-bold inline-flex items-center space-x-2 text-xs">
                <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={startImportProcess}
              disabled={!selectedFile || isProcessing}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-40"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Execute Import</span>
            </button>
          </div>
        </div>

        {/* Import Summary Result Banner */}
        {importSummary && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Import Execution Summary</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-400 block">Members Imported:</span>
                <span className="font-bold">{importSummary.importedMembersCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Payments Imported:</span>
                <span className="font-bold">{importSummary.importedPaymentsCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Skipped:</span>
                <span className="font-bold">{importSummary.skippedMembersCount + importSummary.skippedPaymentsCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Errors:</span>
                <span className="font-bold text-rose-500">{importSummary.errors.length}</span>
              </div>
            </div>

            {importSummary.errors.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400">
                <span className="font-bold block">Error details:</span>
                <ul className="list-disc list-inside">
                  {importSummary.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Replace Confirmation Modal */}
      <ConfirmModal
        isOpen={showReplaceConfirm}
        onClose={() => setShowReplaceConfirm(false)}
        onConfirm={async () => {
          setShowReplaceConfirm(false);
          await executeImport();
        }}
        title="Warning: Replace All Data?"
        message="Selecting 'Replace' will permanently erase all current gym members and payment logs before importing the new file. Are you absolutely sure?"
        confirmText="Erase & Replace All"
        isDanger={true}
      />
    </div>
  );
};
