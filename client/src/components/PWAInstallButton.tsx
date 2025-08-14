import React, { useEffect, useMemo, useState } from 'react';
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
  const [showHelp, setShowHelp] = useState(false);

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

    // If the event fired before React mounted, pick it up from window
    const w = window as any;
    if (w.__ud_bip) {
      setDeferredPrompt(w.__ud_bip as BeforeInstallPromptEvent);
      setCanInstall(true);
    }
    // Subscribe to future early captures
    if (Array.isArray(w.__ud_bip_listeners)) {
      const listener = (e: Event) => onBeforeInstallPrompt(e);
      w.__ud_bip_listeners.push(listener);
      return () => {
        window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.removeEventListener('appinstalled', onAppInstalled);
        // remove our listener from the array
        const arr: any[] = w.__ud_bip_listeners;
        const idx = arr.indexOf(listener);
        if (idx >= 0) arr.splice(idx, 1);
      };
    }

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
  // Fallback for Android when beforeinstallprompt didn't fire yet
  const isStandalone = useMemo(() => {
    try {
      return (
        window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
      ) || (navigator as any).standalone === true;
    } catch {
      return false;
    }
  }, []);
  const isAndroid = useMemo(() => /Android/i.test(navigator.userAgent), []);

  if (installed) return null;
  if (!canInstall && !(isAndroid && !isStandalone)) return null;

  return (
    <div className={className}>
      {canInstall ? (
        <Button onClick={handleInstall} className={`bg-orange-600 hover:bg-orange-700 text-white font-sarabun`} size="sm">
          <Download className="h-4 w-4 mr-2" /> ติดตั้งแอป
        </Button>
      ) : (
        <div className="space-y-2">
          <Button
            onClick={() => setShowHelp((v) => !v)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-sarabun"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" /> วิธีติดตั้งบน Android
          </Button>
          {showHelp && (
            <div className="text-sm rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-800 shadow-sm">
              <ol className="list-decimal list-inside space-y-1">
                <li>เปิดเมนู ⋮ ที่มุมขวาบนของ Chrome</li>
                <li>เลือก “Add to Home screen” หรือ “ติดตั้งแอป”</li>
                <li>กดยืนยันเพื่อติดตั้ง</li>
              </ol>
              <p className="mt-2 text-xs text-orange-700">หมายเหตุ: ปุ่มติดตั้งแบบอัตโนมัติจะปรากฏเมื่อระบบพร้อม (มี Service Worker และเปิดผ่าน HTTPS)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
