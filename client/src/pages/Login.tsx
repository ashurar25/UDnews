import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Eye, EyeOff, Lock, ShieldCheck, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const Login = () => {
  const [location, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setLocation('/admin');
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        toast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: "ยินดีต้อนรับสู่แผงควบคุมแอดมิน",
        });
        // Redirect to React admin page
        setLocation('/admin');
      } else {
        setError(data.message || data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950" />
      <div className="absolute inset-0 opacity-40 dark:opacity-30" aria-hidden>
        <div className="absolute w-[700px] h-[700px] -top-40 -right-40 bg-orange-400/20 blur-3xl rounded-full" />
        <div className="absolute w-[600px] h-[600px] -bottom-32 -left-32 bg-yellow-400/20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen">
        {/* Brand side */}
        <div className="hidden lg:flex items-center justify-center p-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                <ShieldCheck className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-kanit font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">UD News Update</h1>
                <p className="text-sm text-muted-foreground font-sarabun">ระบบจัดการสำหรับผู้ดูแล 'อัพเดทข่าวอุดร'</p>
              </div>
            </div>
            <div className="rounded-2xl p-6 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl ring-1 ring-black/5 shadow-xl">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="font-sarabun text-sm text-muted-foreground">
                  เข้าสู่ระบบเพื่อจัดการข่าว, หมวดหมู่, สปอนเซอร์, และการแจ้งเตือนแบบพุช พร้อมรายงานสถิติ.
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Form side */}
        <div className="flex items-center justify-center p-6 lg:p-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20">
                    <Key className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold font-kanit text-orange-800 dark:text-orange-300">
                  เข้าสู่ระบบแอดมิน
                </CardTitle>
                <CardDescription className="font-sarabun">
                  อัพเดทข่าวอุดร - UD News Update Management System
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="font-sarabun">ชื่อผู้ใช้</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="กรอกชื่อผู้ใช้"
                        className="font-sarabun pl-10"
                        required
                        autoFocus
                      />
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-sarabun">รหัสผ่าน</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่าน"
                        className="font-sarabun pl-10 pr-10"
                        required
                      />
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
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
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        กำลังเข้าสู่ระบบ...
                      </span>
                    ) : (
                      "เข้าสู่ระบบ"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground font-sarabun">
                  <p>สำหรับผู้ดูแลระบบเท่านั้น</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;