import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Bell } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NewsletterSignupProps {
  className?: string;
}

const NewsletterSignup = ({ className = "" }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [preferences, setPreferences] = useState({
    daily: true,
    weekly: true,
    breaking: true,
  });

  const { toast } = useToast();

  const subscriptionMutation = useMutation({
    mutationFn: async (data: { email: string; name?: string; preferences: string }) => {
      return apiRequest("/api/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "สมัครรับข่าวสารสำเร็จ!",
        description: "คุณจะได้รับข่าวสารจากเราทางอีเมล",
      });
      setEmail("");
      setName("");
    },
    onError: (error: any) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสมัครรับข่าวสารได้",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "กรุณากรอกอีเมล",
        description: "ต้องระบุอีเมลเพื่อสมัครรับข่าวสาร",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "รูปแบบอีเมลไม่ถูกต้อง",
        description: "กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง",
        variant: "destructive",
      });
      return;
    }

    subscriptionMutation.mutate({
      email: email.trim(),
      name: name.trim() || undefined,
      preferences: JSON.stringify(preferences),
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-kanit">
          <Mail className="h-5 w-5 text-primary" />
          สมัครรับข่าวสาร
        </CardTitle>
        <p className="text-sm text-muted-foreground font-sarabun">
          รับข่าวสารอุดรธานีทันทีในอีเมลของคุณ
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="อีเมลของคุณ *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-sarabun"
              required
            />
            <Input
              type="text"
              placeholder="ชื่อของคุณ (ไม่บังคับ)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-sarabun"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold font-kanit">เลือกประเภทข่าวสาร:</p>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="daily"
                  checked={preferences.daily}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, daily: checked as boolean }))
                  }
                />
                <label htmlFor="daily" className="text-sm font-sarabun cursor-pointer">
                  ข่าวสรุปประจำวัน
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weekly"
                  checked={preferences.weekly}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, weekly: checked as boolean }))
                  }
                />
                <label htmlFor="weekly" className="text-sm font-sarabun cursor-pointer">
                  ข่าวสรุปประจำสัปดาห์
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breaking"
                  checked={preferences.breaking}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, breaking: checked as boolean }))
                  }
                />
                <label htmlFor="breaking" className="text-sm font-sarabun cursor-pointer flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  ข่าวด่วนสำคัญ
                </label>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full gap-2" 
            disabled={subscriptionMutation.isPending}
          >
            <Mail className="h-4 w-4" />
            {subscriptionMutation.isPending ? "กำลังสมัคร..." : "สมัครรับข่าวสาร"}
          </Button>

          <p className="text-xs text-muted-foreground text-center font-sarabun">
            เราจะไม่เอาอีเมลของคุณไปให้บุคคลที่สาม และคุณสามารถยกเลิกได้ทุกเวลา
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewsletterSignup;