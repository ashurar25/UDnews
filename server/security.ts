
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export class SecurityUtils {
  // Sanitize HTML content
  static sanitizeHtml(html: string): string {
    return purify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'title'],
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    });
  }

  // Sanitize text input
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove < and > characters
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate URL format
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Remove SQL injection patterns
  static sanitizeSql(input: string): string {
    return input
      .replace(/('|(\\')|(;)|(\\)|(--|#)|(\|)|(\*)|(%)|(\+)|(=)/g, '')
      .replace(/(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi, '');
  }

  // Rate limit check by IP
  static checkRateLimit(ip: string, limit: number = 100, window: number = 900000): boolean {
    // This would typically use Redis in production
    // For now, using in-memory tracking
    const key = `rate_limit:${ip}`;
    // Implementation would go here
    return true;
  }
}
