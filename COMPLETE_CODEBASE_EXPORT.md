# ClinicVoice - Complete Production Codebase

This is the complete, production-ready codebase for ClinicVoice - an AI-powered healthcare clinic management platform with voice commands, multi-tenant SaaS architecture, and comprehensive practice management features.

## 🚀 Key Features

- **AI-Powered Voice Commands**: Speech recognition with 70%+ confidence threshold
- **Multi-Tenant SaaS**: Complete data isolation between clinics
- **UK Healthcare Integration**: Twilio UK phone numbers, ElevenLabs voice synthesis
- **Practice Management**: EMR/EHR integration (EMIS Web, SystmOne, Vision)
- **Business Intelligence**: Advanced analytics with ROI tracking
- **Mobile Progressive Web App**: Touch-optimized interface
- **Enterprise Security**: HIPAA-compliant data handling

## 📋 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **Radix UI + shadcn/ui** component library
- **Tailwind CSS** for styling
- **TanStack Query** for state management
- **Vite** for build tooling

### Backend
- **Node.js + Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Replit Auth** with OpenID Connect
- **Express sessions** with PostgreSQL store

### External Services
- **Twilio** - UK phone numbers and SMS
- **ElevenLabs** - Natural voice synthesis
- **Google Sheets** - Data export integration
- **Stripe** - Payment processing (frontend ready)

## 🔧 Setup Instructions

1. **Environment Variables**:
   ```env
   DATABASE_URL=your_postgresql_url
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_uk_phone_number
   ELEVENLABS_API_KEY=your_elevenlabs_key
   GOOGLE_SHEETS_CLIENT_ID=your_google_client_id
   GOOGLE_SHEETS_CLIENT_SECRET=your_google_secret
   PERPLEXITY_API_KEY=your_perplexity_key
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Setup**:
   ```bash
   npm run db:push
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
├── client/src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard components
│   │   ├── voice/              # Voice command system
│   │   ├── mobile/             # Mobile-optimized components
│   │   ├── analytics/          # Business intelligence
│   │   ├── simulation/         # AI testing suite
│   │   ├── help/               # Contextual help system
│   │   └── ui/                 # Reusable UI components
│   ├── pages/                  # Route components
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utilities and configurations
├── server/
│   ├── routes/                 # API endpoints
│   ├── services/               # External service integrations
│   └── middleware/             # Security and auth middleware
└── shared/
    └── schema.ts               # Database schema and types
```

## 🎯 Voice Commands

The application supports natural language voice commands:

- **Navigation**: "Go to dashboard", "Show call logs", "Show appointments"
- **AI Control**: "Test AI", "Pause AI", "Start AI"
- **Emergency**: "Emergency" (triggers staff alerts)
- **Status**: "Check status", "How many calls today"

## 📱 Mobile Features

- Progressive Web App (PWA) capabilities
- Touch-optimized interface
- Offline functionality
- Bottom navigation for mobile
- Responsive design across all screen sizes

## 🔒 Security Features

- HIPAA-compliant data handling
- Multi-tenant data isolation
- Role-based access control (clinic_owner, admin)
- Session-based authentication
- Rate limiting and security middleware
- Encrypted file storage

## 📊 Business Intelligence

- Real-time call monitoring
- Performance analytics and insights
- ROI tracking and competitive benchmarking
- Predictive forecasting
- Automated reporting
- Export to Google Sheets

## 🏥 Practice Management Integration

Direct connections to major UK healthcare systems:
- **EMIS Web** - Leading UK practice management system
- **SystmOne** - Comprehensive healthcare platform
- **Vision** - Clinical and administrative software
- **AccuBook** - Appointment scheduling system

## 🤖 AI Features

- Natural language configuration
- Contextual help with Perplexity AI
- Smart workflow automation
- Conversation simulation suite
- Multi-language support
- Emergency protocol handling

## 📈 Recent Enhancements (January 2025)

- **Performance Optimization**: Eliminated infinite API loops, enhanced caching
- **Voice Commands**: Complete speech recognition system with UK English
- **UX Transformation**: Interactive setup wizard, live status dashboard
- **Mobile PWA**: Touch-optimized progressive web application
- **Practice Integration**: Direct EMR/EHR system connections
- **Business Intelligence**: Advanced analytics with predictive insights

## 🚀 Deployment

The application is production-ready and can be deployed to:
- **Replit Deployments** (recommended)
- **Vercel** or **Netlify** (frontend)
- **Railway** or **Heroku** (backend)
- **Neon** or **Supabase** (PostgreSQL)

## 📞 Support

For technical support or feature requests, contact the development team or refer to the comprehensive documentation included in each component.

---

**ClinicVoice** - Transforming healthcare practice management with AI-powered solutions.