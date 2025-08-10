
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
      // จำลองการเรียก API ของกรมอุตุนิยมวิทยา
      // ในการใช้งานจริง ควรใช้ API key และ endpoint จริง
      const response = await fetch('https://api.tmd.go.th/api/warnings', {
        headers: {
          'Accept': 'application/json',
          // 'Authorization': `Bearer ${process.env.TMD_API_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        await this.processWeatherAlerts(data);
      }
    } catch (error) {
      // ถ้า API ไม่พร้อมใช้งาน ให้ใช้ข้อมูลจำลอง
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
        const newsDate = new Date(news.publishedAt);
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
            startTime: news.publishedAt,
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

  // ได้รับการเตือนภัยทั้งหมดที่ยังใช้งานอยู่
  getActiveAlerts(): DisasterAlert[] {
    return this.alerts.filter(alert => {
      if (!alert.isActive) return false;
      
      if (alert.endTime) {
        return new Date() < new Date(alert.endTime);
      }
      
      // หากไม่มี endTime ให้ active นาน 24 ชั่วโมง
      const alertTime = new Date(alert.startTime);
      const now = new Date();
      return (now.getTime() - alertTime.getTime()) < 24 * 60 * 60 * 1000;
    });
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
    return types[type] || type;
  }

  private getSeverityName(severity: string): string {
    const severities = {
      'low': 'ต่ำ',
      'medium': 'ปานกลาง',
      'high': 'สูง',
      'critical': 'วิกฤต'
    };
    return severities[severity] || severity;
  }
}

export const disasterAlertService = new DisasterAlertService();
