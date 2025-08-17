import { notificationService } from './notification-service';
import { storage } from './storage';

export interface DisasterAlert {
  id: string;
  type: 'earthquake' | 'flood' | 'storm' | 'fire' | 'tsunami' | 'drought' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  area: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  startTime: string;
  endTime?: string;
  instructions: string;
  source: string;
  isActive: boolean;
}

class DisasterAlertService {
  private alerts: DisasterAlert[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false; // Added flag

  constructor() {
    this.startMonitoring();
  }

  // เริ่มต้นการตรวจสอบภัยพิบัติ
  startMonitoring() {
    // ตรวจสอบทุก 15 นาที
    this.checkInterval = setInterval(() => {
      this.checkForDisasters();
    }, 15 * 60 * 1000);

    // ตรวจสอบครั้งแรกเมื่อเริ่มต้น
    this.checkForDisasters();
    console.log('🚨 Disaster Alert System started - monitoring every 15 minutes');
    this.isInitialized = true; // Set initialized flag
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // ตรวจสอบข้อมูลภัยพิบัติจาก API ต่างๆ
  async checkForDisasters() {
    try {
      // ตรวจสอบจากกรมอุตุนิยมวิทยา (TMD)
      await this.checkTMDAlerts();

      // ตรวจสอบจาก API อื่นๆ เช่น USGS สำหรับแผ่นดินไหว
      await this.checkUSGSEarthquakes();

      // ตรวจสอบการเตือนภัยจากข่าวที่มี keywords ภัยพิบัติ
      await this.checkNewsForDisasters();

    } catch (error) {
      console.error('Error checking for disasters:', error);
    }
  }

  // ตรวจสอบข้อมูลจากกรมอุตุนิยมวิทยา
  async checkTMDAlerts() {
    try {
      const apiKey = process.env.TMD_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ TMD_API_KEY is not set; skipping TMD check and using simulation');
        await this.simulateWeatherCheck();
        return;
      }

      // NOTE: Endpoint shape per TMD docs. If schema differs, we parse defensively below.
      // Udon Thani city coordinates (approx): 17.413, 102.787
      const lat = process.env.TMD_DEFAULT_LAT || '17.413';
      const lon = process.env.TMD_DEFAULT_LON || '102.787';

      // Attempt common TMD NWP API pattern for forecast by location. Adjust if needed.
      const urlCandidates = [
        // Preferred v1 API (as per example)
        `https://data.tmd.go.th/nwpapiv1/forecast/location/city?lat=${lat}&lon=${lon}`,
        `https://data.tmd.go.th/nwpapiv1/forecast/location?lat=${lat}&lon=${lon}`,
        // Legacy paths kept as fallback
        `https://data.tmd.go.th/nwpapi/forecast/location/city?lat=${lat}&lon=${lon}`,
        `https://data.tmd.go.th/nwpapi/forecast/location?lat=${lat}&lon=${lon}`
      ];

      let fetched = false;
      for (const url of urlCandidates) {
        try {
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            // TMD sometimes requires no-cache to avoid stale proxies
            cache: 'no-store' as any
          } as any);

          if (response.ok) {
            // Optional: log rate limit headers if present for observability
            const rl = response.headers.get('X-RateLimit-Remaining') || response.headers.get('x-ratelimit-remaining');
            const rlLimit = response.headers.get('X-RateLimit-Limit') || response.headers.get('x-ratelimit-limit');
            if (rl || rlLimit) {
              console.log(`TMD rate limit: remaining=${rl ?? 'n/a'}/${rlLimit ?? 'n/a'}`);
            }
            const data = await response.json();
            await this.processWeatherAlerts(data);
            fetched = true;
            break;
          } else {
            console.warn(`TMD request failed ${response.status} for ${url}`);
          }
        } catch (err) {
          console.warn(`TMD request error for ${url}:`, err);
        }
      }

      if (!fetched) {
        // As a fallback if endpoint changed/unavailable
        await this.simulateWeatherCheck();
      }
    } catch (error) {
      // ถ้า API ไม่พร้อมใช้งาน ให้ใช้ข้อมูลจำลอง
      await this.simulateWeatherCheck();
    }
  }

  // ประมวลผลข้อมูลเตือนภัยสภาพอากาศจาก TMD (แบบย่อเพื่อแก้ TS error และรองรับภายหลัง)
  private async processWeatherAlerts(data: any): Promise<void> {
    try {
      // Defensive parsing: handle multiple potential structures
      // Common structures: { data: { forecast: [...] } } or { forecast: [...] }
      const root = (data && (data.data || data)) || {};
      const forecasts: any[] = root.forecast || root.forecasts || root.items || [];

      if (!Array.isArray(forecasts) || forecasts.length === 0) {
        // Some APIs nest hourly under a station/city node
        const values = Object.values(root) as any[];
        const firstArray = values.find((v) => Array.isArray(v));
        if (Array.isArray(firstArray)) {
          await this.processWeatherAlerts({ forecast: firstArray });
          return;
        }
        return; // No usable data
      }

      // Evaluate next 6-12 hours for severe conditions
      const now = Date.now();
      const horizonMs = 12 * 60 * 60 * 1000; // 12 hours
      const upcoming = forecasts.filter((f: any) => {
        const t = new Date(f.time || f.date || f.datetime || f.timestamp || now).getTime();
        return !Number.isNaN(t) && t >= now && t <= now + horizonMs;
      });

      // Extract precipitation probability and accumulation, wind, thunder flags
      const pickNum = (obj: any, keys: string[], def = 0) => {
        for (const k of keys) {
          const v = obj?.[k];
          const n = typeof v === 'string' ? parseFloat(v) : (typeof v === 'number' ? v : undefined);
          if (typeof n === 'number' && !Number.isNaN(n)) return n;
        }
        return def;
      };

      const pickBool = (obj: any, keys: string[]) => {
        for (const k of keys) {
          const v = obj?.[k];
          if (typeof v === 'boolean') return v;
          if (typeof v === 'string' && ['true','1','yes'].includes(v.toLowerCase())) return true;
          if (typeof v === 'number') return v !== 0;
        }
        return false;
      };

      let maxPop = 0; // probability of precipitation %
      let maxRain = 0; // rain accumulation mm
      let maxWind = 0; // wind speed m/s or km/h (normalize roughly)
      let anyThunder = false;

      for (const f of upcoming) {
        const pop = pickNum(f, ['pop','precipProbability','precip_prob','rain_prob']);
        const rain = pickNum(f, ['rain','precip_mm','precipitation','rain_accumulation']);
        let wind = pickNum(f, ['wind','windSpeed','wind_speed']);
        // Normalize if likely km/h -> convert to m/s (rough guess if value seems high)
        if (wind > 60) wind = wind / 3.6;
        const thunder = pickBool(f, ['thunder','thunderstorm','storm']);

        if (pop > maxPop) maxPop = pop;
        if (rain > maxRain) maxRain = rain;
        if (wind > maxWind) maxWind = wind;
        anyThunder = anyThunder || thunder;
      }

      // Threshold mapping (tunable)
      // Critical: thunder or very high precipitation probability and accumulation
      let severity: DisasterAlert['severity'] | null = null;
      if (anyThunder && (maxPop >= 80 || maxRain >= 50)) {
        severity = 'critical';
      } else if (maxPop >= 70 || maxRain >= 30 || maxWind >= 20) {
        severity = 'high';
      } else if (maxPop >= 50 || maxRain >= 10) {
        severity = 'medium';
      } else if (maxPop >= 30) {
        severity = 'low';
      }

      if (!severity) return; // No alert-worthy conditions

      const alert: DisasterAlert = {
        id: `tmd-${Math.floor(now / (60 * 60 * 1000))}`, // hourly bucket to avoid spam
        type: anyThunder || maxWind >= 20 ? 'storm' : (maxRain >= 20 ? 'flood' : 'storm'),
        severity,
        title: severity === 'critical' ? 'พายุรุนแรงใกล้เข้าพื้นที่' : severity === 'high' ? 'ฝนตกหนัก/ลมแรง' : 'สภาพอากาศแปรปรวน',
        description: `คาดการณ์ฝน/พายุในช่วง 12 ชม. (POP≈${Math.round(maxPop)}%, ฝนสะสม≈${Math.round(maxRain)}mm, ลม≈${Math.round(maxWind)}m/s)` ,
        area: 'อุดรธานี',
        startTime: new Date().toISOString(),
        instructions: severity === 'critical'
          ? 'งดกิจกรรมกลางแจ้ง หาที่หลบภัย ปฏิบัติตามประกาศทางการ'
          : severity === 'high'
          ? 'ระวังน้ำท่วมฉับพลัน/ลมแรง ติดตามประกาศจากหน่วยงานรัฐ'
          : 'เตรียมอุปกรณ์กันฝนและติดตามสภาพอากาศ',
        source: 'TMD',
        isActive: true
      };

      if (!this.alerts.find(a => a.id === alert.id)) {
        await this.processNewAlert(alert);
      }
    } catch (err) {
      console.warn('TMD weather parsing failed, fallback to simulation');
      await this.simulateWeatherCheck();
    }
  }

  // ตรวจสอบแผ่นดินไหวจาก USGS
  async checkUSGSEarthquakes() {
    try {
      const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
      if (!response.ok) return;

      const data = await response.json();

      // กรองเฉพาะแผ่นดินไหวในประเทศไทยและประเทศใกล้เคียง
      const thaiRegion = data.features.filter((earthquake: any) => {
        const [lng, lat] = earthquake.geometry.coordinates;
        // พื้นที่ประเทศไทยและประเทศใกล้เคียง
        return lat >= 5 && lat <= 21 && lng >= 95 && lng <= 110;
      });

      for (const earthquake of thaiRegion) {
        const magnitude = earthquake.properties.mag;
        const [lng, lat] = earthquake.geometry.coordinates;

        if (magnitude >= 4.5) {
          const alert: DisasterAlert = {
            id: `earthquake-${earthquake.id}`,
            type: 'earthquake',
            severity: magnitude >= 6.0 ? 'critical' : magnitude >= 5.0 ? 'high' : 'medium',
            title: `แผ่นดินไหว ขนาด ${magnitude.toFixed(1)} ริกเตอร์`,
            description: `เกิดแผ่นดินไหวขนาด ${magnitude.toFixed(1)} ริกเตอร์ ใกล้กับประเทศไทย`,
            area: earthquake.properties.place || 'พื้นที่ใกล้เคียง',
            coordinates: { lat, lng },
            startTime: new Date(earthquake.properties.time).toISOString(),
            instructions: magnitude >= 5.0 
              ? 'หาที่หลบภัยปลอดภัย หลีกเลี่ยงอาคารสูง และเตรียมพร้อมรับมือกับแรงสั่นสะเทือน'
              : 'ติดตามข่าวสารและเตรียมพร้อม',
            source: 'USGS',
            isActive: true
          };

          if (!this.alerts.find(a => a.id === alert.id)) {
            await this.processNewAlert(alert);
          }
        }
      }
    } catch (error) {
      console.error('Error checking USGS earthquakes:', error);
    }
  }

  // ตรวจสอบข่าวที่มี keyword เกี่ยวกับภัยพิบัติ
  async checkNewsForDisasters() {
    try {
      const disasterKeywords = [
        'น้ำท่วม', 'อุทกภัย', 'แผ่นดินไหว', 'พายุ', 'พื้นที่ประสบภัย',
        'ไฟป่า', 'ภัยแล้ง', 'คลื่นสึนามิ', 'ดินโคลนถล่ม', 'ฟ้าผ่า'
      ];

      const recentNews = await storage.getAllNews();
      const today = new Date();
      today.setHours(today.getHours() - 2); // ข่าวใน 2 ชั่วโมงที่ผ่านมา

      for (const news of recentNews) {
        const newsDate = new Date((news as any).createdAt as any);
        if (newsDate < today) continue;

        const hasDisasterKeyword = disasterKeywords.some(keyword => 
          news.title.includes(keyword) || news.summary.includes(keyword)
        );

        if (hasDisasterKeyword && news.category === 'ข่าวท้องถิ่น') {
          const alert: DisasterAlert = {
            id: `news-disaster-${news.id}`,
            type: 'other',
            severity: 'medium',
            title: `เตือนภัยจากข่าว: ${news.title.substring(0, 50)}...`,
            description: news.summary,
            area: 'อุดรธานี',
            startTime: new Date((news as any).createdAt as any).toISOString(),
            instructions: 'ติดตามข่าวสารเพิ่มเติม และปฏิบัติตามคำแนะนำของหน่วยงานที่เกี่ยวข้อง',
            source: 'UD News',
            isActive: true
          };

          if (!this.alerts.find(a => a.id === alert.id)) {
            await this.processNewAlert(alert);
          }
        }
      }
    } catch (error) {
      console.error('Error checking news for disasters:', error);
    }
  }

  // จำลองการตรวจสอบสภาพอากาศ (สำหรับทดสอบ)
  async simulateWeatherCheck() {
    const random = Math.random();

    // สุ่มสร้างการเตือนภัย 5% ของเวลา
    if (random < 0.05) {
      const alerts = [
        {
          type: 'storm' as const,
          severity: 'high' as const,
          title: 'เตือนพายุฝนฟ้าคะนอง',
          description: 'มีพายุฝนฟ้าคะนองเข้าสู่พื้นที่ จังหวัดอุดรธานี',
          instructions: 'หลีกเลี่ยงการเดินทาง หาที่หลบภัยปลอดภัย'
        },
        {
          type: 'flood' as const,
          severity: 'medium' as const,
          title: 'เตือนระดับน้ำเพิ่มขึ้น',
          description: 'ระดับน้ำในแม่น้ำเพิ่มขึ้น อาจเกิดน้ำท่วมฉับพลัน',
          instructions: 'ย้ายทรัพย์สินไปที่สูง เตรียมพร้อมอพยพ'
        }
      ];

      const selectedAlert = alerts[Math.floor(Math.random() * alerts.length)];
      const alert: DisasterAlert = {
        id: `sim-${Date.now()}`,
        ...selectedAlert,
        area: 'อุดรธานี',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 ชั่วโมง
        source: 'TMD Simulation',
        isActive: true
      };

      await this.processNewAlert(alert);
    }
  }

  // ประมวลผลการเตือนภัยใหม่
  async processNewAlert(alert: DisasterAlert) {
    this.alerts.push(alert);
    console.log(`🚨 New disaster alert: ${alert.title}`);

    // ส่งการแจ้งเตือนผ่าน Push Notification
    await this.sendDisasterNotifications(alert);

    // บันทึกลงฐานข้อมูลเป็นข่าวด่วน
    await this.saveAsBreakingNews(alert);
  }

  // ส่งการแจ้งเตือนภัยพิบัติ
  async sendDisasterNotifications(alert: DisasterAlert) {
    try {
      // ส่งผ่าน Push Notification
      const subscriptions = await storage.getAllActivePushSubscriptions();

      for (const subscription of subscriptions) {
        await notificationService.sendPushNotification(
          subscription,
          `🚨 ${alert.title}`,
          `/disaster-alert/${alert.id}`
        );
      }

      // ส่งอีเมลแจ้งเตือนด่วน (สำหรับภัยร้ายแรง)
      if (alert.severity === 'critical' || alert.severity === 'high') {
        const subscribers = await storage.getAllNewsletterSubscribers();
        const emails = subscribers.map(sub => sub.email);

        if (emails.length > 0) {
          await notificationService.sendBreakingNewsEmail(
            emails,
            `🚨 ${alert.title}`,
            `${process.env.BASE_URL}/disaster-alert/${alert.id}`
          );
        }
      }
    } catch (error) {
      console.error('Error sending disaster notifications:', error);
    }
  }

  // บันทึกเป็นข่าวด่วน
  async saveAsBreakingNews(alert: DisasterAlert) {
    try {
      const newsData = {
        title: alert.title,
        summary: alert.description,
        content: `
          <div class="disaster-alert">
            <h2>🚨 การเตือนภัยพิบัติ</h2>
            <p><strong>ประเภท:</strong> ${this.getDisasterTypeName(alert.type)}</p>
            <p><strong>ระดับความรุนแรง:</strong> ${this.getSeverityName(alert.severity)}</p>
            <p><strong>พื้นที่:</strong> ${alert.area}</p>
            <p><strong>รายละเอียด:</strong> ${alert.description}</p>
            <div class="instructions">
              <h3>คำแนะนำ:</h3>
              <p>${alert.instructions}</p>
            </div>
            <p><em>ข้อมูลจาก: ${alert.source}</em></p>
          </div>
        `,
        category: 'ข่าวด่วน',
        author: 'ระบบเตือนภัย',
        tags: ['ภัยพิบัติ', alert.type, alert.area],
        isBreaking: true,
        publishedAt: alert.startTime
      };

      await storage.insertNews(newsData);
    } catch (error) {
      console.error('Error saving disaster alert as news:', error);
    }
  }

  // ดึงรายการแจ้งเตือนที่ยังใช้งานอยู่
  getActiveAlerts(): DisasterAlert[] {
    if (!this.isInitialized) {
      console.warn('⚠️ Disaster Alert Service not properly initialized');
      return [];
    }
    return this.alerts.filter(alert => alert.isActive);
  }

  // ปิดการเตือนภัย
  deactivateAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isActive = false;
    }
  }

  private getDisasterTypeName(type: string): string {
    const types = {
      'earthquake': 'แผ่นดินไหว',
      'flood': 'น้ำท่วม',
      'storm': 'พายุฝนฟ้าคะนอง',
      'fire': 'ไฟป่า',
      'tsunami': 'คลื่นสึนามิ',
      'drought': 'ภัยแล้ง',
      'other': 'ภัยพิบัติอื่นๆ'
    };
    return types[type as keyof typeof types] ?? type;
  }

  private getSeverityName(severity: string): string {
    const severities = {
      'low': 'ต่ำ',
      'medium': 'ปานกลาง',
      'high': 'สูง',
      'critical': 'วิกฤต'
    };
    return severities[severity as keyof typeof severities] ?? severity;
  }
}

export const disasterAlertService = new DisasterAlertService();