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
import { Mail, Users, Send, Trash2, Search, Filter, Plus, Eye, Download } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribedAt: string;
  lastEmailSent?: string;
  openRate: number;
  clickRate: number;
}

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
}

export default function NewsletterManager() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [isAddSubscriberDialogOpen, setIsAddSubscriberDialogOpen] = useState(false);
  const [isSendNewsletterDialogOpen, setIsSendNewsletterDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  });
  const [newsletterForm, setNewsletterForm] = useState({
    subject: '',
    content: '',
    scheduledAt: ''
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockSubscribers: Subscriber[] = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'สมชาย ใจดี',
        status: 'active',
        subscribedAt: '2024-01-01',
        lastEmailSent: '2024-12-18',
        openRate: 85,
        clickRate: 12
      },
      {
        id: '2',
        email: 'user2@example.com',
        name: 'สมหญิง รักดี',
        status: 'active',
        subscribedAt: '2024-01-15',
        lastEmailSent: '2024-12-18',
        openRate: 92,
        clickRate: 18
      },
      {
        id: '3',
        email: 'user3@example.com',
        name: 'สมศักดิ์ เก่งดี',
        status: 'unsubscribed',
        subscribedAt: '2024-02-01',
        lastEmailSent: '2024-12-10',
        openRate: 45,
        clickRate: 5
      }
    ];

    const mockNewsletters: Newsletter[] = [
      {
        id: '1',
        subject: 'ข่าวประจำสัปดาห์ - สัปดาห์ที่ 50',
        content: 'สรุปข่าวสำคัญประจำสัปดาห์...',
        status: 'sent',
        sentAt: '2024-12-18 09:00:00',
        recipientCount: 1250,
        openCount: 1062,
        clickCount: 187
      },
      {
        id: '2',
        subject: 'ข่าวเศรษฐกิจประจำเดือน',
        content: 'สรุปข่าวเศรษฐกิจประจำเดือนธันวาคม...',
        status: 'scheduled',
        scheduledAt: '2024-12-25 08:00:00',
        recipientCount: 1250,
        openCount: 0,
        clickCount: 0
      },
      {
        id: '3',
        subject: 'ข่าวกีฬาประจำวัน',
        content: 'ข่าวกีฬาล่าสุด...',
        status: 'draft',
        recipientCount: 0,
        openCount: 0,
        clickCount: 0
      }
    ];

    setSubscribers(mockSubscribers);
    setNewsletters(mockNewsletters);
    setIsLoading(false);
  }, []);

  const filteredSubscribers = subscribers.filter(subscriber =>
    subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscriber.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubscriber = async () => {
    try {
      // Mock API call
      const newSubscriber: Subscriber = {
        id: Date.now().toString(),
        email: formData.email,
        name: formData.name,
        status: 'active',
        subscribedAt: new Date().toISOString().split('T')[0],
        openRate: 0,
        clickRate: 0
      };
      
      setSubscribers([...subscribers, newSubscriber]);
      setIsAddSubscriberDialogOpen(false);
      setFormData({ email: '', name: '' });
      
      toast({
        title: "เพิ่มสมาชิกสำเร็จ",
        description: `สมาชิก ${newSubscriber.email} ถูกเพิ่มเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มสมาชิกได้",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubscriber = async (subscriberId: string) => {
    try {
      // Mock API call
      const subscriberToDelete = subscribers.find(s => s.id === subscriberId);
      setSubscribers(subscribers.filter(s => s.id !== subscriberId));
      
      toast({
        title: "ลบสมาชิกสำเร็จ",
        description: `สมาชิก ${subscriberToDelete?.email} ถูกลบเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบสมาชิกได้",
        variant: "destructive"
      });
    }
  };

  const handleSendNewsletter = async () => {
    try {
      // Mock API call
      const newNewsletter: Newsletter = {
        id: Date.now().toString(),
        subject: newsletterForm.subject,
        content: newsletterForm.content,
        status: 'scheduled',
        scheduledAt: newsletterForm.scheduledAt,
        recipientCount: subscribers.filter(s => s.status === 'active').length,
        openCount: 0,
        clickCount: 0
      };
      
      setNewsletters([...newsletters, newNewsletter]);
      setIsSendNewsletterDialogOpen(false);
      setNewsletterForm({ subject: '', content: '', scheduledAt: '' });
      
      toast({
        title: "ส่งจดหมายข่าวสำเร็จ",
        description: `จดหมายข่าว "${newNewsletter.subject}" ถูกส่งเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งจดหมายข่าวได้",
        variant: "destructive"
      });
    }
  };

  const exportSubscribers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Email,Name,Status,Subscribed At,Open Rate,Click Rate\n"
      + subscribers.map(s => 
          `${s.email},${s.name},${s.status},${s.subscribedAt},${s.openRate}%,${s.clickRate}%`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์ CSV ถูกดาวน์โหลดเรียบร้อยแล้ว",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">ใช้งาน</Badge>;
      case 'unsubscribed':
        return <Badge variant="secondary">ยกเลิกการสมัคร</Badge>;
      case 'bounced':
        return <Badge variant="destructive">ส่งไม่สำเร็จ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNewsletterStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">ร่าง</Badge>;
      case 'scheduled':
        return <Badge variant="default" className="bg-blue-600">กำหนดส่ง</Badge>;
      case 'sent':
        return <Badge variant="default" className="bg-green-600">ส่งแล้ว</Badge>;
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
          <h2 className="text-2xl font-bold font-kanit text-orange-800">จัดการจดหมายข่าว</h2>
          <p className="text-gray-600 font-sarabun">จัดการสมาชิกและส่งจดหมายข่าว</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportSubscribers}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออกข้อมูล
          </Button>
          <Dialog open={isAddSubscriberDialogOpen} onOpenChange={setIsAddSubscriberDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มสมาชิก
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มสมาชิกใหม่</DialogTitle>
                <DialogDescription>เพิ่มสมาชิกใหม่สำหรับจดหมายข่าว</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">ชื่อ</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="กรอกชื่อ"
                  />
                </div>
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="กรอกอีเมล"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddSubscriberDialogOpen(false)}>ยกเลิก</Button>
                <Button onClick={handleAddSubscriber}>เพิ่มสมาชิก</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isSendNewsletterDialogOpen} onOpenChange={setIsSendNewsletterDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Send className="h-4 w-4 mr-2" />
                ส่งจดหมายข่าว
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>ส่งจดหมายข่าวใหม่</DialogTitle>
                <DialogDescription>สร้างและส่งจดหมายข่าวไปยังสมาชิก</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newsletter-subject">หัวข้อ</Label>
                  <Input
                    id="newsletter-subject"
                    value={newsletterForm.subject}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, subject: e.target.value })}
                    placeholder="กรอกหัวข้อจดหมายข่าว"
                  />
                </div>
                <div>
                  <Label htmlFor="newsletter-content">เนื้อหา</Label>
                  <Textarea
                    id="newsletter-content"
                    value={newsletterForm.content}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, content: e.target.value })}
                    placeholder="กรอกเนื้อหาจดหมายข่าว"
                    rows={8}
                  />
                </div>
                <div>
                  <Label htmlFor="newsletter-schedule">กำหนดส่ง (เว้นว่างเพื่อส่งทันที)</Label>
                  <Input
                    id="newsletter-schedule"
                    type="datetime-local"
                    value={newsletterForm.scheduledAt}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, scheduledAt: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSendNewsletterDialogOpen(false)}>ยกเลิก</Button>
                <Button onClick={handleSendNewsletter}>ส่งจดหมายข่าว</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{subscribers.length}</p>
                <p className="text-sm text-gray-600">สมาชิกทั้งหมด</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{subscribers.filter(s => s.status === 'active').length}</p>
                <p className="text-sm text-gray-600">สมาชิกที่ใช้งาน</p>
              </div>
              <Mail className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{newsletters.filter(n => n.status === 'sent').length}</p>
                <p className="text-sm text-gray-600">จดหมายที่ส่งแล้ว</p>
              </div>
              <Send className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{newsletters.filter(n => n.status === 'scheduled').length}</p>
                <p className="text-sm text-gray-600">รอส่ง</p>
              </div>
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="ค้นหาสมาชิก..."
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
                  <SelectItem value="unsubscribed">ยกเลิกการสมัคร</SelectItem>
                  <SelectItem value="bounced">ส่งไม่สำเร็จ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่สมัคร</TableHead>
                <TableHead>อีเมลล่าสุด</TableHead>
                <TableHead>อัตราการเปิด</TableHead>
                <TableHead>อัตราการคลิก</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.name}</TableCell>
                  <TableCell>{subscriber.email}</TableCell>
                  <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                  <TableCell>{subscriber.subscribedAt}</TableCell>
                  <TableCell>{subscriber.lastEmailSent || '-'}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${subscriber.openRate > 70 ? 'text-green-600' : subscriber.openRate > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {subscriber.openRate}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${subscriber.clickRate > 10 ? 'text-green-600' : subscriber.clickRate > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {subscriber.clickRate}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ยืนยันการลบสมาชิก</AlertDialogTitle>
                          <AlertDialogDescription>
                            คุณต้องการลบสมาชิก {subscriber.name} หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSubscriber(subscriber.id)}>
                            ลบสมาชิก
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

      {/* Newsletters Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">จดหมายข่าว</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หัวข้อ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>จำนวนผู้รับ</TableHead>
                <TableHead>อัตราการเปิด</TableHead>
                <TableHead>อัตราการคลิก</TableHead>
                <TableHead>วันที่ส่ง/กำหนดส่ง</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsletters.map((newsletter) => (
                <TableRow key={newsletter.id}>
                  <TableCell className="font-medium">{newsletter.subject}</TableCell>
                  <TableCell>{getNewsletterStatusBadge(newsletter.status)}</TableCell>
                  <TableCell>{newsletter.recipientCount.toLocaleString()}</TableCell>
                  <TableCell>
                    {newsletter.status === 'sent' ? (
                      <span className="font-medium text-green-600">
                        {Math.round((newsletter.openCount / newsletter.recipientCount) * 100)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {newsletter.status === 'sent' ? (
                      <span className="font-medium text-blue-600">
                        {Math.round((newsletter.clickCount / newsletter.recipientCount) * 100)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {newsletter.status === 'sent' 
                      ? newsletter.sentAt 
                      : newsletter.status === 'scheduled' 
                        ? newsletter.scheduledAt 
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