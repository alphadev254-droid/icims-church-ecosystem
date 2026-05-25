import { useState, useEffect } from 'react';
import { Smartphone, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallBanner() {
  const { canInstall, install } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, [canInstall]);

  const handleInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-sidebar text-sidebar-foreground rounded-xl shadow-2xl border border-sidebar-border p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-sidebar-accent flex items-center justify-center">
          <Smartphone className="h-5 w-5 text-sidebar-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Install ICIMS</p>
          <p className="text-xs text-sidebar-foreground/70 mt-0.5">
            Add to your home screen for faster access — works offline too.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="h-7 text-xs px-3 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              onClick={handleInstall}
              disabled={installing}
            >
              <Download className="h-3 w-3 mr-1.5" />
              {installing ? 'Installing…' : 'Install App'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-3 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
