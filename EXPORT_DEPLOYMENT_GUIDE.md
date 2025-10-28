# ClinicVoice - Complete Export & Deployment Guide

## 📦 Exporting Your Code from Replit

### Option 1: Download as ZIP
1. Click the three dots (⋮) menu in the file tree
2. Select "Download as ZIP"
3. Extract the ZIP file on your local machine

### Option 2: Use Git (Recommended)
```bash
# Clone your Replit repository
git clone https://github.com/your-username/your-repo.git
```

---

## 🖥️ Running on Your Own Server

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Git (optional)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the root directory with these variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-database-host
PGPORT=5432
PGUSER=your-database-user
PGPASSWORD=your-database-password
PGDATABASE=clinicvoice

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-random-string-here

# Twilio Configuration (for phone calls)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+44XXXXXXXXXX

# ElevenLabs Configuration (for AI voice)
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Optional: Stripe (if you want payment processing)
STRIPE_SECRET_KEY=your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key

# Application Configuration
NODE_ENV=production
PORT=5000
```

### Step 3: Set Up Database

```bash
# Push database schema to your PostgreSQL
npm run db:push
```

### Step 4: Build for Production

```bash
# Build the frontend
npm run build
```

### Step 5: Start the Application

```bash
# Start in production mode
npm start
```

Your app will be available at `http://localhost:5000`

---

## 🌐 Deploying to Cloud Platforms

### AWS EC2 / DigitalOcean / Any VPS

1. **Upload your code to the server:**
```bash
scp -r ./your-app user@your-server-ip:/var/www/clinicvoice
```

2. **SSH into your server:**
```bash
ssh user@your-server-ip
cd /var/www/clinicvoice
```

3. **Install dependencies and build:**
```bash
npm install
npm run build
```

4. **Set up PM2 to keep your app running:**
```bash
npm install -g pm2
pm2 start npm --name "clinicvoice" -- start
pm2 save
pm2 startup
```

5. **Set up Nginx as reverse proxy:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Heroku

1. **Install Heroku CLI and login:**
```bash
heroku login
```

2. **Create a new Heroku app:**
```bash
heroku create your-app-name
```

3. **Add PostgreSQL addon:**
```bash
heroku addons:create heroku-postgresql:mini
```

4. **Set environment variables:**
```bash
heroku config:set TWILIO_ACCOUNT_SID=your-sid
heroku config:set TWILIO_AUTH_TOKEN=your-token
heroku config:set TWILIO_PHONE_NUMBER=your-number
heroku config:set ELEVENLABS_API_KEY=your-key
heroku config:set SESSION_SECRET=your-secret
```

5. **Deploy:**
```bash
git push heroku main
```

---

### Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Backend on Railway:**
1. Go to https://railway.app
2. Create new project from GitHub
3. Add PostgreSQL database
4. Set environment variables
5. Deploy automatically

---

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t clinicvoice .
docker run -p 5000:5000 --env-file .env clinicvoice
```

---

## 🗄️ Database Setup

### Option 1: Managed PostgreSQL
- **Neon** (https://neon.tech) - Serverless PostgreSQL
- **Supabase** (https://supabase.com) - PostgreSQL with extras
- **AWS RDS** - Enterprise-grade
- **DigitalOcean Managed Database** - Simple and affordable

### Option 2: Self-Hosted PostgreSQL
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE clinicvoice;
CREATE USER clinicuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE clinicvoice TO clinicuser;
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change `SESSION_SECRET` to a strong random string
- [ ] Use HTTPS (Let's Encrypt for free SSL)
- [ ] Set `NODE_ENV=production`
- [ ] Enable database connection pooling
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Use environment variables (never commit secrets)
- [ ] Set up monitoring (e.g., LogRocket, Sentry)

---

## 📊 Monitoring & Logging

### PM2 Logs (for VPS)
```bash
pm2 logs clinicvoice
pm2 monit
```

### Application Monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **New Relic** - Performance monitoring

---

## 🔄 Database Migrations

When you make database changes:

```bash
# Push schema changes
npm run db:push

# Or force push if there are conflicts
npm run db:push -- --force
```

---

## 🚀 Performance Optimization

1. **Enable Redis for sessions:**
```bash
npm install connect-redis redis
```

2. **Use CDN for static assets:**
- Cloudflare
- AWS CloudFront

3. **Enable compression:**
Already configured in the app

4. **Database optimization:**
- Add indexes to frequently queried columns
- Use connection pooling

---

## 📞 Twilio Webhook Configuration

When running on your own domain, update Twilio webhooks:

1. Go to Twilio Console
2. Configure your phone number
3. Set webhook URLs:
   - Voice: `https://yourdomain.com/api/twilio/voice`
   - Status: `https://yourdomain.com/api/twilio/status`

---

## 🆘 Troubleshooting

### App won't start
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection issues
- Check `DATABASE_URL` is correct
- Verify database is running
- Check firewall allows connections

### Build errors
```bash
# Clean build
rm -rf dist client/dist
npm run build
```

---

## 📝 Additional Notes

- **Authentication**: Currently using Replit Auth. For external deployment, you'll need to implement your own auth system (Passport.js, Auth0, or custom)
- **File Storage**: Set up AWS S3 or similar for file uploads
- **Email**: Configure SendGrid or AWS SES for email notifications

---

## 💡 Quick Start for External Hosting

```bash
# 1. Clone/download code
git clone your-repo

# 2. Install dependencies
npm install

# 3. Create .env file with all variables

# 4. Set up database
npm run db:push

# 5. Build
npm run build

# 6. Start
npm start
```

---

## 🎯 Recommended Hosting Options

| Platform | Best For | Monthly Cost | Ease of Setup |
|----------|----------|--------------|---------------|
| **Replit** | Quick deployment | $20-40 | ⭐⭐⭐⭐⭐ |
| **Heroku** | Simple deployment | $7-25 | ⭐⭐⭐⭐ |
| **Railway** | Modern apps | $5-20 | ⭐⭐⭐⭐ |
| **DigitalOcean** | Full control | $12-24 | ⭐⭐⭐ |
| **AWS** | Enterprise scale | $20-100+ | ⭐⭐ |
| **Vercel** | Frontend only | Free-$20 | ⭐⭐⭐⭐⭐ |

---

**Need help?** Check the `/server` and `/client` folders for full source code. All files are ready to deploy!
