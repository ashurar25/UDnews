import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NewsRatingProps {
  newsId: number;
  className?: string;
}

const NewsRating = ({ newsId, className = "" }: NewsRatingProps) => {
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch rating statistics
  const { data: ratings } = useQuery({
    queryKey: [`/api/news/${newsId}/ratings`],
    queryFn: async () => {
      const response = await fetch(`/api/news/${newsId}/ratings`);
      if (!response.ok) throw new Error('Failed to fetch ratings');
      return response.json();
    },
  });

  // Check user's existing rating from localStorage
  useEffect(() => {
    const existingRating = localStorage.getItem(`rating-${newsId}`);
    if (existingRating === 'like' || existingRating === 'dislike') {
      setUserRating(existingRating);
    }
  }, [newsId]);

  // Submit rating mutation
  const ratingMutation = useMutation({
    mutationFn: async (rating: 'like' | 'dislike') => {
      return apiRequest(`/api/news/${newsId}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      });
    },
    onSuccess: (_, rating) => {
      queryClient.invalidateQueries({ queryKey: [`/api/news/${newsId}/ratings`] });
      setUserRating(rating);
      localStorage.setItem(`rating-${newsId}`, rating);
      toast({
        title: rating === 'like' ? "ขอบคุณสำหรับการให้คะแนน" : "ขอบคุณสำหรับความคิดเห็น",
        description: "ความคิดเห็นของคุณช่วยให้เราปรับปรุงเนื้อหาได้ดีขึ้น",
      });
    },
    onError: (error: any) => {
      if (error.message.includes('already rated')) {
        toast({
          title: "คุณได้ให้คะแนนแล้ว",
          description: "สามารถให้คะแนนได้เพียงครั้งเดียวต่อข่าว",
          variant: "destructive",
        });
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถบันทึกการให้คะแนนได้",
          variant: "destructive",
        });
      }
    },
  });

  const handleRating = (rating: 'like' | 'dislike') => {
    if (userRating) {
      toast({
        title: "คุณได้ให้คะแนนแล้ว",
        description: "สามารถให้คะแนนได้เพียงครั้งเดียวต่อข่าว",
        variant: "destructive",
      });
      return;
    }
    ratingMutation.mutate(rating);
  };

  const likeCount = ratings?.likes || 0;
  const dislikeCount = ratings?.dislikes || 0;
  const totalRatings = likeCount + dislikeCount;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          variant={userRating === 'like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRating('like')}
          disabled={ratingMutation.isPending || !!userRating}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="font-sarabun">
            ชอบ {likeCount > 0 && `(${likeCount})`}
          </span>
        </Button>

        <Button
          variant={userRating === 'dislike' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRating('dislike')}
          disabled={ratingMutation.isPending || !!userRating}
          className="gap-2"
        >
          <ThumbsDown className="h-4 w-4" />
          <span className="font-sarabun">
            ไม่ชอบ {dislikeCount > 0 && `(${dislikeCount})`}
          </span>
        </Button>
      </div>

      {totalRatings > 0 && (
        <div className="text-sm text-muted-foreground font-sarabun">
          จาก {totalRatings} คะแนน
          {likeCount > 0 && (
            <span className="ml-2 text-green-600">
              {Math.round((likeCount / totalRatings) * 100)}% ชอบ
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsRating;