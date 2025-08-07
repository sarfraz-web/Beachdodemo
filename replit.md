# Overview

Beachdo is a secure marketplace platform that connects buyers and sellers in local communities. The application features user management with KYC verification, product listings, real-time chat functionality, and comprehensive admin operations. Built as a full-stack web application with a React frontend and Node.js/Express backend, it emphasizes security, scalability, and user verification through DigiLocker integration for Indian Aadhaar-based KYC.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **UI Library**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Authentication**: JWT-based authentication with refresh tokens stored in localStorage

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: JWT access tokens (15min) and refresh tokens (7 days) with bcrypt password hashing
- **File Storage**: Local file system with multer for image uploads (5MB limit, 5 files max)
- **Real-time Communication**: WebSocket implementation for chat functionality
- **Security**: Rate limiting, role-based access control (Admin, Seller, Buyer), and input validation

## Database Design
- **Schema Location**: Shared schema definition in `/shared/schema.ts`
- **Migration Tool**: Drizzle Kit for database migrations
- **Key Tables**: Users (with KYC status), Categories, Listings, Chats, Messages, Saved Items, Reports, Auth Tokens
- **Enums**: User roles, KYC status, listing status, report status
- **Relationships**: Proper foreign key relationships between users, listings, chats, and messages

## Authentication & Authorization
- **Multi-factor Authentication**: Email/phone login with OTP support planned
- **Password Security**: Bcrypt hashing with salt rounds of 12
- **Token Management**: Separate access and refresh tokens with automatic renewal
- **Role-based Access**: Three user roles (admin, seller, buyer) with route protection
- **Session Management**: Refresh token storage in database with expiration tracking

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for Neon database
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation with Zod integration
- **bcrypt**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and validation
- **multer**: File upload handling middleware

## UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant-based styling
- **lucide-react**: Icon library for consistent iconography

## Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Planned Integrations
- **DigiLocker API**: KYC verification through Aadhaar integration (simulated in MVP)
- **Cloud Storage**: Migration from local storage to AWS S3 or Cloudinary for production
- **SMS/OTP Service**: Phone verification and notifications
- **Payment Gateway**: Transaction processing for premium features