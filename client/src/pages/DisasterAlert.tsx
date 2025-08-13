
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  ArrowLeft,
  Info,
  Phone,
  Navigation
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

const DisasterAlert = () => {
  const { id } = useParams();
  
  const { data: alert, isLoading, error } = useQuery({
    queryKey: [`/api/disaster-alerts/${id}`],
    queryFn: () => apiRequest(`/api/disaster-alerts/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-kanit mb-4">ไม่พบข้อมูลการเตือนภัย</h1>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
      medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20', 
      high: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
      critical: 'border-red-500 bg-red-50 dark:bg-red-950/20'
    };
    return colors[severity] || 'border-gray-500 bg-gray-50';
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

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>

        <Card className={`border-l-4 ${getSeverityColor(alert.severity)} shadow-lg`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-kanit flex items-center gap-3">
                  🚨 {alert.title}
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {getSeverityText(alert.severity)}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-6 text-muted-foreground font-sarabun mt-2">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {alert.area}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatTime(alert.startTime)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription className="font-sarabun text-base">
                <strong>รายละเอียด:</strong> {alert.description}
              </AlertDescription>
            </Alert>

            {/* Instructions */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-6">
              <h3 className="font-semibold font-kanit mb-3 flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                คำแนะนำด่วน:
              </h3>
              <p className="font-sarabun text-base leading-relaxed">
                {alert.instructions}
              </p>
            </div>

            {/* Coordinates */}
            {alert.coordinates && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                <h4 className="font-semibold font-kanit mb-2 flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  พิกัดตำแหน่ง:
                </h4>
                <p className="font-sarabun text-sm text-muted-foreground">
                  ละติจูด: {alert.coordinates.lat.toFixed(4)}, ลองจิจูด: {alert.coordinates.lng.toFixed(4)}
                </p>
              </div>
            )}

            {/* Emergency Contacts */}
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 mb-6">
              <h4 className="font-semibold font-kanit mb-3 flex items-center gap-2 text-red-800 dark:text-red-200">
                <Phone className="h-4 w-4" />
                หมายเลขโทรศัพท์ฉุกเฉิน:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sarabun text-sm">
                <div>
                  <strong>ศูนย์เตือนภัย 1784</strong><br />
                  <span className="text-red-600 dark:text-red-300">โทรฟรี 24 ชั่วโมง</span>
                </div>
                <div>
                  <strong>หน่วยกู้ภัย 1669</strong><br />
                  <span className="text-red-600 dark:text-red-300">โทรฟรี 24 ชั่วโมง</span>
                </div>
                <div>
                  <strong>สายด่วนตำรวจ 191</strong><br />
                  <span className="text-red-600 dark:text-red-300">โทรฟรี 24 ชั่วโมง</span>
                </div>
                <div>
                  <strong>สายด่วนดับเพลิง 199</strong><br />
                  <span className="text-red-600 dark:text-red-300">โทรฟรี 24 ชั่วโมง</span>
                </div>
              </div>
            </div>

            {/* Source Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground font-sarabun">
              <div>
                ข้อมูลจาก: <strong>{alert.source}</strong>
              </div>
              {alert.endTime && (
                <div>
                  สิ้นสุดการเตือน: <strong>{formatTime(alert.endTime)}</strong>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DisasterAlert;
