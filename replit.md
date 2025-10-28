# Overview

ClinicVoice is a sophisticated multi-tenant SaaS platform providing AI-powered receptionist services for healthcare clinics across the UK. The platform enables multiple independent clinic users to manage their AI receptionist services, with comprehensive admin oversight, UK phone number support, and automated file export capabilities. Built with enterprise-grade security and scalability, featuring a premium landing page design that reflects a million-pound company's branding and sophistication.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect (OIDC) integration
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with structured error handling

## Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: Shared between client and server (`shared/schema.ts`)
- **Multi-Tenant Architecture**: Full data isolation between clinics
- **Key Tables**:
  - Users: Authentication with role-based access (clinic_owner, admin)
  - Clinics: Complete practice information, subscription management, and usage tracking
  - Call Logs: Enhanced AI conversation records with file export tracking
  - Appointments: Comprehensive booking management with automated file creation
  - AI Configurations: Customizable AI behavior per clinic
  - API Configurations: Google Sheets, ElevenLabs, and Twilio integration per clinic
  - Platform Analytics: System-wide metrics for admin dashboard
  - File Exports: Automated backup and export tracking for all data
  - Sessions: Authentication session storage

## Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Authorization**: Route-level middleware protection
- **User Management**: Automatic user creation and profile synchronization

## External Dependencies

- **Database**: Neon PostgreSQL (serverless PostgreSQL)
- **Authentication**: Replit Auth service with OIDC and role-based access control
- **UI Framework**: Radix UI for accessible component primitives with premium design system
- **Development**: Replit environment with integrated development tools
- **Payment Processing**: Stripe integration (frontend components present)
- **Telephony**: Twilio integration with UK phone number support and British English voice
- **AI Services**: ElevenLabs integration for natural voice synthesis
- **File Export**: Automated CSV/JSON export system with 30-day retention
- **Multi-Tenancy**: Complete data isolation and subscription management

## Recent Enhancements (January 2025)

### Performance & Stability Fixes (Jan 29, 2025)
- **Critical Performance Issues Resolved**: Eliminated infinite API request loops that were causing application instability
- **Enhanced Query Management**: Implemented comprehensive caching strategies with 10-15 minute stale times and disabled automatic refetching
- **Deployment Optimization**: Fixed blank page issues with improved routing logic and error boundary implementation
- **Production Readiness**: Added enterprise-level error handling and monitoring capabilities

### Application Simplification (January 2025)
- **Streamlined Feature Set**: Focused on core AI receptionist functionality with essential analytics
- **Removed Unnecessary Features**: Eliminated customer success portal and AI simulation demos
- **Retained Power Features**: Kept advanced analytics, business intelligence, and developer portal for users who need them
- **Clean Navigation**: Simplified sidebar with only essential and high-value features

### AI-Powered Contextual Help System (Jan 29, 2025)
- **Intelligent Help Widget**: AI-powered contextual assistance using Perplexity API
- **Context-Aware Responses**: Dynamic help based on current page and user actions
- **Comprehensive Fallback System**: Professional responses even without API connectivity
- **Security & Rate Limiting**: Protected endpoints with audit logging and HIPAA compliance
- **Seamless Integration**: Floating help widget accessible from any page with minimal UI impact

### Analytics & Business Intelligence (Retained)
- **Advanced Analytics**: Comprehensive cohort analysis, conversion tracking, and performance metrics
- **Business Intelligence Dashboard**: AI-powered insights with ROI tracking and competitive benchmarking
- **Call Analytics**: Detailed call outcome metrics and sentiment analysis
- **Automated Reporting**: Scheduled analytics reports with customizable delivery
- **Performance Benchmarks**: Industry comparison and optimization recommendations

### Previous Enhancements (December 2024)
- **Multi-Tenant SaaS Architecture**: Comprehensive role-based access control with admin dashboard
- **Premium Landing Page**: High-end design matching million-pound company aesthetics
- **UK Phone Integration**: Twilio service with London area codes and British English voice
- **Automated File Export**: All appointments, call logs, and analytics automatically saved as files
- **Admin Platform**: Complete oversight dashboard with platform analytics and clinic management
- **Enhanced Security**: HIPAA-compliant data handling with encrypted file storage

ClinicVoice is a streamlined yet powerful AI-powered receptionist platform for UK healthcare clinics. The platform balances simplicity with sophistication, offering:

**Core Features**:
- AI-powered call handling with natural language processing
- Appointment management and booking
- Call logs with transcripts and sentiment analysis
- Customizable AI configuration per clinic
- Multi-tenant architecture with admin oversight

**Power Features** (for users who need them):
- **Advanced Analytics**: Cohort analysis, conversion tracking, performance benchmarks
- **Business Intelligence**: ROI tracking, competitive insights, predictive analytics  
- **Developer Portal**: Full API access with comprehensive documentation
- **Admin Dashboard**: Multi-tenant management and platform analytics

**Technical Excellence**:
- Multi-tenant SaaS architecture with complete data isolation
- Enterprise-grade security and HIPAA compliance
- UK phone number support (Twilio integration)
- AI voice synthesis (ElevenLabs integration)
- PostgreSQL database with Drizzle ORM

The platform provides essential AI receptionist functionality while keeping advanced features accessible for clinics that need deeper insights and automation.