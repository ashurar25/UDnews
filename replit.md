# Overview

This is a full-stack news website application called "UD News" (อัพเดทข่าวอุดร) - a Thai local news platform for Udon Thani. The application is built using modern web technologies with a React frontend, Express backend, and PostgreSQL database. The site features RSS feed management, weather integration, Thai localization, and a comprehensive UI component system using shadcn/ui.

# User Preferences

Preferred communication style: Simple, everyday language.

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