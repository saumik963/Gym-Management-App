import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { 
  Settings, 
  Dumbbell, 
  DollarSign, 
  Moon, 
  Sun, 
  ShieldAlert, 
  Check, 
  RotateCcw,
  Sparkles 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetAllData } = useSettings();

  const [gymName, setGymName] = useState(settings.gymName);
  const [gymLogo, setGymLogo] = useState(settings.gymLogo || '/logo.webp');
  const [defaultMonthlyFee, setDefaultMonthlyFee] = useState(settings.defaultMonthlyFee);
  const [currency, setCurrency] = useState(settings.currency);
  const [theme, setTheme] = useState(settings.theme);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      gymName,
      gymLogo,
      defaultMonthlyFee,
      currency,
      theme,
      receiptFooter,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetApplication = async () => {
    await resetAllData();
    window.location.reload();
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Gym Branding */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Gym Profile & Branding</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gym Name
              </label>
              <input
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gym Logo URL (Optional)
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={gymLogo}
                onChange={(e) => setGymLogo(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Financial Defaults */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Financial Defaults</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                placeholder="e.g. ৳, $, ₹, €"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Monthly Fee
              </label>
              <input
                type="number"
                value={defaultMonthlyFee}
                onChange={(e) => setDefaultMonthlyFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
              Print Receipt Footer Text
            </label>
            <input
              type="text"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="e.g. Thank you for your payment!"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>
        </div>

        {/* Appearance & Theme */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Moon className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Appearance & Dark Mode</h3>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`px-4 py-2 rounded-xl capitalize transition-all border ${
                  theme === mode
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {mode} Theme
              </button>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>Settings saved successfully!</span>
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-emerald-600/20"
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* Dangerous Reset Area */}
      <div className="mt-8 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-5 border border-rose-200/60 dark:border-rose-900/40 space-y-3">
        <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
          <ShieldAlert className="w-5 h-5" />
          <span>Factory Reset Application</span>
        </div>
        <p className="text-xs text-rose-600/80 dark:text-rose-300/80 leading-relaxed">
          Clears all members, payment histories, and configurations from browser IndexedDB.
        </p>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All Application Data</span>
        </button>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetApplication}
        title="Reset Entire Application Database?"
        message="This will completely wipe all local gym members and payment logs from IndexedDB. This operation cannot be undone unless you have exported a JSON backup file."
        confirmText="Yes, Factory Reset Data"
        isDanger={true}
      />
    </div>
  );
};
