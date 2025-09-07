# replit.md

## Overview

UD News Update is a Thai local news aggregation website specifically serving the Udon Thani region. The platform aggregates news from multiple RSS sources and presents them in a clean, mobile-friendly interface. The system includes administrative tools for content management, weather integration, disaster alerts, and various reader engagement features like comments and social sharing capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom orange/yellow theme reflecting local branding
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite for fast development and optimized production builds
- **Progressive Web App**: Service worker implementation for offline capabilities and push notifications

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **API Design**: RESTful APIs with consistent error handling
- **Authentication**: JWT-based authentication with role-based access control (admin, editor, viewer)
- **File Upload**: Multer for handling image uploads with Sharp for optimization
- **Caching**: NodeCache for in-memory caching of frequently accessed data (news, weather, RSS feeds)
- **Security**: Rate limiting, input sanitization with DOMPurify, CORS configuration

### Data Storage Solutions
- **Primary Database**: Neon PostgreSQL (managed cloud PostgreSQL)
- **Backup Database**: Render PostgreSQL for redundancy
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema versioning
- **Connection Pooling**: pg Pool for efficient database connection management
- **File Storage**: Local filesystem with plans for cloud storage integration

### RSS Processing System
- **RSS Parser**: Custom service using rss-parser library
- **Content Extraction**: HTML parsing with node-html-parser for article content
- **Image Processing**: Sharp for image optimization and resizing
- **Duplicate Detection**: URL-based deduplication to prevent content repetition
- **Scheduled Processing**: Automatic RSS feed processing every 15 minutes
- **Error Handling**: Retry mechanisms and graceful degradation for failed feeds

### Content Management
- **News Articles**: Full CRUD operations with categorization and breaking news flags
- **RSS Feed Management**: Add, edit, disable RSS sources with processing history
- **Sponsor Banners**: Position-based banner management with click tracking
- **User Management**: Role-based user system with secure password hashing

## External Dependencies

### Database Services
- **Neon**: Primary PostgreSQL hosting with connection pooling and SSL
- **Render PostgreSQL**: Backup database for redundancy

### Third-Party APIs
- **Thai Meteorological Department (TMD)**: Weather forecast data for Udon Thani region
- **OpenWeather API**: Additional weather data and forecasting
- **Thai Government Lottery API**: Integration with Rayriffy community API for lottery results
- **Google Analytics**: User behavior tracking and site analytics

### RSS News Sources
- **INN News**: Primary local news source
- **Khaosod**: National news with local relevance
- **Additional Sources**: Configurable RSS feeds for expanding news coverage

### Infrastructure Services
- **HTTPS/SSL**: Automatic HTTPS enforcement in production
- **Domain**: Custom domain hosting on .sbs TLD
- **CDN**: Static asset delivery optimization
- **Email Service**: SMTP integration for notifications and newsletters

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting
- **Drizzle Kit**: Database schema management and migrations
- **Sharp**: Server-side image processing and optimization
- **bcrypt**: Secure password hashing for user authentication

### Optional Integrations
- **Push Notifications**: Web Push API with VAPID keys for browser notifications
- **Social Media APIs**: Integration points for Facebook, Line, Twitter sharing
- **Payment Gateway**: PromptPay QR code generation for donations
- **Fortune/Horoscope Service**: Traditional Thai cultural content integration