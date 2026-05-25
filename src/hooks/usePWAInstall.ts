import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const isChrome = /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent);
  const isEdge = /edg/i.test(navigator.userAgent);
  const isChromiumBased = isChrome || isEdge || /brave/i.test(navigator.userAgent);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) { setIsInstalled(true); return; }

    // Pick up the prompt if it was captured before this component mounted
    if ((window as any).__pwaInstallPrompt) {
      setInstallPrompt((window as any).__pwaInstallPrompt);
    }

    // Also handle the case where it fires after mount
    const onInstallable = () => {
      if ((window as any).__pwaInstallPrompt) {
        setInstallPrompt((window as any).__pwaInstallPrompt);
      }
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('pwa-installable', onInstallable);
    window.addEventListener('pwa-installed', onInstalled);
    return () => {
      window.removeEventListener('pwa-installable', onInstallable);
      window.removeEventListener('pwa-installed', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setInstallPrompt(null); setIsInstalled(true); }
    return outcome === 'accepted';
  };

  const canInstall = !!installPrompt && !isInstalled;
  // Always show the button when app is not installed — iOS/desktop use manual instructions
  const showInstallUI = !isInstalled;

  return { canInstall, install, isInstalled, isIOS, isChromiumBased, showInstallUI };
}
