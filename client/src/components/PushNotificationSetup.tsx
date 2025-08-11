import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const PushNotificationSetup = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check if already subscribed
      navigator.serviceWorker.ready.then(registration => {
        return registration.pushManager.getSubscription();
      }).then(subscription => {
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported) throw new Error('Push notifications not supported');

      const registration = await navigator.serviceWorker.ready;
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push notifications
      const vapidPublicKey = 'BP4d_Lmh8hQ6QTK6r5s8zO70KtOYzaCTvkfrrwBCAThqYal_YqWs8aWmyoqjUpAwWmNI2x47vOFMTBQLB2USsUA';
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      // Send subscription to server
      const subscriptionData = {
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')!)))
      };

      return apiRequest('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscriptionData)
      });
    },
    onSuccess: () => {
      setIsSubscribed(true);
      toast({
        title: "เปิดการแจ้งเตือนแล้ว",
        description: "คุณจะได้รับการแจ้งเตือนข่าวด่วนแล้ว",
      });
    },
    onError: (error: any) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถเปิดการแจ้งเตือนได้",
        variant: "destructive",
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        // Optionally notify server about unsubscription
        return apiRequest('/api/push/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
    },
    onSuccess: () => {
      setIsSubscribed(false);
      toast({
        title: "ปิดการแจ้งเตือนแล้ว",
        description: "คุณจะไม่ได้รับการแจ้งเตือนอีกต่อไป",
      });
    },
    onError: (error: any) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถปิดการแจ้งเตือนได้",
        variant: "destructive",
      });
    },
  });

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BellOff className="h-4 w-4" />
            <span className="font-sarabun text-sm">
              เบราว์เซอร์ของคุณไม่สนับสนุนการแจ้งเตือน
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-kanit">
          <Bell className="h-5 w-5 text-primary" />
          การแจ้งเตือนข่าวด่วน
        </CardTitle>
        <p className="text-sm text-muted-foreground font-sarabun">
          รับการแจ้งเตือนเมื่อมีข่าวสำคัญจากอุดรธานี
        </p>
      </CardHeader>
      <CardContent>
        {permission === 'denied' ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive font-sarabun">
              คุณได้ปฏิเสธการแจ้งเตือน กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์
            </p>
            <p className="text-xs text-muted-foreground font-sarabun">
              วิธีเปิดใหม่: ไปที่ Settings → Site Settings → Notifications
            </p>
          </div>
        ) : isSubscribed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <Bell className="h-4 w-4" />
              <span className="font-sarabun text-sm">เปิดการแจ้งเตือนแล้ว</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => unsubscribeMutation.mutate()}
              disabled={unsubscribeMutation.isPending}
              className="gap-2"
            >
              <BellOff className="h-4 w-4" />
              ปิดการแจ้งเตือน
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => subscribeMutation.mutate()}
            disabled={subscribeMutation.isPending}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            {subscribeMutation.isPending ? "กำลังเปิด..." : "เปิดการแจ้งเตือน"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationSetup;