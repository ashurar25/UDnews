
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Heart,
  Star,
  Trophy,
  Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        toast({
          title: isLogin ? "เข้าสู่ระบบสำเร็จ" : "สมัครสมาชิกสำเร็จ",
          description: `ยินดีต้อนรับ ${data.user.name || data.user.email}`,
        });
        
        setLocation('/');
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Welcome Info */}
        <div className="hidden lg:block space-y-6">
          <div className="text-center">
            <img 
              src="/logo.jpg" 
              alt="UD News Logo" 
              className="w-24 h-24 mx-auto rounded-full shadow-lg mb-4"
            />
            <h1 className="text-4xl font-bold text-orange-800 font-kanit mb-2">
              อัพเดทข่าวอุดร
            </h1>
            <p className="text-xl text-orange-600 font-sarabun">
              UD News Update
            </p>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
            <CardHeader>
              <CardTitle className="text-center font-kanit text-orange-700">
                ประโยชน์สำหรับสมาชิก
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="font-sarabun">แสดงความคิดเห็นและให้คะแนนข่าว</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-sarabun">บันทึกข่าวที่สนใจ</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Trophy className="h-5 w-5 text-blue-500" />
                <span className="font-sarabun">เข้าร่วมโปรแกรมสนับสนุน</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Crown className="h-5 w-5 text-purple-500" />
                <span className="font-sarabun">รับข่าวสารพิเศษก่อนใคร</span>
              </div>
            </CardContent>
          </Card>

          {/* Supporter Rankings Preview */}
          <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
            <CardHeader>
              <CardTitle className="text-center font-kanit text-orange-700 text-sm">
                อันดับผู้สนับสนุนอัพเดท
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-purple-100 text-purple-700">💎 #1</Badge>
                  <span className="font-sarabun">คุณสมชาย (1,000 บาท)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-yellow-100 text-yellow-700">🥇 #2</Badge>
                  <span className="font-sarabun">คุณวิไล (350 บาท)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-orange-100 text-orange-700">🥈 #3</Badge>
                  <span className="font-sarabun">คุณประยุทธ (150 บาท)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Login Form */}
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-xl border-orange-200">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              {isLogin ? (
                <LogIn className="h-10 w-10 text-orange-600" />
              ) : (
                <UserPlus className="h-10 w-10 text-orange-600" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold font-kanit text-orange-800">
              {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </CardTitle>
            <CardDescription className="font-sarabun">
              {isLogin 
                ? "เข้าสู่ระบบเพื่อใช้งานคุณสมบัติเต็มรูปแบบ" 
                : "สมัครสมาชิกเพื่อเข้าร่วมชุมชนข่าวอุดร"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-sarabun">อีเมล</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="กรอกอีเมล"
                    className="pl-10 font-sarabun"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="font-sarabun">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="pl-10 pr-10 font-sarabun"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="font-sarabun">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 font-sarabun"
                disabled={isLoading}
              >
                {isLoading 
                  ? (isLogin ? "กำลังเข้าสู่ระบบ..." : "กำลังสมัครสมาชิก...") 
                  : (isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก")
                }
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-sarabun text-orange-600 hover:text-orange-700"
                >
                  {isLogin 
                    ? "ยังไม่มีบัญชี? สมัครสมาชิก" 
                    : "มีบัญชีแล้ว? เข้าสู่ระบบ"
                  }
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-orange-200">
              <div className="text-center">
                <Link to="/">
                  <Button variant="outline" className="font-sarabun">
                    กลับหน้าหลัก
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
