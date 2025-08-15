import React, { useState, useEffect, useCallback } from 'react';

import { GlassCard, GlassCardHeader } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, CheckCircle, XCircle, Trash2, Search, Filter } from "lucide-react";
import { api } from "@/lib/api";

interface AdminComment {
  id: number;
  content: string;
  authorName: string;
  newsTitle: string;
  isApproved: boolean;
  createdAt: string;
}

export default function CommentManager() {
  const { toast } = useToast();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedComments, setSelectedComments] = useState<number[]>([]);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Backend supports filter=approved|all; we'll use approved when requested, otherwise all
      const serverFilter = statusFilter === 'approved' ? 'approved' : 'all';
      const data: Array<{ id: number; content: string; authorName: string; createdAt: string; newsTitle: string; isApproved: boolean }>
        = await api.get(`/api/admin/comments?filter=${serverFilter}&limit=100`);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast({ title: 'โหลดความคิดเห็นล้มเหลว', description: 'ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const filteredComments = comments.filter((comment) => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase())
      || comment.authorName.toLowerCase().includes(searchTerm.toLowerCase())
      || comment.newsTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'approved'
        ? comment.isApproved
        : !comment.isApproved; // pending
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (commentId: number) => {
    try {
      await api.post(`/api/admin/comments/${commentId}/approve`);
      // Optimistic update
      setComments((prev) => prev.map(c => c.id === commentId ? { ...c, isApproved: true } : c));
      toast({ title: 'อนุมัติแล้ว', description: 'ความคิดเห็นถูกอนุมัติเรียบร้อย' });
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถอนุมัติความคิดเห็นได้', variant: 'destructive' });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.delete(`/api/admin/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast({ title: 'ลบความคิดเห็นสำเร็จ', description: 'ความคิดเห็นถูกลบเรียบร้อยแล้ว' });
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบความคิดเห็นได้', variant: 'destructive' });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedComments.length === 0) {
      toast({
        title: "ไม่มีการเลือก",
        description: "กรุณาเลือกความคิดเห็นที่ต้องการดำเนินการ",
        variant: "destructive"
      });
      return;
    }

    try {
      await Promise.all(selectedComments.map(id => api.post(`/api/admin/comments/${id}/approve`)));
      setComments(prev => prev.map(c => selectedComments.includes(c.id) ? { ...c, isApproved: true } : c));
      setSelectedComments([]);
      toast({ title: 'อนุมัติทั้งหมดสำเร็จ', description: `จำนวน ${selectedComments.length} รายการ` });
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถอนุมัติแบบกลุ่มได้', variant: 'destructive' });
    }
  };

  const getStatusBadge = (isApproved: boolean) => {
    if (isApproved) return <Badge variant="default" className="bg-green-600">อนุมัติแล้ว</Badge>;
    return <Badge variant="secondary">รออนุมัติ</Badge>;
  };

  const getStatusColor = (isApproved: boolean) => (isApproved ? 'text-green-600' : 'text-yellow-600');

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
            รออนุมัติ: {comments.filter(c => !c.isApproved).length}
          </Badge>
        </div>
      </div>

      <GlassCard
        header={
          <GlassCardHeader
            icon={<MessageSquare className="h-5 w-5 text-orange-600" />}
            title={<span className="font-kanit text-orange-700">ความคิดเห็น</span>}
            description={<span className="font-sarabun">ค้นหาและจัดการความคิดเห็นของผู้ใช้</span>}
          />
        }
      >
        <div className="flex items-center gap-4 mb-4">
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
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'approved')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="pending">รออนุมัติ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
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
                    onClick={handleBulkApprove}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    อนุมัติทั้งหมด
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
                    checked={filteredComments.length > 0 && selectedComments.length === filteredComments.length}
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
                      <p className="font-medium text-sm">{comment.authorName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600">{comment.newsTitle}</p>
                  </TableCell>
                  <TableCell>{getStatusBadge(comment.isApproved)}</TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600">{comment.createdAt}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!comment.isApproved && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(comment.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
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
      </GlassCard>
    </div>
  );
}