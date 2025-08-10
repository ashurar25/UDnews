import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CommentsSection from "@/components/CommentsSection";
import NewsletterSignup from "@/components/NewsletterSignup";
import AdvancedSearch from "@/components/AdvancedSearch";
import NewsRating from "@/components/NewsRating";
import SocialShare from "@/components/SocialShare";

// Test page for all new systems
export default function TestSystems() {
  const { toast } = useToast();
  
  // Sample news article data for testing
  const sampleNewsArticle = {
    id: 1,
    title: "ทดสอบระบบใหม่ - อัพเดทข่าวอุดรธานี",
    content: "นี่คือหน้าทดสอบระบบใหม่ทั้งหมดที่เพิ่มเข้ามาในเว็บไซต์ข่าวอุดรธานี",
    category: "technology",
    createdAt: new Date(),
  };

  const handleSearchResults = (results: any[]) => {
    console.log("Search results:", results);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          ทดสอบระบบใหม่ - UD News
        </h1>
        <p className="text-gray-600">
          หน้านี้ใช้สำหรับทดสอบระบบใหม่ทั้งหมดที่เพิ่งเพิ่มเข้ามา
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Advanced Search System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-blue-600">
              🔍 ระบบค้นหาขั้นสูง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedSearch />
          </CardContent>
        </Card>

        {/* Newsletter Signup System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-green-600">
              📧 สมัครรับข่าวสาร
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NewsletterSignup />
          </CardContent>
        </Card>

        {/* Social Share System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-purple-600">
              📱 แบ่งปันข่าว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SocialShare 
              url="https://udnews.replit.app/test-systems"
              title={sampleNewsArticle.title}
              description="ทดสอบระบบแบ่งปันข่าวใหม่"
            />
          </CardContent>
        </Card>

        {/* News Rating System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-orange-600">
              👍 ให้คะแนนข่าว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NewsRating newsId={sampleNewsArticle.id} />
          </CardContent>
        </Card>
      </div>

      {/* Comments System - Full width */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl text-red-600">
            💬 ระบบแสดงความคิดเห็น
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommentsSection newsId={sampleNewsArticle.id} />
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-xl text-gray-700">
            📊 สถานะระบบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg">
              <div className="text-2xl text-green-500">✅</div>
              <div className="text-sm text-gray-600">ความคิดเห็น</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-2xl text-green-500">✅</div>
              <div className="text-sm text-gray-600">จดหมายข่าว</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-2xl text-green-500">✅</div>
              <div className="text-sm text-gray-600">แบ่งปัน</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-2xl text-green-500">✅</div>
              <div className="text-sm text-gray-600">คะแนน</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-2xl text-green-500">✅</div>
              <div className="text-sm text-gray-600">ค้นหา</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              ระบบที่เพิ่งเพิ่มเข้ามา (5 ระบบ):
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• ระบบแสดงความคิดเห็น (Comments System)</li>
              <li>• ระบบสมัครรับข่าวสาร (Newsletter Subscription)</li>
              <li>• ระบบการแบ่งปันข่าว (Social Media Sharing)</li>
              <li>• ระบบให้คะแนนข่าว (News Rating System)</li>
              <li>• ระบบค้นหาขั้นสูง (Advanced Search)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


      {/* RSS Testing Section */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-xl text-blue-600">
            📡 ทดสอบระบบ RSS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={() => {
                fetch('/api/rss/process', { method: 'POST' })
                  .then(res => res.json())
                  .then(data => {
                    toast({
                      title: "RSS Processing Started",
                      description: data.message,
                    });
                  })
                  .catch(err => {
                    toast({
                      title: "Error",
                      description: "Failed to start RSS processing",
                      variant: "destructive",
                    });
                  });
              }}
              className="w-full"
            >
              🔄 ประมวลผล RSS ทันที
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded">
                <div className="font-semibold text-green-600">✅ RSS Feeds ที่ทำงาน:</div>
                <ul className="mt-2 space-y-1">
                  <li>• Thai Rath</li>
                  <li>• Khaosod (บางครั้ง)</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="font-semibold text-red-600">❌ RSS Feeds ที่มีปัญหา:</div>
                <ul className="mt-2 space-y-1">
                  <li>• Post Today (XML Error)</li>
                  <li>• Inn News</li>
                  <li>• Matichon</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
