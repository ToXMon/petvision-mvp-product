# PetVision Full Stack Environment Setup Guide

This comprehensive guide covers setting up the complete PetVision development and production environment, including all required environment variables, dependencies, and third-party services.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables Overview](#environment-variables-overview)
3. [Supabase Setup](#supabase-setup)
4. [AI Vision API Setup](#ai-vision-api-setup)
5. [Web Application Setup](#web-application-setup)
6. [Mobile Application Setup](#mobile-application-setup)
7. [Development Environment](#development-environment)
8. [Production Deployment](#production-deployment)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **Supabase Account**: [Create free account](https://supabase.com)
- **Z.AI Account**: [Get API key](https://z.ai)

### Optional but Recommended

- **Docker**: For containerization
- **Redis**: For caching
- **PostgreSQL Client**: For database management

---

## Environment Variables Overview

### Core Environment Variables

| Category | Variables | Purpose |
|----------|-----------|---------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Database and auth |
| **AI Vision** | `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_VISION_MODEL` | Z.AI GLM-4.7 integration |
| **Auth** | `NEXT_PUBLIC_AUTH_ENABLED`, OAuth flags | Authentication providers |
| **Features** | `NEXT_PUBLIC_ENABLE_TIMELINE`, etc. | Feature toggles |
| **Image Processing** | `NEXT_PUBLIC_MAX_IMAGE_WIDTH`, `NEXT_PUBLIC_IMAGE_QUALITY` | Image optimization |

### Security Classification

**Public Variables** (exposed to client):
- `NEXT_PUBLIC_*` variables
- `EXPO_PUBLIC_*` variables
- Safe to commit to Git

**Private Variables** (server-side only):
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_SECRET_KEY`
- **NEVER commit to Git**

---

## Supabase Setup

### 1. Create Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Configure project:
   - **Name**: `petvision-prod`
   - **Database Password**: Generate strong password
   - **Region**: Choose region closest to users
   - **Pricing Plan**: Free tier (or Pro for production)
4. Wait for project to initialize (~2 minutes)

### 2. Get API Credentials

Navigate to **Settings > API** and copy:

```
Project URL: https://xxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Enable Authentication

Navigate to **Authentication > Providers** and enable:

- ✅ **Email**: Enable email/password authentication
- ✅ **Google**: Configure OAuth (requires Google Cloud project)
- ✅ **GitHub**: Configure OAuth (requires GitHub OAuth app)

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new OAuth 2.0 credentials
3. **Authorized redirect URIs**:
   - Dev: `http://localhost:3000/auth/callback/google`
   - Prod: `https://yourdomain.com/auth/callback/google`
4. Copy Client ID and Secret to Supabase

#### GitHub OAuth Setup

1. Go to GitHub Developer Settings > OAuth Apps
2. Register new application
3. **Authorization callback URL**:
   - Dev: `http://localhost:3000/auth/callback/github`
   - Prod: `https://yourdomain.com/auth/callback/github`
4. Copy Client ID and Secret to Supabase

### 4. Run Database Migrations

Navigate to **SQL Editor** and run the migrations from `database/schema.sql`:

```sql
-- Pet profiles table
CREATE TABLE pet_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  age TEXT,
  weight NUMERIC,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  avatar_url TEXT,
  medical_history TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan results table
CREATE TABLE scan_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pet_profiles(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('eye', 'skin', 'teeth', 'gait', 'multi')),
  image_url TEXT NOT NULL,
  image_hash TEXT UNIQUE,
  analysis_summary TEXT,
  overall_severity TEXT CHECK (overall_severity IN ('green', 'yellow', 'red')),
  findings JSONB NOT NULL DEFAULT '[]',
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  image_quality_assessment TEXT CHECK (image_quality_assessment IN ('good', 'fair', 'poor')),
  ai_recommendations TEXT[],
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vet recommendations table
CREATE TABLE vet_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_result_id UUID REFERENCES scan_results(id) ON DELETE CASCADE,
  priority TEXT CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  category TEXT,
  recommendation TEXT NOT NULL,
  timeframe TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Configure Storage

Navigate to **Storage > New bucket**:

- **Name**: `pet-images`
- **Public**: No
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Max file size**: 10MB

Add RLS policies:

```sql
-- Enable RLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pet-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pet-images');
```

---

## AI Vision API Setup

### 1. Get Z.AI API Key

1. Go to [Z.AI](https://z.ai)
2. Sign up for an account
3. Navigate to API Keys
4. Create new API key
5. Copy the key to your environment variables

### 2. Configure API Settings

Add these variables to your `.env`:

```bash
ANTHROPIC_API_KEY=your-zai-api-key-here
NEXT_PUBLIC_VISION_BASE_URL=https://api.z.ai/api/anthropic
NEXT_PUBLIC_VISION_MODEL=glm-4.7
```

### 3. Test API Connection

```bash
# Test with curl
curl -X POST https://api.z.ai/api/anthropic/v1/messages \
  -H "x-api-key: your-api-key" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "glm-4.7",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## Web Application Setup

### 1. Install Dependencies

```bash
cd petvision-web
npm install
```

### 2. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required minimum variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-zai-api-key
```

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Build for Production

```bash
npm run build
npm start
```

---

## Mobile Application Setup

### 1. Install Dependencies

```bash
cd petvision-mobile
npm install
```

### 2. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

Required minimum variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Start Development Server

```bash
# Start Expo
npm start

# Scan QR code with Expo Go app
# Or run on simulator:
npm run ios
npm run android
```

### 4. Build for Production

```bash
# Build iOS
eas build --platform ios

# Build Android
eas build --platform android
```

---

## Development Environment

### Local Development Stack

```bash
# Start all services (using Docker Compose)
docker-compose up -d

# Or start services individually
# Web App
cd petvision-web && npm run dev

# Mobile App
cd petvision-mobile && npm start

# Redis (optional)
docker run -d -p 6379:6379 redis:7-alpine
```

### Development Workflow

1. **Branch from main**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

3. **Test locally** before pushing

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Quality

```bash
# Run linter
npm run lint

# Run tests
npm test

# Type check
npm run type-check
```

---

## Production Deployment

### Web Deployment Options

#### Option 1: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option 2: Docker

```bash
# Build image
docker build -t petvision-web:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  petvision-web:latest
```

#### Option 3: Akash Network

See [AKASH_DEPLOYMENT_GUIDE.md](./AKASH_DEPLOYMENT_GUIDE.md)

### Mobile App Deployment

```bash
# Build for app stores
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Security Best Practices

### 1. Never Commit Secrets

Add these to `.gitignore`:

```gitignore
.env
.env.local
.env.production
*.key
*.pem
```

### 2. Use Environment-Specific Files

- **Development**: `.env.local`
- **Production**: `.env.production`
- **Testing**: `.env.test`

### 3. Rotate Keys Regularly

- Change API keys every 90 days
- Rotate database credentials
- Update OAuth secrets if compromised

### 4. Enable Security Headers

In `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    }];
  },
};
```

---

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Failed

**Error**: `Unable to connect to Supabase`

**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is not paused
- Ensure RLS policies are configured

#### 2. AI Vision API Not Working

**Error**: `API request failed`

**Solution**:
- Verify `ANTHROPIC_API_KEY` is valid
- Check API quota/limits
- Ensure `NEXT_PUBLIC_VISION_BASE_URL` is correct

#### 3. Image Upload Failing

**Error**: `Storage permission denied`

**Solution**:
- Check storage bucket RLS policies
- Verify bucket exists
- Ensure user is authenticated

#### 4. OAuth Callback Failing

**Error**: `OAuth callback URL mismatch`

**Solution**:
- Verify callback URLs match in Supabase and OAuth providers
- Check `NEXT_PUBLIC_AUTH_REDIRECT_URL` is correct
- Ensure domain is verified (for production)

### Debug Mode

Enable debug mode in `.env`:

```bash
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

---

## Quick Reference

### Essential Commands

```bash
# Web App
cd petvision-web
npm run dev       # Start dev server
npm run build     # Build for production
npm run test       # Run tests
npm run lint       # Run linter

# Mobile App
cd petvision-mobile
npm start          # Start Expo
npm run ios        # Run iOS simulator
npm run android    # Run Android emulator
eas build          # Build for production

# Database
supabase db reset  # Reset database
supabase db diff   # Show migrations
```

### Environment File Templates

- **Web**: `petvision-web/.env.example`
- **Mobile**: `petvision-mobile/.env.example`

---

## Support

- **Documentation**: [PetVision Docs](https://docs.petvision.app)
- **GitHub**: [Repository](https://github.com/ToXMon/petvision-mvp-product)
- **Supabase**: [Support](https://supabase.com/support)
- **Z.AI**: [API Docs](https://docs.z.ai)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-08 | Initial release with full stack setup guide |
