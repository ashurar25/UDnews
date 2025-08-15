
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, MailOpen, Calendar, User, AtSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

const ContactMessagesManager = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<ContactMessage[]>("/api/contact-messages");
      setMessages(data);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อความติดต่อได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/api/contact-messages/${id}/read`);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === id ? { ...msg, isRead: true } : msg
          )
        );
        toast({
          title: "สำเร็จ",
          description: "ทำเครื่องหมายอ่านแล้ว",
        });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทำเครื่องหมายอ่านได้",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (id: number) => {
    try {
      await api.delete(`/api/contact-messages/${id}`);
        setMessages(prev => prev.filter(msg => msg.id !== id));
        toast({
          title: "สำเร็จ",
          description: "ลบข้อความแล้ว",
        });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อความได้",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold font-kanit text-orange-800">
            ข้อความติดต่อ
          </h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="font-sarabun">
              ใหม่ {unreadCount}
            </Badge>
          )}
        </div>
        <Button 
          onClick={fetchMessages} 
          variant="outline" 
          size="sm"
          className="font-sarabun"
        >
          รีเฟรช
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="font-sarabun text-muted-foreground">กำลังโหลด...</p>
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-sarabun text-muted-foreground">ยังไม่มีข้อความติดต่อ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <Card key={message.id} className={`${!message.isRead ? 'border-orange-300 bg-orange-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold font-sarabun">{message.name}</span>
                      {!message.isRead && (
                        <Badge variant="destructive" className="text-xs font-sarabun">
                          ใหม่
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AtSign className="h-3 w-3" />
                      <span className="font-sarabun">{message.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className="font-sarabun">{formatDate(message.createdAt)}</span>
                    </div>
                    
                    <p className="font-sarabun text-sm bg-white p-3 rounded border">
                      {message.message.length > 150 
                        ? `${message.message.substring(0, 150)}...` 
                        : message.message
                      }
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="font-sarabun"
                          onClick={() => {
                            setSelectedMessage(message);
                            if (!message.isRead) {
                              markAsRead(message.id);
                            }
                          }}
                        >
                          {message.isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="font-kanit">ข้อความจาก {message.name}</DialogTitle>
                          <DialogDescription className="font-sarabun">
                            ส่งเมื่อ {formatDate(message.createdAt)}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-semibold font-sarabun">อีเมล:</label>
                            <p className="font-sarabun">{message.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold font-sarabun">ข้อความ:</label>
                            <p className="font-sarabun bg-gray-50 p-4 rounded whitespace-pre-wrap">
                              {message.message}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {!message.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(message.id)}
                        className="font-sarabun text-green-600 border-green-300 hover:bg-green-50"
                      >
                        ทำเครื่องหมายอ่านแล้ว
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="font-sarabun text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-kanit">ยืนยันการลบ</AlertDialogTitle>
                          <AlertDialogDescription className="font-sarabun">
                            คุณแน่ใจหรือไม่ที่จะลบข้อความนี้? การกระทำนี้ไม่สามารถยกเลิกได้
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="font-sarabun">ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteMessage(message.id)}
                            className="font-sarabun bg-red-600 hover:bg-red-700"
                          >
                            ลบ
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactMessagesManager;
