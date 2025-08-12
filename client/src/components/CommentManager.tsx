import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, CheckCircle, XCircle, Trash2, Search, Filter, Eye } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  author: string;
  authorEmail: string;
  newsTitle: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  createdAt: string;
  ipAddress: string;
}

export default function CommentManager() {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComments, setSelectedComments] = useState<string[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockComments: Comment[] = [
      {
        id: '1',
        content: 'ข่าวดีมากครับ ข้อมูลครบถ้วน',
        author: 'สมชาย ใจดี',
        authorEmail: 'somchai@example.com',
        newsTitle: 'ข่าวเศรษฐกิจประจำวัน',
        status: 'pending',
        createdAt: '2024-12-19 10:30:00',
        ipAddress: '192.168.1.100'
      },
      {
        id: '2',
        content: 'ขอบคุณสำหรับข้อมูลที่เป็นประโยชน์',
        author: 'สมหญิง รักดี',
        authorEmail: 'somying@example.com',
        newsTitle: 'ข่าวกีฬา',
        status: 'approved',
        createdAt: '2024-12-18 15:45:00',
        ipAddress: '192.168.1.101'
      },
      {
        id: '3',
        content: 'ขายของราคาถูก ดูที่เว็บเรา',
        author: 'โจรสลัด',
        authorEmail: 'spam@spam.com',
        newsTitle: 'ข่าวการเมือง',
        status: 'spam',
        createdAt: '2024-12-17 09:15:00',
        ipAddress: '192.168.1.102'
      }
    ];
    setComments(mockComments);
    setIsLoading(false);
  }, []);

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.newsTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || comment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (commentId: string, newStatus: string) => {
    try {
      // Mock API call
      setComments(comments.map(comment =>
        comment.id === commentId ? { ...comment, status: newStatus as any } : comment
      ));
      
      toast({
        title: "อัปเดตสถานะสำเร็จ",
        description: `ความคิดเห็นถูกอัปเดตเป็น ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive"
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      // Mock API call
      setComments(comments.filter(comment => comment.id !== commentId));
      
      toast({
        title: "ลบความคิดเห็นสำเร็จ",
        description: "ความคิดเห็นถูกลบเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบความคิดเห็นได้",
        variant: "destructive"
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedComments.length === 0) {
      toast({
        title: "ไม่มีการเลือก",
        description: "กรุณาเลือกความคิดเห็นที่ต้องการดำเนินการ",
        variant: "destructive"
      });
      return;
    }

    try {
      // Mock API call
      setComments(comments.map(comment =>
        selectedComments.includes(comment.id) 
          ? { ...comment, status: action as any }
          : comment
      ));
      setSelectedComments([]);
      
      toast({
        title: "ดำเนินการสำเร็จ",
        description: `ดำเนินการกับความคิดเห็น ${selectedComments.length} รายการ`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการได้",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">รออนุมัติ</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge variant="destructive">ถูกปฏิเสธ</Badge>;
      case 'spam':
        return <Badge variant="outline" className="border-red-500 text-red-600">สแปม</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'spam':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
          <h2 className="text-2xl font-bold font-kanit text-orange-800">จัดการความคิดเห็น</h2>
          <p className="text-gray-600 font-sarabun">อนุมัติ ปฏิเสธ และจัดการความคิดเห็นของผู้ใช้</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            ทั้งหมด: {comments.length}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            รออนุมัติ: {comments.filter(c => c.status === 'pending').length}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="ค้นหาความคิดเห็น..."
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
                  <SelectItem value="pending">รออนุมัติ</SelectItem>
                  <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="rejected">ถูกปฏิเสธ</SelectItem>
                  <SelectItem value="spam">สแปม</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedComments.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  เลือกแล้ว {selectedComments.length} รายการ
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('approved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    อนุมัติทั้งหมด
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    ปฏิเสธทั้งหมด
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('spam')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    มาร์คเป็นสแปม
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedComments.length === filteredComments.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedComments(filteredComments.map(c => c.id));
                      } else {
                        setSelectedComments([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>ความคิดเห็น</TableHead>
                <TableHead>ผู้แสดงความคิดเห็น</TableHead>
                <TableHead>ข่าว</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedComments([...selectedComments, comment.id]);
                        } else {
                          setSelectedComments(selectedComments.filter(id => id !== comment.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm line-clamp-2">{comment.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{comment.author}</p>
                      <p className="text-xs text-gray-500">{comment.authorEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600">{comment.newsTitle}</p>
                  </TableCell>
                  <TableCell>{getStatusBadge(comment.status)}</TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600">{comment.createdAt}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-gray-500 font-mono">{comment.ipAddress}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {comment.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(comment.id, 'approved')}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(comment.id, 'rejected')}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันการลบความคิดเห็น</AlertDialogTitle>
                            <AlertDialogDescription>
                              คุณต้องการลบความคิดเห็นนี้หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                              ลบความคิดเห็น
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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