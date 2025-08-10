import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Info, 
  X,
  Zap,
  Waves,
  CloudRain,
  Flame,
  Mountain
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface DisasterAlert {
  id: string;
  type: 'earthquake' | 'flood' | 'storm' | 'fire' | 'tsunami' | 'drought' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  area: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  startTime: string;
  endTime?: string;
  instructions: string;
  source: string;
  isActive: boolean;
}

interface DisasterAlertWidgetProps {
  compact?: boolean;
}

const DisasterAlertWidget = ({ compact = false }: DisasterAlertWidgetProps) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['/api/disaster-alerts/active'],
    queryFn: () => apiRequest('/api/disaster-alerts/active'),
    refetchInterval: 5 * 60 * 1000, // รีเฟรชทุก 5 นาที
  });

  const activeAlerts = alerts.filter((alert: DisasterAlert) => 
    !dismissedAlerts.includes(alert.id)
  );

  const getIcon = (type: string) => {
    const icons: Record<string, any> = {
      earthquake: Mountain,
      flood: Waves,
      storm: CloudRain,
      fire: Flame,
      tsunami: Waves,
      drought: Zap,
      other: AlertTriangle
    };
    const IconComponent = icons[type] || AlertTriangle;
    return <IconComponent className="h-5 w-5" />;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500', 
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getSeverityText = (severity: string) => {
    const texts: Record<string, string> = {
      low: 'ต่ำ',
      medium: 'ปานกลาง',
      high: 'สูง',
      critical: 'วิกฤต'
    };
    return texts[severity] || severity;
  };

  const getDisasterTypeName = (type: string) => {
    const types: Record<string, string> = {
      earthquake: 'แผ่นดินไหว',
      flood: 'น้ำท่วม',
      storm: 'พายุฝนฟ้าคะนอง',
      fire: 'ไฟป่า',
      tsunami: 'คลื่นสึนามิ',
      drought: 'ภัยแล้ง',
      other: 'ภัยพิบัติอื่นๆ'
    };
    return types[type] || type;
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    toast({
      title: "ซ่อนการเตือนภัย",
      description: "คุณจะไม่เห็นการเตือนนี้อีกในเซสชันนี้",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return null;
  }

  // Compact mode for header
  if (compact) {
    const criticalAlerts = activeAlerts.filter((alert: DisasterAlert) => alert.severity === 'critical');
    const highAlerts = activeAlerts.filter((alert: DisasterAlert) => alert.severity === 'high');
    const urgentAlerts = [...criticalAlerts, ...highAlerts];
    
    if (urgentAlerts.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
          {urgentAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {urgentAlerts.length}
            </span>
          )}
        </div>
        <Link to="/disaster-alert/latest" className="text-sm text-red-600 hover:underline">
          ภัยพิบัติ
        </Link>
      </div>
    );
  }

  if (activeAlerts.length === 0) {
    return <div className="p-4 text-center text-gray-500">ไม่มีการแจ้งเตือนภัยพิบัติ</div>;
  }

  return (
    <div className="space-y-4">
      {activeAlerts.map((alert: DisasterAlert) => (
        <Card key={alert.id} className={`border-l-4 ${
          alert.severity === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' :
          alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20' :
          alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
          'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
        } shadow-lg animate-pulse`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full text-white ${getSeverityColor(alert.severity)}`}>
                  {getIcon(alert.type)}
                </div>
                <div>
                  <CardTitle className="text-lg font-kanit flex items-center gap-2">
                    🚨 {alert.title}
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {getSeverityText(alert.severity)}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-sarabun mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alert.area}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(alert.startTime)}
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => dismissAlert(alert.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription className="font-sarabun">
                <strong>รายละเอียด:</strong> {alert.description}
              </AlertDescription>
            </Alert>

            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
              <h4 className="font-semibold font-kanit mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                คำแนะนำด่วน:
              </h4>
              <p className="text-sm font-sarabun text-muted-foreground">
                {alert.instructions}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-muted-foreground font-sarabun">
                ข้อมูลจาก: {alert.source}
                {alert.endTime && (
                  <span className="ml-2">
                    สิ้นสุด: {formatTime(alert.endTime)}
                  </span>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {getDisasterTypeName(alert.type)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DisasterAlertWidget;