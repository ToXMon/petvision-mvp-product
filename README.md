# PetVision - Full Stack Environment Setup

<div align="center">
  
  **[🚀 Quick Start](#quick-start)** • **[📖 Setup Guide](./docs/FULLSTACK_ENVIRONMENT_SETUP.md)** • **[☁️ Main Branch](https://github.com/ToXMon/petvision-mvp-product)**
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
  [![React Native](https://img.shields.io/badge/React%20Native-Expo%2054-61DAFB)](https://expo.dev/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  
</div>

---

## 🛠️ Overview

This branch provides **comprehensive environment configuration and setup documentation** for the PetVision full stack application. It includes environment variable templates, setup guides for all required services (Supabase, Z.AI, OAuth), and detailed documentation for both development and production deployments.

### 🎯 What This Branch Provides

- 🔑 **Environment variable templates** with detailed comments for web and mobile apps
- 📚 **Complete setup guide** covering all aspects of environment configuration
- 🗄️ **Supabase setup instructions** (database, authentication, storage)
- 🤖 **AI Vision API configuration** (Z.AI GLM-4.7)
- 🔐 **OAuth provider setup** (Google, GitHub)
- 🌍 **Development vs Production** configuration guides
- 🔒 **Security best practices** and troubleshooting

---

## 📁 Branch Contents

```
fullstack-env-setup/
├── README.md                                       # This file
├── petvision-web/
│   └── .env.example                               # Web app environment variables
├── petvision-mobile/
│   └── .env.example                               # Mobile app environment variables
└── docs/
    └── FULLSTACK_ENVIRONMENT_SETUP.md             # Complete setup guide
```

### File Descriptions

| File | Purpose | Contents |
|------|---------|----------|
| **petvision-web/.env.example** | Web app environment template | 100+ variables with detailed comments |
| **petvision-mobile/.env.example** | Mobile app environment template | 80+ variables with detailed comments |
| **FULLSTACK_ENVIRONMENT_SETUP.md** | Complete setup documentation | Step-by-step guides for all services |

---

## 🚀 Quick Start

### 1. Clone This Branch

```bash
git clone -b fullstack-env-setup https://github.com/ToXMon/petvision-mvp-product.git
cd petvision-mvp-product
```

### 2. Copy Environment Templates

```bash
# For web app
cp petvision-web/.env.example petvision-web/.env.local

# For mobile app
cp petvision-mobile/.env.example petvision-mobile/.env
```

### 3. Configure Environment Variables

Open the files and update with your actual values:

```bash
# Web app
nano petvision-web/.env.local

# Mobile app
nano petvision-mobile/.env
```

### 4. Install Dependencies

```bash
# Web app
cd petvision-web
npm install

# Mobile app
cd ../petvision-mobile
npm install
```

### 5. Start Applications

```bash
# Web app - run from petvision-web directory
npm run dev
# Visit: http://localhost:3000

# Mobile app - run from petvision-mobile directory
npm start
# Scan QR code with Expo Go app
```

---

## 🔑 Required Environment Variables

### Minimum Required Variables

These are the **essential variables** needed to run the application:

#### For Web App (`petvision-web/.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Vision
ANTHROPIC_API_KEY=your-zai-api-key-here
```

#### For Mobile App (`petvision-mobile/.env`)

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API URL
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### Optional Variables

Additional variables for optional features:

| Feature | Variables | Purpose |
|---------|-----------|---------|
| **OAuth** | `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | Enable Google authentication |
| **Redis** | `REDIS_URL` | Enable caching layer |
| **Analytics** | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics tracking |
| **Sentry** | `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring |
| **Biometrics** | `NEXT_PUBLIC_ENABLE_BIOMETRICS` | Face ID/Touch ID (mobile) |

---

## 📖 Complete Setup Guide

For **detailed, step-by-step instructions**, see the comprehensive documentation:

**[→ FULLSTACK_ENVIRONMENT_SETUP.md](./docs/FULLSTACK_ENVIRONMENT_SETUP.md)**

### Setup Guide Topics

| Topic | Description |
|--------|-------------|
| **Prerequisites** | Required software and accounts |
| **Supabase Setup** | Database, auth, storage configuration |
| **AI Vision API** | Z.AI GLM-4.7 configuration |
| **OAuth Setup** | Google & GitHub OAuth configuration |
| **Web App Setup** | Next.js environment configuration |
| **Mobile App Setup** | React Native environment configuration |
| **Development** | Local development workflow |
| **Production** | Production deployment configuration |
| **Security** | Best practices and guidelines |
| **Troubleshooting** | Common issues and solutions |

---

## 🗄️ Supabase Setup

### Quick Setup

1. **Create Project**: Go to [Supabase Dashboard](https://app.supabase.com)
2. **Get API Keys**: Navigate to Settings > API
3. **Run Migrations**: Use SQL Editor to run `database/schema.sql`
4. **Enable Auth**: Configure authentication providers
5. **Setup Storage**: Create `pet-images` bucket

### Database Schema

Key tables:

```sql
-- Pet profiles
pet_profiles (id, user_id, name, breed, age, weight, avatar_url)

-- Scan results
scan_results (id, pet_id, scan_type, image_url, analysis_summary, findings)

-- Vet recommendations
vet_recommendations (id, scan_result_id, priority, category, recommendation)
```

### Authentication

Supported providers:
- ✅ **Email/Password**
- ✅ **Google OAuth**
- ✅ **GitHub OAuth**
- ✅ **Biometric** (mobile)

---

## 🤖 AI Vision API Setup

### Z.AI GLM-4.7 Configuration

1. **Get API Key**: Sign up at [Z.AI](https://z.ai)
2. **Configure Environment**:
   ```bash
   ANTHROPIC_API_KEY=your-zai-api-key
   NEXT_PUBLIC_VISION_BASE_URL=https://api.z.ai/api/anthropic
   NEXT_PUBLIC_VISION_MODEL=glm-4.7
   ```
3. **Test Connection**:
   ```bash
   curl -X POST https://api.z.ai/api/anthropic/v1/messages \
     -H "x-api-key: your-api-key" \
     -H "content-type: application/json" \
     -d '{
       "model": "glm-4.7",
       "max_tokens": 1024,
       "messages": [{"role": "user", "content": "Hello!"}]
     }'
   ```

---

## 🔐 OAuth Provider Setup

### Google OAuth

1. **Go to** [Google Cloud Console](https://console.cloud.google.com)
2. **Create OAuth 2.0 credentials**
3. **Authorized redirect URIs**:
   - Dev: `http://localhost:3000/auth/callback/google`
   - Prod: `https://yourdomain.com/auth/callback/google`
4. **Copy Client ID and Secret** to Supabase

### GitHub OAuth

1. **Go to** GitHub Developer Settings > OAuth Apps
2. **Register new application**
3. **Authorization callback URL**:
   - Dev: `http://localhost:3000/auth/callback/github`
   - Prod: `https://yourdomain.com/auth/callback/github`
4. **Copy Client ID and Secret** to Supabase

---

## 🌍 Environment Types

### Development Environment

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

### Production Environment

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=error
```

### Environment Files

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.example` | Template with documentation | ✅ Committed |
| `.env.local` | Local development | ❌ Never commit |
| `.env.production` | Production values | ❌ Never commit |
| `.env.test` | Testing environment | ❌ Never commit |

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:

```gitignore
.env
.env.local
.env.production
.env.test
*.key
*.pem
```

### 2. Use Different Keys for Different Environments

| Environment | Supabase Key | AI Vision Key |
|--------------|--------------|---------------|
| **Development** | Dev project | Test key |
| **Production** | Prod project | Production key |

### 3. Enable Security Headers

In `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
      ],
    }];
  },
};
```

### 4. Rotate Keys Regularly

- Change API keys every 90 days
- Rotate database credentials
- Update OAuth secrets if compromised

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Supabase Connection Failed

**Error:** `Unable to connect to Supabase`

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is not paused
- Ensure RLS policies are configured

#### 2. AI Vision API Not Working

**Error:** `API request failed`

**Solution:**
- Verify `ANTHROPIC_API_KEY` is valid
- Check API quota/limits
- Ensure `NEXT_PUBLIC_VISION_BASE_URL` is correct

#### 3. OAuth Callback Failing

**Error:** `OAuth callback URL mismatch`

**Solution:**
- Verify callback URLs match in Supabase and OAuth providers
- Check `NEXT_PUBLIC_AUTH_REDIRECT_URL` is correct
- Ensure domain is verified (for production)

#### 4. Environment Variables Not Loading

**Error:** `undefined` for environment variables

**Solution:**
- Restart development server after changing `.env.local`
- Verify file name is correct (`.env.local`, not `.env.txt`)
- Check variable names match exactly (case-sensitive)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Full Stack Setup Guide](./docs/FULLSTACK_ENVIRONMENT_SETUP.md) | Complete setup documentation |
| [Supabase Documentation](https://supabase.com/docs) | Official Supabase docs |
| [Z.AI Documentation](https://docs.z.ai) | AI Vision API docs |
| [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) | Next.js env var docs |
| [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables) | Expo env var docs |

---

## 🌍 Branch Comparison

| Branch | Purpose | Focus |
|--------|---------|-------|
| **main** | Production MVP code | Application code and features |
| **akash-sdl-deployment** | Docker & Akash configs | Deployment and infrastructure |
| **fullstack-env-setup** | Environment configuration | Setup and configuration |

---

## 🔗 Quick Reference Commands

```bash
# Web App
cd petvision-web
npm run dev       # Start dev server (localhost:3000)
npm run build     # Build for production
npm start          # Start production server
npm run lint       # Run linter

# Mobile App
cd petvision-mobile
npm start          # Start Expo
npm run ios        # Run iOS simulator
npm run android    # Run Android emulator

# Environment
printenv | grep NEXT_PUBLIC  # View public env vars
printenv | grep EXPO_PUBLIC  # View Expo public vars
```

---

## 📊 Environment Variable Summary

| Category | Variables | Security |
|----------|-----------|----------|
| **Supabase** | URL, anon key, service role key | Mixed (public/private) |
| **AI Vision** | API key, base URL, model | Private |
| **OAuth** | Provider flags, redirect URLs | Public |
| **Features** | Toggle flags, limits | Public |
| **Image Processing** | Dimensions, quality | Public |
| **Analytics** | GA tracking ID, Sentry DSN | Public |

---

## ✅ Setup Checklist

Use this checklist to ensure complete setup:

- [ ] Clone repository and switch to this branch
- [ ] Create Supabase project and get API keys
- [ ] Run database migrations
- [ ] Enable authentication providers
- [ ] Create storage bucket with RLS policies
- [ ] Get Z.AI API key
- [ ] Configure OAuth providers (Google, GitHub)
- [ ] Copy `.env.example` files to `.env.local` / `.env`
- [ ] Update all required environment variables
- [ ] Install dependencies for web and mobile apps
- [ ] Start development servers and verify functionality
- [ ] Test authentication flow
- [ ] Test AI vision analysis
- [ ] Verify database connectivity
- [ ] Configure security headers and settings
- [ ] Set up monitoring and error tracking (optional)

---

## 📞 Support

- 📧 Email: [support@petvision.app](mailto:support@petvision.app)
- 🐛 Issues: [GitHub Issues](https://github.com/ToXMon/petvision-mvp-product/issues)
- 📚 Docs: [Full Stack Setup Guide](./docs/FULLSTACK_ENVIRONMENT_SETUP.md)
- 💬 Discord: [Join Community](https://discord.gg/petvision)

---

<div align="center">
  <strong>Complete Environment Setup Guide 🛠️</strong>
  
  [⭐ Star this repo](https://github.com/ToXMon/petvision-mvp-product) • [🐛 Report issues](https://github.com/ToXMon/petvision-mvp-product/issues)
  
  <br>
  <em>All the configuration you need to run PetVision locally and in production!</em>
</div>
