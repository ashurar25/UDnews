import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Reply, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Comment {
  id: number;
  newsId: number;
  parentId?: number;
  authorName: string;
  authorEmail?: string;
  content: string;
  isApproved: boolean;
  isReported: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommentsSectionProps {
  newsId: number;
}

const CommentsSection = ({ newsId }: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState({
    authorName: "",
    authorEmail: "",
    content: ""
  });
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: [`/api/comments/${newsId}`],
    queryFn: async () => {
      const response = await fetch(`/api/comments/${newsId}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
  });

  // Submit new comment
  const submitCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      return apiRequest(`/api/comments`, {
        method: "POST",
        body: JSON.stringify({
          ...commentData,
          newsId
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${newsId}`] });
      setNewComment({ authorName: "", authorEmail: "", content: "" });
      toast({
        title: "ส่งความคิดเห็นแล้ว",
        description: "ความคิดเห็นของคุณรออนุมัติ",
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

  // Submit reply
  const submitReplyMutation = useMutation({
    mutationFn: async ({ parentId, content, author }: { parentId: number, content: string, author: string }) => {
      return apiRequest(`/api/comments`, {
        method: "POST",
        body: JSON.stringify({
          newsId,
          parentId,
          authorName: author,
          content
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${newsId}`] });
      setReplyingTo(null);
      setReplyContent("");
      setReplyAuthor("");
      toast({
        title: "ส่งการตอบกลับแล้ว",
        description: "การตอบกลับของคุณรออนุมัติ",
      });
    },
    onError: () => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งการตอบกลับได้",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.authorName.trim() || !newComment.content.trim()) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "ต้องระบุชื่อและเนื้อหาความคิดเห็น",
        variant: "destructive",
      });
      return;
    }
    submitCommentMutation.mutate(newComment);
  };

  const handleSubmitReply = () => {
    if (!replyAuthor.trim() || !replyContent.trim() || !replyingTo) return;
    
    submitReplyMutation.mutate({
      parentId: replyingTo,
      content: replyContent,
      author: replyAuthor
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const approvedComments = comments?.filter((comment: Comment) => comment.isApproved && !comment.parentId) || [];
  const replies = comments?.filter((comment: Comment) => comment.isApproved && comment.parentId) || [];

  const getRepliesForComment = (commentId: number) => {
    return replies.filter((reply: Comment) => reply.parentId === commentId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-kanit">
          <MessageCircle className="h-5 w-5" />
          ความคิดเห็น ({approvedComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="ชื่อของคุณ *"
              value={newComment.authorName}
              onChange={(e) => setNewComment(prev => ({ ...prev, authorName: e.target.value }))}
              className="font-sarabun"
            />
            <Input
              type="email"
              placeholder="อีเมลของคุณ (ไม่บังคับ)"
              value={newComment.authorEmail}
              onChange={(e) => setNewComment(prev => ({ ...prev, authorEmail: e.target.value }))}
              className="font-sarabun"
            />
          </div>
          <Textarea
            placeholder="แสดงความคิดเห็น..."
            value={newComment.content}
            onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
            rows={4}
            className="font-sarabun"
          />
          <Button 
            type="submit" 
            disabled={submitCommentMutation.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {submitCommentMutation.isPending ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
          </Button>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {approvedComments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 font-sarabun">
              ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!
            </p>
          ) : (
            approvedComments.map((comment: Comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold font-kanit">{comment.authorName}</span>
                    <span className="text-sm text-muted-foreground ml-2 font-sarabun">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="gap-1"
                  >
                    <Reply className="h-3 w-3" />
                    ตอบกลับ
                  </Button>
                </div>
                
                <p className="font-sarabun leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* Replies */}
                {getRepliesForComment(comment.id).map((reply: Comment) => (
                  <div key={reply.id} className="ml-6 pl-4 border-l-2 border-muted space-y-2">
                    <div>
                      <span className="font-semibold font-kanit text-sm">{reply.authorName}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-sarabun">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                    <p className="font-sarabun text-sm leading-relaxed whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                ))}

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="ml-6 space-y-3 border-l-2 border-primary pl-4">
                    <Input
                      placeholder="ชื่อของคุณ"
                      value={replyAuthor}
                      onChange={(e) => setReplyAuthor(e.target.value)}
                      className="font-sarabun"
                    />
                    <Textarea
                      placeholder={`ตอบกลับ ${comment.authorName}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="font-sarabun"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSubmitReply}
                        disabled={submitReplyMutation.isPending}
                        className="gap-1"
                      >
                        <Send className="h-3 w-3" />
                        {submitReplyMutation.isPending ? "กำลังส่ง..." : "ส่งการตอบกลับ"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                          setReplyAuthor("");
                        }}
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentsSection;