import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Palette, Settings, Sun, Moon, Eye, Save, RefreshCw, Droplets, Flower, Crown, PartyPopper, Heart } from "lucide-react";

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

interface SpecialDay {
  name: string; // e.g., ลอยกระทง 2025
  date: string; // YYYY-MM-DD
  themeKey: string; // one of defaultThemes keys
  repeatAnnually: boolean; // true for fixed annual days (e.g., วันแม่), false for year-specific (e.g., ลอยกระทงปีนั้น)
  active: boolean;
}

export default function ThemeSettings() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [autoThemeEnabled, setAutoThemeEnabled] = useState(false);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [newDay, setNewDay] = useState<SpecialDay>({ name: "", date: "", themeKey: "new_year", repeatAnnually: true, active: true });
  const [rangeBack, setRangeBack] = useState(5);
  const [rangeForward, setRangeForward] = useState(5);
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
    },
    father_day: {
      // Yellow theme (Father's Day / King Rama IX Birthday)
      primary: "hsl(50, 95%, 54%)",
      secondary: "hsl(50, 90%, 90%)",
      background: "hsl(50, 100%, 98%)",
      foreground: "hsl(40, 30%, 20%)",
      accent: "hsl(45, 90%, 85%)"
    },
    mother_day: {
      // Light blue theme (Mother's Day / Queen Mother's Birthday)
      primary: "hsl(200, 90%, 60%)",
      secondary: "hsl(200, 80%, 92%)",
      background: "hsl(200, 100%, 98%)",
      foreground: "hsl(220, 30%, 20%)",
      accent: "hsl(200, 70%, 88%)"
    },
    songkran: {
      // Water festival – fresh aqua
      primary: "hsl(190, 95%, 45%)",
      secondary: "hsl(190, 80%, 90%)",
      background: "hsl(190, 100%, 98%)",
      foreground: "hsl(205, 35%, 18%)",
      accent: "hsl(190, 85%, 80%)"
    },
    loy_krathong: {
      // Night with lantern glow – purple/gold
      primary: "hsl(270, 60%, 50%)",
      secondary: "hsl(45, 93%, 85%)",
      background: "hsl(260, 30%, 12%)",
      foreground: "hsl(210, 40%, 98%)",
      accent: "hsl(45, 93%, 60%)"
    },
    new_year: {
      // Festive – red/gold on light
      primary: "hsl(0, 80%, 55%)",
      secondary: "hsl(45, 90%, 88%)",
      background: "hsl(0, 0%, 100%)",
      foreground: "hsl(220, 25%, 15%)",
      accent: "hsl(45, 93%, 50%)"
    }
  };

  // Known Loy Krathong dates by year (Gregorian). Source: public calendars; adjust as needed.
  const loyKrathongByYear: Record<number, string> = {
    2018: "2018-11-22",
    2019: "2019-11-11",
    2020: "2020-10-31",
    2021: "2021-11-19",
    2022: "2022-11-08",
    2023: "2023-11-27",
    2024: "2024-11-15",
    2025: "2025-11-05",
    2026: "2026-11-24",
    2027: "2027-11-14",
    2028: "2028-11-02",
    2029: "2029-11-20",
    2030: "2030-11-09",
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

        // Load auto theme toggle
        const autoSetting = data.find((s: SiteSetting) => s.settingKey === 'auto_theme_enabled');
        if (autoSetting) {
          setAutoThemeEnabled(autoSetting.settingValue === 'true');
        }

        // Load special days JSON
        const specialDaysSetting = data.find((s: SiteSetting) => s.settingKey === 'special_days');
        if (specialDaysSetting) {
          try {
            const parsed: SpecialDay[] = JSON.parse(specialDaysSetting.settingValue);
            if (Array.isArray(parsed)) setSpecialDays(parsed);
          } catch {}
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

      // Include auto theme toggle as a setting
      colorSettings.push({ key: 'auto_theme_enabled', value: String(autoThemeEnabled), description: 'สลับธีมอัตโนมัติวันสำคัญ' });
      // Include special days JSON
      colorSettings.push({ key: 'special_days', value: JSON.stringify(specialDays), description: 'รายการวันสำคัญที่กำหนดเอง' });

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

  // Detect Thai special days and return theme key
  const detectSpecialDayTheme = (date: Date): string | null => {
    // Use Thailand timezone implicitly via user's local time
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1; // 1-12
    const yyyy = d.getFullYear();

    // 1) Check custom special days first
    for (const sd of specialDays) {
      if (!sd.active) continue;
      if (!sd.date) continue;
      // sd.date is YYYY-MM-DD
      const [sy, sm, sday] = sd.date.split('-').map((v) => parseInt(v, 10));
      if (sd.repeatAnnually) {
        if (sm === month && sday === day) return sd.themeKey;
      } else {
        if (sy === yyyy && sm === month && sday === day) return sd.themeKey;
      }
    }

    // New Year: Dec 31 - Jan 1
    if ((month === 12 && day === 31) || (month === 1 && day === 1)) return 'new_year';
    // Songkran: Apr 13-15
    if (month === 4 && day >= 13 && day <= 15) return 'songkran';
    // Mother's Day (H.M. Queen Mother's Birthday): Aug 12
    if (month === 8 && day === 12) return 'mother_day';
    // Father's Day (H.M. King Rama IX's Birthday): Dec 5
    if (month === 12 && day === 5) return 'father_day';
    // Loy Krathong: lunar-based, varies each year – not calculated here
    // Optionally, approximate: mid-November (10-20)
    if (month === 11 && day >= 10 && day <= 20) return 'loy_krathong';

    return null;
  };

  // Apply auto theme when enabled
  useEffect(() => {
    if (!autoThemeEnabled) return;
    const key = detectSpecialDayTheme(new Date());
    if (key) {
      loadPresetTheme(key);
      if (previewMode) {
        applyThemeToDOM();
      }
    }
    // Re-check at midnight
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timer = setTimeout(() => {
      const k = detectSpecialDayTheme(new Date());
      if (k) {
        loadPresetTheme(k);
        if (previewMode) applyThemeToDOM();
      }
    }, msUntilMidnight + 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoThemeEnabled]);

  // Handlers for special days CRUD
  const addSpecialDay = () => {
    if (!newDay.name || !newDay.date || !newDay.themeKey) return;
    setSpecialDays((prev) => [...prev, { ...newDay }]);
    setNewDay({ name: "", date: "", themeKey: Object.keys(defaultThemes)[0], repeatAnnually: true, active: true });
  };

  const removeSpecialDay = (index: number) => {
    setSpecialDays((prev) => prev.filter((_, i) => i !== index));
  };

  // Bulk add Loy Krathong within a year range
  const bulkAddLoyKrathong = () => {
    const nowY = new Date().getFullYear();
    const start = nowY - Math.max(0, Number(rangeBack) || 0);
    const end = nowY + Math.max(0, Number(rangeForward) || 0);
    const additions: SpecialDay[] = [];
    for (let y = start; y <= end; y++) {
      const d = loyKrathongByYear[y];
      if (!d) continue;
      const name = `ลอยกระทง ${y}`;
      // avoid duplicates by same name or same date
      const exists = specialDays.some(sd => sd.date === d || sd.name === name);
      if (exists) continue;
      additions.push({ name, date: d, themeKey: 'loy_krathong', repeatAnnually: false, active: true });
    }
    if (additions.length === 0) {
      toast({ title: 'ไม่มีรายการใหม่', description: 'ข้อมูลลอยกระทงในช่วงปีนี้ถูกเพิ่มไว้แล้วหรือไม่มีข้อมูล', variant: 'default' });
      return;
    }
    setSpecialDays(prev => [...prev, ...additions]);
    toast({ title: 'เพิ่มสำเร็จ', description: `เพิ่มลอยกระทง ${additions.length} ปี`, variant: 'default' });
  };

  // Import CSV/JSON parser
  const handleImportFile = async (file: File) => {
    const text = await file.text();
    let imported: SpecialDay[] = [];
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) imported = parsed as SpecialDay[];
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        imported = parseCSVToSpecialDays(text);
      } else {
        // try JSON fallback
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) imported = parsed as SpecialDay[];
      }
    } catch (e) {
      toast({ title: 'นำเข้าไม่สำเร็จ', description: 'รูปแบบไฟล์ไม่ถูกต้อง', variant: 'destructive' });
      return;
    }

    // validate and normalize
    const valid = imported.filter((i) => {
      return (
        i && typeof i.name === 'string' && /\d{4}-\d{2}-\d{2}/.test(i.date || '') &&
        typeof i.themeKey === 'string' && defaultThemes.hasOwnProperty(i.themeKey as keyof typeof defaultThemes)
      );
    }).map((i) => ({
      name: i.name,
      date: i.date,
      themeKey: i.themeKey,
      repeatAnnually: Boolean(i.repeatAnnually),
      active: i.active !== false,
    }));

    if (valid.length === 0) {
      toast({ title: 'ไม่มีข้อมูลที่เพิ่มได้', description: 'ตรวจสอบคอลัมน์ name,date,themeKey,repeatAnnually,active', variant: 'destructive' });
      return;
    }

    // de-duplicate by date+name
    const merged = [...specialDays];
    for (const item of valid) {
      const dup = merged.some(sd => (sd.date === item.date) || (sd.name === item.name));
      if (!dup) merged.push(item);
    }
    setSpecialDays(merged);
    toast({ title: 'นำเข้าสำเร็จ', description: `เพิ่ม ${merged.length - specialDays.length} รายการใหม่`, variant: 'default' });
  };

  const parseCSVToSpecialDays = (csv: string): SpecialDay[] => {
    const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    // expect header
    const header = lines[0].split(',').map(h => h.trim());
    const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const iName = idx('name');
    const iDate = idx('date');
    const iTheme = idx('themeKey');
    const iRepeat = idx('repeatAnnually');
    const iActive = idx('active');
    if (iName < 0 || iDate < 0 || iTheme < 0) return [];
    const out: SpecialDay[] = [];
    for (let li = 1; li < lines.length; li++) {
      const parts = lines[li].split(',');
      const name = (parts[iName] || '').trim();
      const date = (parts[iDate] || '').trim();
      const themeKey = (parts[iTheme] || '').trim();
      const repeatAnnually = ((parts[iRepeat] || '').trim().toLowerCase()) === 'true';
      const active = ((parts[iActive] || 'true').trim().toLowerCase()) !== 'false';
      out.push({ name, date, themeKey, repeatAnnually, active });
    }
    return out;
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
          {/* Auto Theme Toggle */}
          <div className="flex items-center justify-between py-2 px-3 rounded border">
            <div>
              <Label className="text-base font-medium">สลับธีมอัตโนมัติ (วันสำคัญของไทย)</Label>
              <div className="text-sm text-muted-foreground">สลับธีมให้เข้ากับวันสำคัญ เช่น วันพ่อ วันแม่ สงกรานต์ ปีใหม่</div>
            </div>
            <Switch checked={autoThemeEnabled} onCheckedChange={setAutoThemeEnabled} />
          </div>

          {/* Custom Special Days Manager */}
          <div className="space-y-3">
            <Label className="text-base font-medium">กำหนดวันสำคัญเอง</Label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <div className="md:col-span-2">
                <Label htmlFor="sd-name">ชื่อวัน</Label>
                <Input id="sd-name" value={newDay.name} onChange={(e) => setNewDay({ ...newDay, name: e.target.value })} placeholder="เช่น ลอยกระทง 2025" />
              </div>
              <div>
                <Label htmlFor="sd-date">วันที่</Label>
                <Input id="sd-date" type="date" value={newDay.date} onChange={(e) => setNewDay({ ...newDay, date: e.target.value })} />
              </div>
              <div>
                <Label>ธีม</Label>
                <Select value={newDay.themeKey} onValueChange={(v) => setNewDay({ ...newDay, themeKey: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกธีม" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(defaultThemes).map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={newDay.repeatAnnually} onCheckedChange={(v) => setNewDay({ ...newDay, repeatAnnually: v })} />
                  <span className="text-sm">ทำซ้ำทุกปี</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newDay.active} onCheckedChange={(v) => setNewDay({ ...newDay, active: v })} />
                  <span className="text-sm">เปิดใช้งาน</span>
                </div>
              </div>
              <div>
                <Button className="w-full" onClick={addSpecialDay}>เพิ่ม</Button>
              </div>
            </div>

            {/* Bulk Loy Krathong + Import */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <div>
                <Label>ย้อนหลัง (ปี)</Label>
                <Input type="number" min={0} value={rangeBack} onChange={(e) => setRangeBack(parseInt(e.target.value || '0', 10))} />
              </div>
              <div>
                <Label>ล่วงหน้า (ปี)</Label>
                <Input type="number" min={0} value={rangeForward} onChange={(e) => setRangeForward(parseInt(e.target.value || '0', 10))} />
              </div>
              <div>
                <Label className="invisible">_</Label>
                <Button className="w-full" variant="outline" onClick={bulkAddLoyKrathong}>เติมลอยกระทง (ช่วงปี)</Button>
              </div>
              <div className="md:col-span-2">
                <Label>นำเข้า CSV/JSON (หัวข้อ: name,date,themeKey,repeatAnnually,active)</Label>
                <Input type="file" accept=".csv,.json" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f);
                  e.currentTarget.value = '';
                }} />
              </div>
            </div>

            {specialDays.length > 0 && (
              <div className="border rounded">
                <div className="grid grid-cols-5 gap-2 text-sm font-medium bg-muted/50 p-2 rounded-t">
                  <div>ชื่อ</div>
                  <div>วันที่</div>
                  <div>ธีม</div>
                  <div>ทำซ้ำ/เปิดใช้</div>
                  <div className="text-right">การจัดการ</div>
                </div>
                <div className="divide-y">
                  {specialDays.map((sd, idx) => (
                    <div className="grid grid-cols-5 gap-2 items-center p-2" key={`${sd.name}-${idx}`}>
                      <div className="truncate" title={sd.name}>{sd.name}</div>
                      <div>{sd.date}</div>
                      <div>{sd.themeKey}</div>
                      <div>
                        <Badge variant={sd.repeatAnnually ? 'default' : 'outline'} className="mr-2">{sd.repeatAnnually ? 'ทุกปี' : 'เฉพาะปี'}</Badge>
                        <Badge variant={sd.active ? 'default' : 'secondary'}>{sd.active ? 'เปิด' : 'ปิด'}</Badge>
                      </div>
                      <div className="text-right">
                        <Button variant="outline" size="sm" onClick={() => removeSpecialDay(idx)}>ลบ</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Preset Themes */}
          <div>
            <Label className="text-base font-medium">ธีมที่กำหนดไว้</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
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
              <Button
                variant={selectedThemeType === "mint" ? "default" : "outline"}
                onClick={() => loadPresetTheme("mint")}
                className="flex items-center gap-2"
                data-testid="button-theme-mint"
              >
                <Droplets className="h-4 w-4" />
                ธีมมิ้นต์
              </Button>
              <Button
                variant={selectedThemeType === "father_day" ? "default" : "outline"}
                onClick={() => loadPresetTheme("father_day")}
                className="flex items-center gap-2"
                data-testid="button-theme-father"
              >
                <Crown className="h-4 w-4" />
                วันพ่อ
              </Button>
              <Button
                variant={selectedThemeType === "mother_day" ? "default" : "outline"}
                onClick={() => loadPresetTheme("mother_day")}
                className="flex items-center gap-2"
                data-testid="button-theme-mother"
              >
                <Heart className="h-4 w-4" />
                วันแม่
              </Button>
              <Button
                variant={selectedThemeType === "songkran" ? "default" : "outline"}
                onClick={() => loadPresetTheme("songkran")}
                className="flex items-center gap-2"
                data-testid="button-theme-songkran"
              >
                <Droplets className="h-4 w-4" />
                สงกรานต์
              </Button>
              <Button
                variant={selectedThemeType === "loy_krathong" ? "default" : "outline"}
                onClick={() => loadPresetTheme("loy_krathong")}
                className="flex items-center gap-2"
                data-testid="button-theme-loy"
              >
                <Flower className="h-4 w-4" />
                ลอยกระทง
              </Button>
              <Button
                variant={selectedThemeType === "new_year" ? "default" : "outline"}
                onClick={() => loadPresetTheme("new_year")}
                className="flex items-center gap-2"
                data-testid="button-theme-newyear"
              >
                <PartyPopper className="h-4 w-4" />
                ปีใหม่
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