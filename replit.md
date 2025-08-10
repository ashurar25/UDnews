# Overview

This is a full-stack news website application called "UD News" (อัพเดทข่าวอุดร) - a Thai local news platform for Udon Thani. The application is built using modern web technologies with a React frontend, Express backend, and PostgreSQL database. The site features RSS feed management, weather integration, Thai localization, and a comprehensive UI component system using shadcn/ui.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (ล่าสุด)

## Advanced Theme Management System Implemented (10 สิงหาคม 2568)
- ✅ Added comprehensive site settings database schema with color/theme management
- ✅ Implemented full CRUD API for site settings (/api/site-settings)
- ✅ Created advanced ThemeSettings component with real-time preview capability
- ✅ Added HSL color support and preset themes (light/dark/Thai special day themes)
- ✅ Integrated theme management into admin interface with live color picker
- ✅ Built theme persistence system allowing admins to customize website colors
- ✅ Enhanced storage interface with site settings methods (getAllSiteSettings, updateSiteSetting, etc.)
- ✅ Application supports real-time theme switching across entire website

## Migration to Replit Complete + News Content Reduced (10 สิงหาคม 2568)
- ✅ Successfully migrated project from Replit Agent to Replit environment
- ✅ Fixed build process: client built successfully and deployed to server/public
- ✅ Application running cleanly on port 5000 without errors
- ✅ Reduced homepage news display from 21 articles to 5 articles total (2 featured + 3 latest)
- ✅ Maintained proper security practices with client/server separation
- ✅ All checklist items completed in migration progress tracker

## UI Improvements and RSS System Enhanced (10 สิงหาคม 2568)
- ✅ Removed unwanted header sponsor banner from main page as requested by user
- ✅ Fixed build and deployment process with automated build-and-deploy.sh script
- ✅ Resolved RSS service TypeScript errors (require/import issues)
- ✅ Enhanced duplicate prevention with 85% similarity matching
- ✅ Added working RSS feeds: Matichon (3 new articles processed)
- ✅ Improved RSS processing with better error handling and 10s timeout
- ✅ Added visual indicators in footer showing "ระบบใหม่" with animations
- ✅ Build process now automatically copies files from dist/public to server/public

## Full System Working - Real Data Integration (10 สิงหาคม 2568)  
- ✅ Website now displays 65+ real news articles from database instead of sample data
- ✅ Admin panel shows actual database statistics (65 news, 5 RSS feeds, 3 banners)  
- ✅ Fixed RSS feed URLs: Added Thai Rath, Post Today, Khaosod (working feeds)
- ✅ RSS automatic processing every 30 minutes with manual trigger capability
- ✅ All TypeScript errors resolved in Admin.tsx and NewsCard.tsx
- ✅ Database connection information displayed correctly in admin system tab
- ✅ Homepage features real breaking news and article content from PostgreSQL

## MemStorage Removal Complete (10 สิงหาคม 2568)
- ✅ Removed MemStorage class entirely from server/storage.ts
- ✅ Application now uses only PostgreSQL database storage (DatabaseStorage)
- ✅ Enhanced admin interface with comprehensive system information display
- ✅ Added detailed database connection information in admin panel
- ✅ All memory-based storage references eliminated from codebase

## Migration to Replit Environment Complete (9 สิงหาคม 2568)
- ✅ Successfully migrated from Replit Agent to Replit environment
- ✅ PostgreSQL database configured with external Render database
- ✅ Database schema pushed with all required tables (news_articles, rss_feeds, sponsor_banners, etc.)
- ✅ Client application built and served properly from server/public
- ✅ Weather API integration configured with OpenWeatherMap API key
- ✅ Sample RSS feeds added (BBC Thai, Voice TV, Manager Online, ThaiPBS)
- ✅ Database connection updated to use external Render PostgreSQL database
- ✅ SSL configuration added for secure external database connection
- ✅ Admin interface updated to display real database statistics
- ✅ Header component enhanced with dynamic theme support (light/dark/Thai special days)
- ✅ Application running successfully on port 5000 with real data

## News Reading and Navigation System (9 มกราคม 2567)
- ✅ Added full news article reading capability with detailed pages
- ✅ Implemented React Router-based navigation system
- ✅ Created comprehensive "All News" page with search and filtering
- ✅ Added category-based news browsing (/category/local, /category/politics, etc.)
- ✅ Enhanced header navigation with React Router integration
- ✅ All news cards are now clickable leading to full article pages
- ✅ Added news sharing functionality and external source links
- ✅ Implemented related news sections and enhanced news detail layout

## RSS System Enhancement (9 มกราคม 2567)
- ✅ Enhanced RSS feed processing with real data fetching
- ✅ Added image extraction from RSS feeds (รูปภาพจาก RSS)
- ✅ Implemented RSS processing history tracking (ประวัติการดึงข่าว)
- ✅ Added sample RSS feeds: BBC Thai, Voice TV, Manager Online
- ✅ Successfully processed 64 articles from RSS feeds
- ✅ Added API endpoints for RSS history tracking
- ✅ Improved error handling and processing status tracking

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: React Router for client-side navigation
- **Theme System**: Custom theme provider supporting light/dark modes and special Thai holiday themes

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM with PostgreSQL as the primary database
- **API Design**: RESTful API endpoints following standard HTTP conventions
- **Development Setup**: Hot reload using Vite middleware in development mode
- **Build Process**: ESBuild for server bundling, separate client build with Vite

## Database Schema
- **Users Table**: Basic user authentication with username/password
- **RSS Feeds Table**: Manages RSS feed sources with categorization and active status
- **Database Migrations**: Managed through Drizzle Kit with PostgreSQL dialect

## Authentication & Authorization
- Currently implements basic storage interface pattern
- Supports both in-memory storage (development) and database storage
- User management with username-based authentication

## UI Component System
- **Component Library**: Radix UI primitives with shadcn/ui styling
- **Design Tokens**: HSL-based color system with CSS custom properties
- **Typography**: Thai fonts (Kanit, Sarabun) with English fallbacks
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Special Features
- **Thai Localization**: Full Thai language support with special holiday themes
- **Weather Integration**: OpenWeatherMap API integration for Udon Thani weather
- **RSS Management**: Admin interface for managing RSS feed sources
- **Theme System**: Dynamic theme switching including Thai special day themes

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework for Node.js backend
- **react**: Frontend UI library with React Router for navigation
- **vite**: Build tool and development server

## UI & Styling
- **@radix-ui/react-***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

## Data Management
- **@tanstack/react-query**: Server state management and data fetching
- **axios**: HTTP client for API requests
- **zod**: Schema validation library
- **react-hook-form**: Form handling with validation

## Development Tools
- **typescript**: Type checking and development tooling
- **@replit/vite-plugin-***: Replit-specific development plugins
- **postcss**: CSS processing with autoprefixer

## Third-Party Integrations
- **OpenWeatherMap API**: Weather data for Udon Thani region
- **RSS Feed Processing**: Custom RSS feed parsing and management
- **Date Formatting**: date-fns for Thai date localization