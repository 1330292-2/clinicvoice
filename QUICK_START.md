# ClinicVoice - Quick Start Guide

## 🚀 Get Your App Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or use a managed service like Neon, Supabase)
- Git (optional)

---

## 📥 Step 1: Download Your Code

### Option A: Download from Replit
1. Click the three dots (⋮) in the file tree
2. Select "Download as ZIP"
3. Extract to your preferred location

### Option B: Git Clone
```bash
git clone your-repository-url
cd clinicvoice
```

---

## 📦 Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages for both frontend and backend.

---

## 🔑 Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Required)
DATABASE_URL=postgresql://user:password@host:5432/clinicvoice

# Session Secret (Required)
SESSION_SECRET=your-random-secret-string-min-32-characters

# Twilio (Required for calls)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+441234567890

# ElevenLabs (Required for AI voice)
ELEVENLABS_API_KEY=your_api_key

# Application
NODE_ENV=development
PORT=5000
```

**💡 Tip:** See `.env.example` for a complete template with all options.

---

## 🗄️ Step 4: Set Up Database

Push your database schema to PostgreSQL:

```bash
npm run db:push
```

This creates all necessary tables in your database.

---

## ▶️ Step 5: Start Development Server

```bash
npm run dev
```

Your app will be available at: **http://localhost:5000**

---

## 🏗️ Building for Production

### Build the app:
```bash
npm run build
```

### Start in production mode:
```bash
npm start
```

---

## 🌐 Quick Deploy Options

### Deploy to Heroku (5 minutes)
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
git push heroku main
```

### Deploy to Railway (3 minutes)
1. Go to https://railway.app
2. Create project from GitHub
3. Add PostgreSQL database
4. Deploy automatically

### Deploy to Replit (1 minute)
1. Click "Deploy" button
2. Choose "Autoscale Deployment"
3. Done! 🎉

---

## 📚 Folder Structure

```
clinicvoice/
├── client/              # Frontend React app
│   ├── src/
│   │   ├── pages/      # All page components
│   │   ├── components/ # Reusable UI components
│   │   └── lib/        # Utilities and helpers
├── server/              # Backend Express API
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database operations
│   └── services/       # External API integrations
├── shared/              # Shared types and schemas
│   └── schema.ts       # Database schema & types
└── package.json
```

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server (frontend + backend)

# Database
npm run db:push          # Push schema changes to database
npm run db:push -- --force  # Force push (may lose data)

# Production
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run tests (if configured)
```

---

## 🆘 Troubleshooting

### "Can't connect to database"
- Check your `DATABASE_URL` is correct
- Verify database is running
- Test connection: `psql $DATABASE_URL`

### "Port 5000 already in use"
```bash
# Kill the process using port 5000
lsof -ti:5000 | xargs kill -9
```

### "Module not found"
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Build errors
```bash
# Clean build directory
rm -rf dist client/dist
npm run build
```

---

## 📖 Next Steps

1. **Configure Authentication** - See `AUTHENTICATION_GUIDE.md` for setting up auth outside Replit
2. **Set Up API Keys** - Get your Twilio and ElevenLabs keys
3. **Deploy** - See `EXPORT_DEPLOYMENT_GUIDE.md` for deployment options
4. **Customize** - Make it your own!

---

## 🎯 Production Checklist

Before going live:

- [ ] Set up production database (with backups!)
- [ ] Configure all environment variables
- [ ] Implement authentication (see AUTHENTICATION_GUIDE.md)
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Configure Twilio webhooks with your domain
- [ ] Test all features thoroughly
- [ ] Set up monitoring and logging
- [ ] Configure database backups

---

## 💡 Tips

- **Database**: Use Neon (https://neon.tech) for easy PostgreSQL hosting
- **Hosting**: Railway or Heroku for quick deployment
- **Auth**: Auth0 for production-ready authentication
- **Monitoring**: Sentry for error tracking

---

## 🆘 Need Help?

Check these files:
- `EXPORT_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `AUTHENTICATION_GUIDE.md` - How to set up auth for external hosting
- `.env.example` - All environment variables explained

---

**Ready to go live? Deploy and share your ClinicVoice app! 🚀**
