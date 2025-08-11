
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemStatus {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastCheck: string;
}

export default function SystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const checkSystemHealth = async () => {
    setIsLoading(true);
    const checks: SystemStatus[] = [];

    try {
      // Check API Health
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        checks.push({
          service: 'API Server',
          status: 'healthy',
          message: 'API เชื่อมต่อปกติ',
          lastCheck: new Date().toLocaleString('th-TH')
        });
      } else {
        checks.push({
          service: 'API Server',
          status: 'error',
          message: 'API ไม่ตอบสนอง',
          lastCheck: new Date().toLocaleString('th-TH')
        });
      }

      // Check Disaster Alerts
      try {
        const alertResponse = await fetch('/api/disaster-alerts/active');
        if (alertResponse.ok) {
          checks.push({
            service: 'Disaster Alerts',
            status: 'healthy',
            message: 'ระบบเตือนภัยทำงานปกติ',
            lastCheck: new Date().toLocaleString('th-TH')
          });
        } else {
          checks.push({
            service: 'Disaster Alerts',
            status: 'error',
            message: 'ระบบเตือนภัยมีปัญหา',
            lastCheck: new Date().toLocaleString('th-TH')
          });
        }
      } catch (error) {
        checks.push({
          service: 'Disaster Alerts',
          status: 'error',
          message: 'ไม่สามารถเชื่อมต่อระบบเตือนภัย',
          lastCheck: new Date().toLocaleString('th-TH')
        });
      }

      // Check RSS Status
      try {
        const rssResponse = await fetch('/api/rss/status');
        if (rssResponse.ok) {
          const rssData = await rssResponse.json();
          checks.push({
            service: 'RSS Processing',
            status: rssData.isProcessing ? 'warning' : 'healthy',
            message: rssData.isProcessing ? 'กำลังประมวลผล RSS' : 'RSS พร้อมใช้งาน',
            lastCheck: new Date().toLocaleString('th-TH')
          });
        } else {
          checks.push({
            service: 'RSS Processing',
            status: 'error',
            message: 'ระบบ RSS มีปัญหา',
            lastCheck: new Date().toLocaleString('th-TH')
          });
        }
      } catch (error) {
        checks.push({
          service: 'RSS Processing',
          status: 'error',
          message: 'ไม่สามารถตรวจสอบสถานะ RSS',
          lastCheck: new Date().toLocaleString('th-TH')
        });
      }

      // Check Database
      try {
        const newsResponse = await fetch('/api/news?limit=1');
        if (newsResponse.ok) {
          checks.push({
            service: 'Database',
            status: 'healthy',
            message: 'ฐานข้อมูลเชื่อมต่อปกติ',
            lastCheck: new Date().toLocaleString('th-TH')
          });
        } else {
          checks.push({
            service: 'Database',
            status: 'error',
            message: 'ฐานข้อมูลมีปัญหา',
            lastCheck: new Date().toLocaleString('th-TH')
          });
        }
      } catch (error) {
        checks.push({
          service: 'Database',
          status: 'error',
          message: 'ไม่สามารถเชื่อมต่อฐานข้อมูล',
          lastCheck: new Date().toLocaleString('th-TH')
        });
      }

      setSystemStatus(checks);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตรวจสอบสถานะระบบได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">ปกติ</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">เตือน</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">ข้อผิดพลาด</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">สถานะระบบ</h1>
        <Button 
          onClick={checkSystemHealth} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          ตรวจสอบใหม่
        </Button>
      </div>

      <div className="grid gap-4">
        {systemStatus.map((system, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getStatusIcon(system.status)}
                  {system.service}
                </CardTitle>
                {getStatusBadge(system.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">{system.message}</p>
              <p className="text-sm text-gray-500">ตรวจสอบล่าสุด: {system.lastCheck}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-600">กำลังตรวจสอบสถานะระบบ...</p>
        </div>
      )}
    </div>
  );
}
