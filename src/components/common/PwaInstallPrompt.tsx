import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt || isDismissed) return null;

  return (
    <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium shadow-md">
      <div className="flex items-center space-x-2">
        <Download className="w-4 h-4 animate-bounce" />
        <span>Install Gym App on your desktop/mobile for fast 100% offline access!</span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleInstallClick}
          className="bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs"
        >
          Install App
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-white/80 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
