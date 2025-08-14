
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MessageCircle, Send, Clock, User, Flag, Heart, Reply } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Comment {
  id: number;
  newsId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isReported?: boolean;
  likes?: number;
  replies?: Comment[];
}

interface CommentsSectionProps {
  newsId: string;
  newsTitle: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ newsId, newsTitle }) => {
  const [newComment, setNewComment] = useState({
    authorName: '',
    content: '',
  });
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/comments/${newsId}`],
    queryFn: () => apiRequest(`/api/comments/${newsId}`),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Submit new comment
  const submitCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      const response = await apiRequest('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });
      return response;
    },
    onSuccess: () => {
      setNewComment({ authorName: '', content: '' });
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${newsId}`] });
      toast({
        title: "ส่งความคิดเห็นแล้ว",
        description: "ความคิดเห็นของคุณได้รับการบันทึกแล้ว",
      });
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถส่งความคิดเห็นได้",
        variant: "destructive",
      });
    },
  });

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.authorName.trim() || !newComment.content.trim()) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "ต้องระบุชื่อและเนื้อหาความคิดเห็น",
        variant: "destructive",
      });
      return;
    }

    if (newComment.content.length < 10) {
      toast({
        title: "ความคิดเห็นสั้นเกินไป",
        description: "กรุณาเขียนความคิดเห็นอย่างน้อย 10 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }

    if (newComment.content.length > 500) {
      toast({
        title: "ความคิดเห็นยาวเกินไป",
        description: "ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const commentData = {
      newsId: newsId,
      authorName: newComment.authorName.trim(),
      content: newComment.content.trim(),
    };

    submitCommentMutation.mutate(commentData);
  };

  const handleReportComment = (commentId: number) => {
    toast({
      title: "รายงานความคิดเห็น",
      description: "ขอบคุณสำหรับการรายงาน เราจะตรวจสอบภายใน 24 ชั่วโมง",
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
    
    return format(date, 'dd MMMM yyyy เวลา HH:mm', { locale: th });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const validateInput = (value: string, field: string): boolean => {
    if (field === 'authorName') {
      return value.length >= 2 && value.length <= 50 && /^[ก-๙a-zA-Z\s]+$/.test(value);
    }
    if (field === 'content') {
      return value.length >= 10 && value.length <= 500;
    }
    return false;
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-kanit">
          <MessageCircle className="h-5 w-5 text-primary" />
          ความคิดเห็น ({comments.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground font-sarabun">
          แสดงความคิดเห็นเกี่ยวกับ: {newsTitle}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorName" className="font-sarabun">
                    ชื่อของคุณ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="authorName"
                    value={newComment.authorName}
                    onChange={(e) => setNewComment(prev => ({ ...prev, authorName: e.target.value }))}
                    placeholder="ระบุชื่อของคุณ"
                    maxLength={50}
                    className="font-sarabun"
                    disabled={isSubmitting}
                  />
                  {newComment.authorName && !validateInput(newComment.authorName, 'authorName') && (
                    <p className="text-xs text-destructive font-sarabun">
                      ชื่อต้องมี 2-50 ตัวอักษร และเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น
                    </p>
                  )}
                </div>
                <div className="flex items-end">
                  <Badge variant="outline" className="font-sarabun">
                    <User className="h-3 w-3 mr-1" />
                    {newComment.authorName || 'ผู้แสดงความคิดเห็น'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content" className="font-sarabun">
                  ความคิดเห็น <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={newComment.content}
                  onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="แสดงความคิดเห็นของคุณ... (10-500 ตัวอักษร)"
                  rows={4}
                  maxLength={500}
                  className="font-sarabun resize-none"
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground font-sarabun">
                  <span>
                    {newComment.content.length}/500 ตัวอักษร
                  </span>
                  {newComment.content && !validateInput(newComment.content, 'content') && (
                    <span className="text-destructive">
                      ความคิดเห็นต้องมี 10-500 ตัวอักษร
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-sarabun">
                  กรุณาแสดงความคิดเห็นอย่างสุภาพ ไม่ใช้คำหยาบคาย หรือส่อไปในทางไม่เหมาะสม
                </p>
                <Button 
                  type="submit" 
                  disabled={
                    isSubmitting || 
                    !validateInput(newComment.authorName, 'authorName') || 
                    !validateInput(newComment.content, 'content')
                  }
                  className="gap-2 font-sarabun"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      ส่งความคิดเห็น
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold font-kanit mb-2">ยังไม่มีความคิดเห็น</h3>
              <p className="text-muted-foreground font-sarabun">
                เป็นคนแรกที่แสดงความคิดเห็นเกี่ยวกับข่าวนี้
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4">
              {comments.map((comment: Comment) => (
                <Card key={comment.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="font-kanit text-sm">
                          {getInitials(comment.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold font-kanit text-sm">
                            {comment.authorName}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-sarabun">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(comment.createdAt)}
                          </div>
                        </div>
                        
                        <p className="text-sm font-sarabun leading-relaxed mb-3 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 gap-1 text-muted-foreground hover:text-primary font-sarabun"
                          >
                            <Heart className="h-3 w-3" />
                            ถูกใจ {comment.likes || 0}
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 gap-1 text-muted-foreground hover:text-primary font-sarabun"
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          >
                            <Reply className="h-3 w-3" />
                            ตอบกลับ
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-3 gap-1 text-muted-foreground hover:text-destructive font-sarabun"
                              >
                                <Flag className="h-3 w-3" />
                                รายงาน
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-kanit">
                                  รายงานความคิดเห็นที่ไม่เหมาะสม
                                </AlertDialogTitle>
                                <AlertDialogDescription className="font-sarabun">
                                  คุณต้องการรายงานความคิดเห็นนี้หรือไม่? เราจะตรวจสอบและดำเนินการภายใน 24 ชั่วโมง
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-sarabun">ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleReportComment(comment.id)}
                                  className="font-sarabun"
                                >
                                  รายงาน
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <Card className="mt-3 bg-muted/30">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <Textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={`ตอบกลับ ${comment.authorName}...`}
                                  rows={2}
                                  className="font-sarabun text-sm resize-none"
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent('');
                                    }}
                                    className="font-sarabun"
                                  >
                                    ยกเลิก
                                  </Button>
                                  <Button 
                                    size="sm"
                                    disabled={!replyContent.trim()}
                                    className="font-sarabun"
                                  >
                                    ตอบกลับ
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 ml-4 pl-4 border-l-2 border-muted space-y-3">
                            {comment.replies.map((reply: Comment) => (
                              <div key={reply.id} className="flex gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="font-kanit text-xs">
                                    {getInitials(reply.authorName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-semibold font-kanit text-xs">
                                      {reply.authorName}
                                    </h5>
                                    <span className="text-xs text-muted-foreground font-sarabun">
                                      {formatTimeAgo(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-sarabun leading-relaxed">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Load More Comments */}
        {comments.length > 0 && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="font-sarabun"
            >
              รีเฟรชความคิดเห็น
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentsSection;
