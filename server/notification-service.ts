import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import webpush from 'web-push';

export class NotificationService {
  private emailTransporter: Transporter;

  constructor() {
    // Configure email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Configure web push with actual VAPID keys
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:kenginol.ar@gmail.com';
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BP4d_Lmh8hQ6QTK6r5s8zO70KtOYzaCTvkfrrwBCAThqYal_YqWs8aWmyoqjUpAwWmNI2x47vOFMTBQLB2USsUA';
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'xZIjrB_qo2gXTsF6OxHct2VBM496q3sBFgsm2BcPxDw';

    if (vapidPublicKey && vapidPrivateKey) {
      try {
        webpush.setVapidDetails(
          vapidSubject,
          vapidPublicKey,
          vapidPrivateKey
        );
        console.log('✅ VAPID keys configured successfully');
      } catch (error) {
        console.error('❌ Error setting VAPID details:', error);
      }
    } else {
      console.warn('⚠️ VAPID keys not configured. Push notifications will not work.');
    }
  }

  async sendBreakingNewsEmail(
    recipients: string[],
    newsTitle: string,
    newsUrl: string
  ): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'UD News <noreply@udnews.com>',
      to: recipients,
      subject: `🚨 ข่าวด่วน: ${newsTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚨 ข่าวด่วนจาก UD News</h2>
          <h3>${newsTitle}</h3>
          <p>อ่านข่าวฉบบเต็มได้ที่:</p>
          <a href="${newsUrl}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            อ่านข่าวเต็ม
          </a>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            คุณได้รับอีเมลนี้เพราะสมัครรับข่าวสารจาก UD News<br>
            หากต้องการยกเลิก <a href="${process.env.BASE_URL}/unsubscribe">คลิกที่นี่</a>
          </p>
        </div>
      `,
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log('Breaking news email sent successfully');
    } catch (error) {
      console.error('Error sending breaking news email:', error);
    }
  }

  async sendPushNotification(
    subscription: any,
    newsTitle: string,
    newsUrl: string
  ): Promise<void> {
    const payload = JSON.stringify({
      title: 'ข่าวด่วน - UD News',
      body: newsTitle,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      url: newsUrl,
      tag: 'breaking-news',
      requireInteraction: true,
    });

    try {
      await webpush.sendNotification(subscription, payload);
      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async notifyAdminNewComment(
    newsTitle: string,
    commentAuthor: string,
    commentContent: string
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@udnews.com';

    const mailOptions = {
      from: process.env.SMTP_FROM || 'UD News <noreply@udnews.com>',
      to: adminEmail,
      subject: `💬 ความคิดเห็นใหม่: ${newsTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">💬 ความคิดเห็นใหม่</h2>
          <p><strong>ข่าว:</strong> ${newsTitle}</p>
          <p><strong>ผู้แสดงความคิดเห็น:</strong> ${commentAuthor}</p>
          <p><strong>ความคิดเห็น:</strong></p>
          <blockquote style="border-left: 3px solid #2563eb; padding-left: 10px; margin: 10px 0; color: #666;">
            ${commentContent}
          </blockquote>
          <a href="${process.env.BASE_URL}/admin" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            จัดการความคิดเห็น
          </a>
        </div>
      `,
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      console.log('Admin comment notification sent successfully');
    } catch (error) {
      console.error('Error sending admin comment notification:', error);
    }
  }
}

export const notificationService = new NotificationService();