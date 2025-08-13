import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Palette, Settings, Sun, Moon, Eye, Save, RefreshCw } from "lucide-react";

interface SiteSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  settingType: "color" | "theme" | "general" | "layout";
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ThemePreview {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  accent: string;
}

export default function ThemeSettings() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  // Default theme values
  const defaultThemes = {
    light: {
      primary: "hsl(210, 40%, 98%)",
      secondary: "hsl(210, 40%, 96%)",
      background: "hsl(0, 0%, 100%)",
      foreground: "hsl(222.2, 84%, 4.9%)",
      accent: "hsl(210, 40%, 96%)"
    },
    dark: {
      primary: "hsl(222.2, 84%, 4.9%)",
      secondary: "hsl(217.2, 32.6%, 17.5%)",
      background: "hsl(222.2, 84%, 4.9%)",
      foreground: "hsl(210, 40%, 98%)",
      accent: "hsl(217.2, 32.6%, 17.5%)"
    },
    thai: {
      primary: "hsl(45, 93%, 47%)", // Thai gold
      secondary: "hsl(0, 84%, 60%)", // Thai red
      background: "hsl(0, 0%, 100%)",
      foreground: "hsl(222.2, 84%, 4.9%)",
      accent: "hsl(45, 93%, 90%)" // Light gold
    },
    mint: {
      primary: "hsl(160, 50%, 45%)", // Mint green
      secondary: "hsl(160, 25%, 85%)", // Light mint
      background: "hsl(160, 20%, 98%)", // Very light mint
      foreground: "hsl(160, 20%, 10%)", // Dark mint
      accent: "hsl(160, 30%, 90%)" // Soft mint
    }
  };

  const [currentTheme, setCurrentTheme] = useState<ThemePreview>(defaultThemes.light);
  const [selectedThemeType, setSelectedThemeType] = useState("light");

  // Load settings from API
  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch("/api/site-settings", {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        // Extract current theme from settings
        const themeSettings = data.filter((s: SiteSetting) => s.settingType === "color");
        if (themeSettings.length > 0) {
          const theme: ThemePreview = {
            primary: themeSettings.find((s: SiteSetting) => s.settingKey === "color_primary")?.settingValue || defaultThemes.light.primary,
            secondary: themeSettings.find((s: SiteSetting) => s.settingKey === "color_secondary")?.settingValue || defaultThemes.light.secondary,
            background: themeSettings.find((s: SiteSetting) => s.settingKey === "color_background")?.settingValue || defaultThemes.light.background,
            foreground: themeSettings.find((s: SiteSetting) => s.settingKey === "color_foreground")?.settingValue || defaultThemes.light.foreground,
            accent: themeSettings.find((s: SiteSetting) => s.settingKey === "color_accent")?.settingValue || defaultThemes.light.accent,
          };
          setCurrentTheme(theme);
        }
      }
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดการตั้งค่าธีมได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save theme settings
  const saveThemeSettings = async () => {
    setSaving(true);
    try {
      const colorSettings = [
        { key: "color_primary", value: currentTheme.primary, description: "สีหลัก" },
        { key: "color_secondary", value: currentTheme.secondary, description: "สีรอง" },
        { key: "color_background", value: currentTheme.background, description: "สีพื้นหลัง" },
        { key: "color_foreground", value: currentTheme.foreground, description: "สีข้อความ" },
        { key: "color_accent", value: currentTheme.accent, description: "สีเน้น" },
        { key: "theme_type", value: selectedThemeType, description: "ประเภทธีม" }
      ];

      // Save each setting
      for (const setting of colorSettings) {
        // Check if setting exists
        const existingSetting = settings.find(s => s.settingKey === setting.key);
        
        if (existingSetting) {
          // Update existing
          const token = localStorage.getItem('adminToken');
          await fetch(`/api/site-settings/${setting.key}`, {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json",
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ settingValue: setting.value }),
          });
        } else {
          // Create new
          const token = localStorage.getItem('adminToken');
          await fetch("/api/site-settings", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
              settingKey: setting.key,
              settingValue: setting.value,
              settingType: setting.key.startsWith("color_") ? "color" : "theme",
              description: setting.description,
              isActive: true,
            }),
          });
        }
      }

      // Apply theme to CSS variables
      applyThemeToDOM();
      
      toast({
        title: "สำเร็จ",
        description: "บันทึกการตั้งค่าธีมแล้ว",
      });
      
      // Reload settings
      await loadSettings();
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าธีมได้",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Apply theme to DOM CSS variables
  const applyThemeToDOM = () => {
    const root = document.documentElement;
    root.style.setProperty("--primary", currentTheme.primary);
    root.style.setProperty("--secondary", currentTheme.secondary);
    root.style.setProperty("--background", currentTheme.background);
    root.style.setProperty("--foreground", currentTheme.foreground);
    root.style.setProperty("--accent", currentTheme.accent);
  };

  // Load preset theme
  const loadPresetTheme = (themeType: string) => {
    setSelectedThemeType(themeType);
    const preset = defaultThemes[themeType as keyof typeof defaultThemes];
    if (preset) {
      setCurrentTheme(preset);
      if (previewMode) {
        applyThemeToDOM();
      }
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      applyThemeToDOM();
    } else {
      // Reset to original theme
      loadSettings();
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            กำลังโหลด...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            การตั้งค่าธีมและสี
          </CardTitle>
          <CardDescription>
            ปรับแต่งรูปลักษณ์และสีของเว็บไซต์
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Themes */}
          <div>
            <Label className="text-base font-medium">ธีมที่กำหนดไว้</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <Button
                variant={selectedThemeType === "light" ? "default" : "outline"}
                onClick={() => loadPresetTheme("light")}
                className="flex items-center gap-2"
                data-testid="button-theme-light"
              >
                <Sun className="h-4 w-4" />
                ธีมสว่าง
              </Button>
              <Button
                variant={selectedThemeType === "dark" ? "default" : "outline"}
                onClick={() => loadPresetTheme("dark")}
                className="flex items-center gap-2"
                data-testid="button-theme-dark"
              >
                <Moon className="h-4 w-4" />
                ธีมมืด
              </Button>
              <Button
                variant={selectedThemeType === "thai" ? "default" : "outline"}
                onClick={() => loadPresetTheme("thai")}
                className="flex items-center gap-2"
                data-testid="button-theme-thai"
              >
                <Settings className="h-4 w-4" />
                ธีมไทย
              </Button>
            </div>
          </div>

          {/* Color Customization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary-color">สีหลัก</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="primary-color"
                  type="color"
                  value={currentTheme.primary.includes("hsl") ? "#3b82f6" : currentTheme.primary}
                  onChange={(e) => setCurrentTheme({...currentTheme, primary: e.target.value})}
                  className="w-20"
                  data-testid="input-color-primary"
                />
                <Input
                  value={currentTheme.primary}
                  onChange={(e) => setCurrentTheme({...currentTheme, primary: e.target.value})}
                  placeholder="เช่น hsl(210, 40%, 98%)"
                  data-testid="input-text-primary"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondary-color">สีรอง</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="secondary-color"
                  type="color"
                  value={currentTheme.secondary.includes("hsl") ? "#64748b" : currentTheme.secondary}
                  onChange={(e) => setCurrentTheme({...currentTheme, secondary: e.target.value})}
                  className="w-20"
                  data-testid="input-color-secondary"
                />
                <Input
                  value={currentTheme.secondary}
                  onChange={(e) => setCurrentTheme({...currentTheme, secondary: e.target.value})}
                  placeholder="เช่น hsl(210, 40%, 96%)"
                  data-testid="input-text-secondary"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="background-color">สีพื้นหลัง</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="background-color"
                  type="color"
                  value={currentTheme.background.includes("hsl") ? "#ffffff" : currentTheme.background}
                  onChange={(e) => setCurrentTheme({...currentTheme, background: e.target.value})}
                  className="w-20"
                  data-testid="input-color-background"
                />
                <Input
                  value={currentTheme.background}
                  onChange={(e) => setCurrentTheme({...currentTheme, background: e.target.value})}
                  placeholder="เช่น hsl(0, 0%, 100%)"
                  data-testid="input-text-background"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="foreground-color">สีข้อความ</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="foreground-color"
                  type="color"
                  value={currentTheme.foreground.includes("hsl") ? "#1e293b" : currentTheme.foreground}
                  onChange={(e) => setCurrentTheme({...currentTheme, foreground: e.target.value})}
                  className="w-20"
                  data-testid="input-color-foreground"
                />
                <Input
                  value={currentTheme.foreground}
                  onChange={(e) => setCurrentTheme({...currentTheme, foreground: e.target.value})}
                  placeholder="เช่น hsl(222.2, 84%, 4.9%)"
                  data-testid="input-text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Preview and Save Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              onClick={togglePreview}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-preview"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? "ปิดตัวอย่าง" : "ดูตัวอย่าง"}
            </Button>
            
            <Button
              onClick={saveThemeSettings}
              disabled={saving}
              className="flex items-center gap-2"
              data-testid="button-save-theme"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "กำลังบันทึก..." : "บันทึกธีม"}
            </Button>

            <Button
              onClick={loadSettings}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-reset"
            >
              <RefreshCw className="h-4 w-4" />
              รีเซ็ต
            </Button>
          </div>

          {/* Current Settings Display */}
          {settings.length > 0 && (
            <div className="pt-4 border-t">
              <Label className="text-base font-medium">การตั้งค่าปัจจุบัน</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {settings.filter(s => s.settingType === "color" || s.settingType === "theme").map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {setting.settingKey}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {setting.description}
                      </div>
                    </div>
                    <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {setting.settingValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}