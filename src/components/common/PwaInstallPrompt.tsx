import React, { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const promptRef = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Avoid running prompt inside cross-origin iframe
    let isIframe = false;
    try {
      isIframe = window.self !== window.top;
    } catch {
      isIframe = true;
    }

    if (isIframe) {
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      // Store event in ref instead of state to prevent React from inspecting cross-origin window properties
      promptRef.current = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = promptRef.current;
    if (!promptEvent) return;
    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === 'accepted') {
        promptRef.current = null;
        setCanInstall(false);
      }
    } catch (err) {
      console.error('Failed to trigger PWA install prompt:', err);
    }
  };

  if (!canInstall || isDismissed) return null;

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
