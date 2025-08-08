import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rss, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const RSSFeed = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const rssUrl = "https://udnews.com/rss.xml";
  
  const handleCopyRSSUrl = async () => {
    try {
      await navigator.clipboard.writeText(rssUrl);
      setCopied(true);
      toast({
        title: "คัดลอกสำเร็จ!",
        description: "ลิงค์ RSS Feed ถูกคัดลอกแล้ว",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถคัดลอกลิงค์ได้",
        variant: "destructive",
      });
    }
  };

  const rssFeeds = [
    {
      title: "ข่าวทั้งหมด",
      url: "/rss.xml",
      description: "ข่าวสารทุกหมวดหมู่",
      count: "ทุกข่าว"
    },
    {
      title: "ข่าวท้องถิ่น",
      url: "/rss/local.xml",
      description: "ข่าวสารท้องถิ่นอุดรธานี",
      count: "ท้องถิ่น"
    },
    {
      title: "การเมือง",
      url: "/rss/politics.xml", 
      description: "ข่าวการเมืองและนโยบาย",
      count: "การเมือง"
    },
    {
      title: "กีฬา",
      url: "/rss/sports.xml",
      description: "ข่าวกีฬาและการแข่งขัน",
      count: "กีฬา"
    },
    {
      title: "มติชน",
      url: "https://www.matichon.co.th/feed",
      description: "ข่าวสารจากสำนักข่าวมติชน",
      count: "มติชน"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-primary p-3 rounded-lg">
              <Rss className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-kanit">RSS Feed</h1>
          </div>
          <p className="text-lg text-muted-foreground font-sarabun">
            ติดตามข่าวสารล่าสุดผ่าน RSS Feed
          </p>
        </div>

        {/* Main RSS Info */}
        <Card className="mb-8 shadow-news">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-kanit">
              <Rss className="h-5 w-5 text-primary" />
              RSS Feed หลัก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground font-sarabun mb-4">
              ใช้ URL ด้านล่างเพื่อเพิ่มข่าวสารจากอัพเดทข่าวอุดรเข้าไปในเครื่องอ่าน RSS ของคุณ
            </p>
            
            <div className="bg-muted p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono flex-1 break-all">
                  {rssUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyRSSUrl}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="font-sarabun">เปิดใน Browser</span>
              </Button>
              <Button variant="outline" size="sm">
                <span className="font-sarabun">วิธีใช้ RSS</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RSS Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {rssFeeds.map((feed, index) => (
            <Card key={index} className="hover:shadow-news transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-kanit">{feed.title}</CardTitle>
                  <Badge variant="secondary" className="font-sarabun">
                    {feed.count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-sarabun mb-4">
                  {feed.description}
                </p>
                <div className="bg-muted p-2 rounded text-xs font-mono mb-3 break-all">
                  https://udnews.com{feed.url}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Rss className="h-4 w-4 mr-2" />
                  <span className="font-sarabun">สมัครรับข่าว</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* RSS Apps */}
        <Card className="shadow-news">
          <CardHeader>
            <CardTitle className="font-kanit">แนะนำแอป RSS Reader</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground font-sarabun mb-4">
              แอปพลิเคชันที่แนะนำสำหรับอ่าน RSS Feed
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Feedly", desc: "ใช้งานง่าย มีฟีเจอร์ครบครัน", platform: "Web, iOS, Android" },
                { name: "Inoreader", desc: "มีฟีเจอร์ขั้นสูง เหมาะกับผู้ใช้มืออาชีพ", platform: "Web, iOS, Android" },
                { name: "RSS Reader", desc: "เรียบง่าย โฟกัสที่การอ่าน", platform: "iOS, Android" }
              ].map((app, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                  <h4 className="font-semibold font-kanit mb-2">{app.name}</h4>
                  <p className="text-sm text-muted-foreground font-sarabun mb-2">{app.desc}</p>
                  <Badge variant="outline" className="text-xs">{app.platform}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default RSSFeed;