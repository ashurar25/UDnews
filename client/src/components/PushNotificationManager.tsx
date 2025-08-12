import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Trash2, Search, Filter, Plus, Eye, Users, Target, Clock } from "lucide-react";

interface PushSubscription {
  id: string;
  endpoint: string;
  auth: string;
  p256dh: string;
  userId?: string;
  userAgent: string;
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'inactive' | 'expired';
}

interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
}

export default function PushNotificationManager() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSendNotificationDialogOpen, setIsSendNotificationDialogOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: '',
    icon: '',
    badge: '',
    image: '',
    url: '',
    scheduledAt: ''
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockSubscriptions: PushSubscription[] = [
      {
        id: '1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/...',
        auth: 'auth_token_1',
        p256dh: 'p256dh_key_1',
        userId: 'user1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: '2024-01-01',
        lastUsed: '2024-12-19 10:30:00',
        status: 'active'
      },
      {
        id: '2',
        endpoint: 'https://fcm.googleapis.com/fcm/send/...',
        auth: 'auth_token_2',
        p256dh: 'p256dh_key_2',
        userId: 'user2',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        createdAt: '2024-01-15',
        lastUsed: '2024-12-18 15:45:00',
        status: 'active'
      },
      {
        id: '3',
        endpoint: 'https://fcm.googleapis.com/fcm/send/...',
        auth: 'auth_token_3',
        p256dh: 'p256dh_key_3',
        userId: 'user3',
        userAgent: 'Mozilla/5.0 (Android 13; Mobile; rv:120.0)',
        createdAt: '2024-02-01',
        lastUsed: '2024-12-10 09:15:00',
        status: 'expired'
      }
    ];

    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'ข่าวด่วน!',
        body: 'มีข่าวสำคัญที่เพิ่งเกิดขึ้น',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        status: 'sent',
        sentAt: '2024-12-19 10:00:00',
        recipientCount: 1250,
        deliveredCount: 1180,
        openedCount: 890,
        clickedCount: 156
      },
      {
        id: '2',
        title: 'ข่าวประจำวัน',
        body: 'สรุปข่าวสำคัญประจำวันที่ 19 ธันวาคม',
        icon: '/icon-192x192.png',
        status: 'scheduled',
        scheduledAt: '2024-12-20 08:00:00',
        recipientCount: 1250,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0
      },
      {
        id: '3',
        title: 'ข่าวกีฬา',
        body: 'ผลการแข่งขันล่าสุด',
        icon: '/icon-192x192.png',
        status: 'draft',
        recipientCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0
      }
    ];

    setSubscriptions(mockSubscriptions);
    setNotifications(mockNotifications);
    setIsLoading(false);
  }, []);

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.userAgent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendNotification = async () => {
    try {
      // Mock API call
      const newNotification: Notification = {
        id: Date.now().toString(),
        title: notificationForm.title,
        body: notificationForm.body,
        icon: notificationForm.icon,
        badge: notificationForm.badge,
        image: notificationForm.image,
        url: notificationForm.url,
        status: notificationForm.scheduledAt ? 'scheduled' : 'sent',
        scheduledAt: notificationForm.scheduledAt,
        sentAt: notificationForm.scheduledAt ? undefined : new Date().toISOString(),
        recipientCount: subscriptions.filter(s => s.status === 'active').length,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0
      };
      
      setNotifications([...notifications, newNotification]);
      setIsSendNotificationDialogOpen(false);
      setNotificationForm({ title: '', body: '', icon: '', badge: '', image: '', url: '', scheduledAt: '' });
      
      toast({
        title: "ส่งการแจ้งเตือนสำเร็จ",
        description: `การแจ้งเตือน "${newNotification.title}" ถูกส่งเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งการแจ้งเตือนได้",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    try {
      // Mock API call
      const subscriptionToDelete = subscriptions.find(s => s.id === subscriptionId);
      setSubscriptions(subscriptions.filter(s => s.id !== subscriptionId));
      
      toast({
        title: "ลบการสมัครสำเร็จ",
        description: `การสมัครการแจ้งเตือนถูกลบเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบการสมัครได้",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">ใช้งาน</Badge>;
      case 'inactive':
        return <Badge variant="secondary">ไม่ใช้งาน</Badge>;
      case 'expired':
        return <Badge variant="destructive">หมดอายุ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNotificationStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">ร่าง</Badge>;
      case 'scheduled':
        return <Badge variant="default" className="bg-blue-600">กำหนดส่ง</Badge>;
      case 'sent':
        return <Badge variant="default" className="bg-green-600">ส่งแล้ว</Badge>;
      case 'failed':
        return <Badge variant="destructive">ล้มเหลว</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-kanit text-orange-800">จัดการการแจ้งเตือน Push</h2>
          <p className="text-gray-600 font-sarabun">จัดการการสมัครและส่งการแจ้งเตือน Push</p>
        </div>
        <Dialog open={isSendNotificationDialogOpen} onOpenChange={setIsSendNotificationDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Send className="h-4 w-4 mr-2" />
              ส่งการแจ้งเตือน
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ส่งการแจ้งเตือน Push</DialogTitle>
              <DialogDescription>สร้างและส่งการแจ้งเตือน Push ไปยังผู้ใช้</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notification-title">หัวข้อ</Label>
                <Input
                  id="notification-title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                  placeholder="กรอกหัวข้อการแจ้งเตือน"
                />
              </div>
              <div>
                <Label htmlFor="notification-body">เนื้อหา</Label>
                <Textarea
                  id="notification-body"
                  value={notificationForm.body}
                  onChange={(e) => setNotificationForm({ ...notificationForm, body: e.target.value })}
                  placeholder="กรอกเนื้อหาการแจ้งเตือน"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notification-icon">ไอคอน (URL)</Label>
                  <Input
                    id="notification-icon"
                    value={notificationForm.icon}
                    onChange={(e) => setNotificationForm({ ...notificationForm, icon: e.target.value })}
                    placeholder="URL ของไอคอน"
                  />
                </div>
                <div>
                  <Label htmlFor="notification-badge">แบดจ์ (URL)</Label>
                  <Input
                    id="notification-badge"
                    value={notificationForm.badge}
                    onChange={(e) => setNotificationForm({ ...notificationForm, badge: e.target.value })}
                    placeholder="URL ของแบดจ์"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notification-image">รูปภาพ (URL)</Label>
                  <Input
                    id="notification-image"
                    value={notificationForm.image}
                    onChange={(e) => setNotificationForm({ ...notificationForm, image: e.target.value })}
                    placeholder="URL ของรูปภาพ"
                  />
                </div>
                <div>
                  <Label htmlFor="notification-url">ลิงก์ (URL)</Label>
                  <Input
                    id="notification-url"
                    value={notificationForm.url}
                    onChange={(e) => setNotificationForm({ ...notificationForm, url: e.target.value })}
                    placeholder="URL ที่จะเปิดเมื่อคลิก"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notification-schedule">กำหนดส่ง (เว้นว่างเพื่อส่งทันที)</Label>
                <Input
                  id="notification-schedule"
                  type="datetime-local"
                  value={notificationForm.scheduledAt}
                  onChange={(e) => setNotificationForm({ ...notificationForm, scheduledAt: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendNotificationDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleSendNotification}>ส่งการแจ้งเตือน</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
                <p className="text-sm text-gray-600">การสมัครทั้งหมด</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'active').length}</p>
                <p className="text-sm text-gray-600">การสมัครที่ใช้งาน</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{notifications.filter(n => n.status === 'sent').length}</p>
                <p className="text-sm text-gray-600">การแจ้งเตือนที่ส่งแล้ว</p>
              </div>
              <Send className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{notifications.filter(n => n.status === 'scheduled').length}</p>
                <p className="text-sm text-gray-600">รอส่ง</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="ค้นหาการสมัคร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">ใช้งาน</SelectItem>
                  <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                  <SelectItem value="expired">หมดอายุ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID ผู้ใช้</TableHead>
                <TableHead>User Agent</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่สมัคร</TableHead>
                <TableHead>ใช้งานล่าสุด</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">{subscription.userId || 'ไม่ระบุ'}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate">{subscription.userAgent}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>{subscription.createdAt}</TableCell>
                  <TableCell>{subscription.lastUsed || '-'}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ยืนยันการลบการสมัคร</AlertDialogTitle>
                          <AlertDialogDescription>
                            คุณต้องการลบการสมัครการแจ้งเตือนนี้หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSubscription(subscription.id)}>
                            ลบการสมัคร
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">การแจ้งเตือน</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หัวข้อ</TableHead>
                <TableHead>เนื้อหา</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>จำนวนผู้รับ</TableHead>
                <TableHead>อัตราการเปิด</TableHead>
                <TableHead>อัตราการคลิก</TableHead>
                <TableHead>วันที่ส่ง/กำหนดส่ง</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">{notification.title}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate">{notification.body}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getNotificationStatusBadge(notification.status)}</TableCell>
                  <TableCell>{notification.recipientCount.toLocaleString()}</TableCell>
                  <TableCell>
                    {notification.status === 'sent' ? (
                      <span className="font-medium text-green-600">
                        {Math.round((notification.openedCount / notification.recipientCount) * 100)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {notification.status === 'sent' ? (
                      <span className="font-medium text-blue-600">
                        {Math.round((notification.clickedCount / notification.recipientCount) * 100)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {notification.status === 'sent' 
                      ? notification.sentAt 
                      : notification.status === 'scheduled' 
                        ? notification.scheduledAt 
                        : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 