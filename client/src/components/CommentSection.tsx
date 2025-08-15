
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Reply, Flag, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface Comment {
  id: number;
  newsId: number;
  parentId: number | null;
  authorName: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  newsId: number;
}

const CommentSection = ({ newsId }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", newsId],
    queryFn: async (): Promise<Comment[]> => {
      return api.get<Comment[]>(`/api/comments/${newsId}`, { auth: false });
    },
  });

  // Submit comment mutation
  const submitCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      return api.post("/api/comments", commentData, { auth: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", newsId] });
      setNewComment("");
      setAuthorName("");
      setAuthorEmail("");
      setReplyingTo(null);
      setReplyContent("");
      toast({
        title: "ส่งความคิดเห็นสำเร็จ",
        description: "ความคิดเห็นของคุณอยู่ระหว่างการตรวจสอบ",
      });
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งความคิดเห็นได้",
        variant: "destructive",
      });
    },
  });

  // Report comment mutation
  const reportCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return api.post(`/api/comments/${commentId}/report`, undefined, { auth: false });
    },
    onSuccess: () => {
      toast({
        title: "รายงานสำเร็จ",
        description: "ขอบคุณสำหรับการรายงาน เราจะตรวจสอบเร็วๆ นี้",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) return;

    submitCommentMutation.mutate({
      newsId,
      parentId: null,
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim() || null,
      content: newComment.trim(),
    });
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyContent.trim() || !authorName.trim()) return;

    submitCommentMutation.mutate({
      newsId,
      parentId,
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim() || null,
      content: replyContent.trim(),
    });
  };

  const handleReportComment = (commentId: number) => {
    reportCommentMutation.mutate(commentId);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInMs = now.getTime() - created.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'เมื่อสักครู่';
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 วันที่แล้ว';
    return `${diffInDays} วันที่แล้ว`;
  };

  const approvedComments = comments?.filter(comment => comment.isApproved) || [];
  const topLevelComments = approvedComments.filter(comment => !comment.parentId);

  // Group replies with their parent comments
  const commentsWithReplies = topLevelComments.map(comment => ({
    ...comment,
    replies: approvedComments.filter(reply => reply.parentId === comment.id)
  }));

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold font-kanit">ความคิดเห็น</h3>
        <Badge variant="secondary" className="font-sarabun">
          {approvedComments.length} ความคิดเห็น
        </Badge>
      </div>

      {/* Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-kanit">แสดงความคิดเห็น</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorName" className="font-sarabun">ชื่อ *</Label>
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="กรอกชื่อของคุณ"
                  className="font-sarabun"
                  required
                />
              </div>
              <div>
                <Label htmlFor="authorEmail" className="font-sarabun">อีเมล (ไม่บังคับ)</Label>
                <Input
                  id="authorEmail"
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="font-sarabun"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="comment" className="font-sarabun">ความคิดเห็น *</Label>
              <Textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="แสดงความคิดเห็นของคุณ..."
                className="font-sarabun min-h-[100px]"
                required
              />
            </div>

            <Alert>
              <AlertDescription className="font-sarabun text-sm">
                ความคิดเห็นจะต้องผ่านการตรวจสอบก่อนแสดงผล กรุณาใช้ภาษาที่สุภาพ
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="bg-orange-600 hover:bg-orange-700 font-sarabun"
              disabled={submitCommentMutation.isPending}
            >
              {submitCommentMutation.isPending ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : commentsWithReplies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-sarabun">
                ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!
              </p>
            </CardContent>
          </Card>
        ) : (
          commentsWithReplies.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                {/* Main Comment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold font-sarabun">{comment.authorName}</span>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {getTimeAgo(comment.createdAt)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-xs font-sarabun"
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        ตอบกลับ
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReportComment(comment.id)}
                        className="text-xs font-sarabun text-red-600 hover:text-red-700"
                      >
                        <Flag className="h-3 w-3 mr-1" />
                        รายงาน
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm font-sarabun text-foreground leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="space-y-3">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="ตอบกลับ..."
                          className="font-sarabun"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyContent.trim() || submitCommentMutation.isPending}
                            className="bg-orange-600 hover:bg-orange-700 font-sarabun"
                          >
                            ส่งการตอบกลับ
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                            className="font-sarabun"
                          >
                            ยกเลิก
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-semibold font-sarabun">{reply.authorName}</span>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {getTimeAgo(reply.createdAt)}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReportComment(reply.id)}
                              className="text-xs font-sarabun text-red-600 hover:text-red-700"
                            >
                              <Flag className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-sarabun text-foreground">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
