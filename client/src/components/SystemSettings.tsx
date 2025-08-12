import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, Globe, Database, Shield, Bell, Image, Search, Save, RefreshCw } from "lucide-react";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    googleAnalytics: string;
    facebookPixel: string;
  };
  system: {
    maintenanceMode: boolean;
    allowComments: boolean;
    requireApproval: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    cacheEnabled: boolean;
    cacheDuration: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    notificationSchedule: string;
  };
}

export default function SystemSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'UD News',
    siteDescription: 'ข่าวสารออนไลน์สำหรับชาวอุดรธานี',
    siteUrl: 'https://udnews.com',
    contactEmail: 'info@udnews.com',
    contactPhone: '042-123456',
    address: 'อำเภอเมืองอุดรธานี จังหวัดอุดรธานี',
    socialMedia: {
      facebook: 'https://facebook.com/udnews',
      twitter: 'https://twitter.com/udnews',
      instagram: 'https://instagram.com/udnews',
      youtube: 'https://youtube.com/udnews'
    },
    seo: {
      metaTitle: 'UD News - ข่าวสารออนไลน์อุดรธานี',
      metaDescription: 'ข่าวสารออนไลน์สำหรับชาวอุดรธานี อัปเดตข่าวสารล่าสุดทุกวัน',
      metaKeywords: 'ข่าว, อุดรธานี, ข่าวสาร, ข่าวท้องถิ่น',
      googleAnalytics: '',
      facebookPixel: ''
    },
    system: {
      maintenanceMode: false,
      allowComments: true,
      requireApproval: true,
      maxFileSize: 5,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      cacheEnabled: true,
      cacheDuration: 3600
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationSchedule: '09:00'
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from API
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Mock API call - in real app, fetch from /api/settings
      // const response = await fetch('/api/settings');
      // const data = await response.json();
      // setSettings(data);
      
      // For now, use default settings
      setIsLoading(false);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดการตั้งค่าได้",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      // Mock API call - in real app, save to /api/settings
      // const response = await fetch('/api/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      toast({
        title: "บันทึกการตั้งค่าสำเร็จ",
        description: "การตั้งค่าถูกบันทึกเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (path: string, value: any) => {
    const newSettings = { ...settings };
    const keys = path.split('.');
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleArrayChange = (path: string, value: string[]) => {
    handleSettingChange(path, value);
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    const newSettings = { ...settings };
    newSettings.socialMedia[platform as keyof typeof newSettings.socialMedia] = value;
    setSettings(newSettings);
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    if (confirm('คุณต้องการรีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นหรือไม่?')) {
      loadSettings();
      setHasChanges(false);
      toast({
        title: "รีเซ็ตการตั้งค่า",
        description: "การตั้งค่าถูกรีเซ็ตเป็นค่าเริ่มต้นแล้ว",
      });
    }
  };

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
          <h2 className="text-2xl font-bold font-kanit text-orange-800">การตั้งค่าระบบ</h2>
          <p className="text-gray-600 font-sarabun">จัดการการตั้งค่าพื้นฐานของเว็บไซต์</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเซ็ต
          </Button>
          <Button 
            onClick={handleSaveSettings} 
            disabled={!hasChanges || isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">ทั่วไป</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="system">ระบบ</TabsTrigger>
          <TabsTrigger value="notifications">การแจ้งเตือน</TabsTrigger>
          <TabsTrigger value="social">โซเชียล</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                ข้อมูลเว็บไซต์
              </CardTitle>
              <CardDescription>ตั้งค่าข้อมูลพื้นฐานของเว็บไซต์</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">ชื่อเว็บไซต์</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                    placeholder="กรอกชื่อเว็บไซต์"
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">URL เว็บไซต์</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => handleSettingChange('siteUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="siteDescription">คำอธิบายเว็บไซต์</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                  placeholder="กรอกคำอธิบายเว็บไซต์"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">อีเมลติดต่อ</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                    placeholder="info@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">เบอร์โทรติดต่อ</Label>
                  <Input
                    id="contactPhone"
                    value={settings.contactPhone}
                    onChange={(e) => handleSettingChange('contactPhone', e.target.value)}
                    placeholder="042-123456"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleSettingChange('address', e.target.value)}
                  placeholder="กรอกที่อยู่"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                การตั้งค่า SEO
              </CardTitle>
              <CardDescription>ตั้งค่า SEO และการวิเคราะห์</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.seo.metaTitle}
                  onChange={(e) => handleSettingChange('seo.metaTitle', e.target.value)}
                  placeholder="กรอก Meta Title"
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.seo.metaDescription}
                  onChange={(e) => handleSettingChange('seo.metaDescription', e.target.value)}
                  placeholder="กรอก Meta Description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={settings.seo.metaKeywords}
                  onChange={(e) => handleSettingChange('seo.metaKeywords', e.target.value)}
                  placeholder="กรอก Meta Keywords (คั่นด้วยเครื่องหมายจุลภาค)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                  <Input
                    id="googleAnalytics"
                    value={settings.seo.googleAnalytics}
                    onChange={(e) => handleSettingChange('seo.googleAnalytics', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                  <Input
                    id="facebookPixel"
                    value={settings.seo.facebookPixel}
                    onChange={(e) => handleSettingChange('seo.facebookPixel', e.target.value)}
                    placeholder="XXXXXXXXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                การตั้งค่าระบบ
              </CardTitle>
              <CardDescription>ตั้งค่าการทำงานของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">โหมดบำรุงรักษา</Label>
                  <p className="text-sm text-gray-600">เปิดใช้งานโหมดบำรุงรักษา</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.system.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('system.maintenanceMode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowComments">อนุญาตความคิดเห็น</Label>
                  <p className="text-sm text-gray-600">เปิดใช้งานระบบความคิดเห็น</p>
                </div>
                <Switch
                  id="allowComments"
                  checked={settings.system.allowComments}
                  onCheckedChange={(checked) => handleSettingChange('system.allowComments', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireApproval">ต้องอนุมัติความคิดเห็น</Label>
                  <p className="text-sm text-gray-600">ความคิดเห็นต้องได้รับการอนุมัติก่อนแสดง</p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={settings.system.requireApproval}
                  onCheckedChange={(checked) => handleSettingChange('system.requireApproval', checked)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxFileSize">ขนาดไฟล์สูงสุด (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.system.maxFileSize}
                    onChange={(e) => handleSettingChange('system.maxFileSize', parseInt(e.target.value))}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <Label htmlFor="cacheDuration">ระยะเวลาแคช (วินาที)</Label>
                  <Input
                    id="cacheDuration"
                    type="number"
                    value={settings.system.cacheDuration}
                    onChange={(e) => handleSettingChange('system.cacheDuration', parseInt(e.target.value))}
                    min="300"
                    max="86400"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="allowedFileTypes">ประเภทไฟล์ที่อนุญาต</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.system.allowedFileTypes.join(', ')}
                  onChange={(e) => handleArrayChange('system.allowedFileTypes', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="jpg, jpeg, png, gif, webp"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                การตั้งค่าการแจ้งเตือน
              </CardTitle>
              <CardDescription>ตั้งค่าการแจ้งเตือนต่างๆ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">การแจ้งเตือนทางอีเมล</Label>
                  <p className="text-sm text-gray-600">ส่งการแจ้งเตือนทางอีเมล</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications.emailNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">การแจ้งเตือน Push</Label>
                  <p className="text-sm text-gray-600">ส่งการแจ้งเตือน Push</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications.pushNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsNotifications">การแจ้งเตือนทาง SMS</Label>
                  <p className="text-sm text-gray-600">ส่งการแจ้งเตือนทาง SMS</p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={settings.notifications.smsNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications.smsNotifications', checked)}
                />
              </div>
              <div>
                <Label htmlFor="notificationSchedule">เวลาส่งการแจ้งเตือน</Label>
                <Input
                  id="notificationSchedule"
                  type="time"
                  value={settings.notifications.notificationSchedule}
                  onChange={(e) => handleSettingChange('notifications.notificationSchedule', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Settings */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                โซเชียลมีเดีย
              </CardTitle>
              <CardDescription>ตั้งค่าลิงก์โซเชียลมีเดีย</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={settings.socialMedia.facebook}
                  onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={settings.socialMedia.twitter}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={settings.socialMedia.instagram}
                  onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>
              <div>
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={settings.socialMedia.youtube}
                  onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                  placeholder="https://youtube.com/yourchannel"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 