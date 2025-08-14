import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// Minimal type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const bip = e as BeforeInstallPromptEvent;
      setDeferredPrompt(bip);
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        // User accepted; button will hide after appinstalled
      }
      setDeferredPrompt(null);
      setCanInstall(false);
    } catch (err) {
      // ignore
    }
  };

  // On iOS Safari, beforeinstallprompt is not supported.
  // Optionally show a hint button to open instructions; keep UI simple for now.

  if (installed || !canInstall) return null;

  return (
    <Button onClick={handleInstall} className={`bg-orange-600 hover:bg-orange-700 text-white font-sarabun ${className}`} size="sm">
      <Download className="h-4 w-4 mr-2" /> ติดตั้งแอป
    </Button>
  );
}
