import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Share2 } from 'lucide-react';

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS && isSafari;
}

function isInStandaloneMode(): boolean {
  // iOS Safari flag
  const isStandalone = (window.navigator as any).standalone === true;
  // PWA display mode media query
  const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return isStandalone || isDisplayStandalone;
}

export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('iosInstallBannerDismissed') === '1';
    if (!dismissed && isIosSafari() && !isInStandaloneMode()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="w-full bg-orange-50 border-b border-orange-200 text-orange-900">
      <div className="container mx-auto px-4 py-3 flex items-start gap-3">
        <div className="mt-1">
          <Share2 className="h-5 w-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <p className="font-sarabun text-sm mb-1">
            เพิ่ม UD News ลงหน้าจอโฮมเพื่อใช้งานเหมือนแอป
          </p>
          <ol className="list-decimal list-inside text-xs text-gray-700 space-y-0.5 font-sarabun">
            <li>แตะปุ่ม “แชร์” ที่แถบล่าง (ไอคอนสี่เหลี่ยมมีลูกศรขึ้น)</li>
            <li>เลื่อนลงแล้วเลือก “Add to Home Screen”</li>
            <li>กด “Add” เพื่อยืนยัน</li>
          </ol>
        </div>
        <div>
          <Button
            variant="ghost"
            size="icon"
            className="text-orange-700 hover:text-orange-900"
            onClick={() => {
              localStorage.setItem('iosInstallBannerDismissed', '1');
              setVisible(false);
            }}
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
