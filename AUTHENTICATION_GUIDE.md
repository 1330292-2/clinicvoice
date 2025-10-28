# Authentication Setup for External Hosting

## 🚨 Important: Replit Auth Won't Work Outside Replit

Your ClinicVoice app currently uses **Replit Auth**, which only works on the Replit platform. To deploy externally, you need to implement a different authentication system.

---

## 🔐 Recommended Authentication Options

### Option 1: Passport.js with Local Strategy (Easiest)

**Best for:** Full control, email/password login

**Setup time:** ~1-2 hours

**Pros:**
- ✅ Complete control over user data
- ✅ No external dependencies
- ✅ Works anywhere
- ✅ Free

**Cons:**
- ❌ You handle password security
- ❌ Need to implement password reset
- ❌ More code to maintain

### Option 2: Auth0 (Recommended for Production)

**Best for:** Enterprise features, social login, security

**Setup time:** ~30 minutes

**Pros:**
- ✅ Enterprise-grade security
- ✅ Social login (Google, Facebook, etc.)
- ✅ Built-in password reset
- ✅ Multi-factor authentication
- ✅ Fully managed

**Cons:**
- ❌ Costs money after free tier (7,000 active users)
- ❌ External dependency

### Option 3: Firebase Authentication

**Best for:** Quick setup, Google ecosystem

**Setup time:** ~20 minutes

**Pros:**
- ✅ Very easy setup
- ✅ Social login included
- ✅ Free generous tier
- ✅ Real-time capabilities

**Cons:**
- ❌ Locks you into Firebase ecosystem
- ❌ Less control

### Option 4: Custom JWT Authentication

**Best for:** API-first apps, mobile apps

**Setup time:** ~2-3 hours

**Pros:**
- ✅ Stateless authentication
- ✅ Perfect for APIs
- ✅ Scalable

**Cons:**
- ❌ More complex to implement
- ❌ Token management required

---

## 🛠️ Implementation Guide: Passport.js Local Strategy

### Step 1: Install Dependencies

```bash
npm install passport passport-local bcrypt express-session
npm install --save-dev @types/passport @types/passport-local @types/bcrypt
```

### Step 2: Update User Schema

File: `shared/schema.ts`

```typescript
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(), // Add this
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("clinic_owner"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Step 3: Create Authentication Routes

File: `server/auth.ts`

```typescript
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
```

### Step 4: Add Authentication Endpoints

File: `server/routes.ts` (add these routes)

```typescript
import passport from './auth';
import bcrypt from 'bcrypt';

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'clinic_owner',
      })
      .returning();

    // Log user in
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Registration successful but login failed' });
      }
      res.json({ user: { id: newUser.id, email: newUser.email } });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', 
  passport.authenticate('local'),
  (req, res) => {
    res.json({ 
      user: { 
        id: req.user.id, 
        email: req.user.email,
        role: req.user.role 
      } 
    });
  }
);

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Get current user
app.get('/api/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      user: { 
        id: req.user.id, 
        email: req.user.email,
        role: req.user.role 
      } 
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});
```

### Step 5: Initialize Passport in Express

File: `server/index.ts`

```typescript
import passport from './auth';
import session from 'express-session';

// Add before routes
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
```

### Step 6: Update Frontend Login Page

File: `client/src/pages/login.tsx`

Replace Replit Auth button with:

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (response.ok) {
      window.location.href = '/dashboard';
    } else {
      const error = await response.json();
      toast({ title: 'Login failed', description: error.error });
    }
  } catch (error) {
    toast({ title: 'Error', description: 'Login failed' });
  }
};
```

---

## 🛠️ Implementation Guide: Auth0

### Step 1: Create Auth0 Account

1. Go to https://auth0.com
2. Sign up for free account
3. Create a new application (Single Page App)
4. Note your Domain and Client ID

### Step 2: Install Dependencies

```bash
npm install express-openid-connect
```

### Step 3: Configure Auth0

File: `server/index.ts`

```typescript
import { auth } from 'express-openid-connect';

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.BASE_URL || 'http://localhost:5000',
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
};

app.use(auth(config));

// Protected routes
app.get('/api/auth/user', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.json({ user: req.oidc.user });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});
```

### Step 4: Add Environment Variables

```env
AUTH0_SECRET=your-long-random-string
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
BASE_URL=https://yourdomain.com
```

### Step 5: Update Frontend

Auth0 handles the login flow automatically. Just redirect to `/login` for Auth0's login page.

---

## 🔑 Environment Variables Needed

Add to your `.env` file:

### For Passport.js:
```env
SESSION_SECRET=your-super-secret-random-string-min-32-chars
```

### For Auth0:
```env
AUTH0_SECRET=your-long-random-string
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
```

---

## ✅ Testing Your Authentication

1. **Register a new user**
2. **Login with credentials**
3. **Access protected routes**
4. **Logout**
5. **Try accessing dashboard without login** (should redirect)

---

## 🎯 Recommendation

**For your ClinicVoice app, I recommend:**

1. **Quick Launch**: Use Auth0 (fastest, most secure)
2. **Full Control**: Use Passport.js Local Strategy
3. **Mobile App**: Use Firebase Auth

**Need help implementing?** Let me know which option you prefer and I can help you set it up!
