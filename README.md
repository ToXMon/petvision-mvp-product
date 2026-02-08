# PetVision - Akash SDL Deployment

<div align="center">
  
  **[🚀 Deploy to Akash](./docs/AKASH_DEPLOYMENT_GUIDE.md)** • **[🐳 Docker Setup](#docker-setup)** • **[☁️ Main Branch](https://github.com/ToXMon/petvision-mvp-product)
  
  [![Akash Network](https://img.shields.io/badge/Akash-Network-blue)](https://akash.network/)
  [![Docker](https://img.shields.io/badge/Docker-Supported-blue)](https://www.docker.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  
</div>

---

## ☁️ Overview

This branch contains **complete deployment configurations** for PetVision on **Akash Network** - a decentralized cloud computing marketplace. It includes Docker configurations, docker-compose setups, and comprehensive deployment documentation for hosting PetVision in a decentralized, cost-effective manner.

### 🎯 What This Branch Provides

- 🐳 **Production-ready Docker images** with multi-stage builds
- 📦 **Docker Compose** for multi-container deployment (Web, Redis, Nginx)
- ☁️ **Akash SDL** (Stack Definition Language) configuration files
- 🚀 **Comprehensive deployment guide** for Akash Network
- 🔒 **SSL/HTTPS support** via Nginx reverse proxy
- 📊 **Optimized resource configurations** for cost-effective deployment

---

## ⚠️ Critical: Akash SDL Best Practices

### 🚨 NEVER Use `:latest` or Omit Image Tags

**CRITICAL RULE FOR AKASH DEPLOYMENTS:**

```yaml
# ❌ WRONG - NEVER do this!
image: ghcr.io/toxmon/petvision-web:latest
image: ghcr.io/toxmon/petvision-web

# ✅ CORRECT - ALWAYS use explicit version tags!
image: ghcr.io/toxmon/petvision-web:1.0.0
image: ghcr.io/toxmon/petvision-web:20240208-abc123
```

### Why Explicit Version Tags Matter

| Scenario | With Explicit Tag | Without Tag (`:latest`) |
|----------|-------------------|------------------------|
| **Reproducibility** | ✅ Same image every time | ❌ Random image changes |
| **Rollbacks** | ✅ Easy version control | ❌ Cannot rollback |
| **Debugging** | ✅ Know exact version | ❌ Unknown version |
| **CI/CD** | ✅ Predictable builds | ❌ Unpredictable results |
| **Cost** | ✅ Consistent deployment | ❌ Unexpected failures |

### Version Tag Format

Use semantic versioning or Git commit SHA:

```bash
# Semantic versioning
ghcr.io/toxmon/petvision-web:1.0.0
ghcr.io/toxmon/petvision-web:1.2.3

# Git commit SHA
ghcr.io/toxmon/petvision-web:8e88c7a

# Timestamp-based
ghcr.io/toxmon/petvision-web:20240208-125400
```

---

## 📁 Branch Contents

```
akash-sdl-deployment/
├── README.md                           # This file
├── docker-compose.yml                   # Multi-container deployment
├── akash-deployment.yml                  # Akash Network SDL config
├── petvision-web/
│   └── Dockerfile                       # Multi-stage Docker build
└── docs/
    └── AKASH_DEPLOYMENT_GUIDE.md         # Complete deployment guide
```

### File Descriptions

| File | Purpose | Key Features |
|------|---------|-------------|
| **Dockerfile** | Build production-ready Docker image | Multi-stage build, Alpine-based, Optimized size |
| **docker-compose.yml** | Multi-container orchestration | Web + Redis + Nginx, Health checks, Environment management |
| **akash-deployment.yml** | Akash Network deployment config | SDL v2.0, Resource specs, Pricing, Exposure |
| **AKASH_DEPLOYMENT_GUIDE.md** | Step-by-step deployment guide | Complete documentation, Troubleshooting, Best practices |

---

## 🐳 Docker Setup

### Prerequisites

- Docker 20.x or higher
- Docker Compose 2.x or higher
- 2GB RAM minimum (4GB recommended)

### Quick Start

```bash
# Clone this branch
git clone -b akash-sdl-deployment https://github.com/ToXMon/petvision-mvp-product.git
cd petvision-mvp-product

# Copy environment variables
cp ../fullstack-env-setup/petvision-web/.env.example .env.production

# Edit with your values
nano .env.production
```

### Build Docker Image

```bash
# Build PetVision web app image
docker build -t petvision-web:1.0.0 ./petvision-web

# Tag for registry (replace with actual version)
docker tag petvision-web:1.0.0 ghcr.io/toxmon/petvision-web:1.0.0
```

### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Services Included

| Service | Ports | Purpose |
|---------|-------|---------|
| **petvision-web** | 3000:3000 | Next.js web application |
| **redis** | 6379:6379 | Caching layer |
| **nginx** | 80:80, 443:443 | Reverse proxy & SSL |

### Environment Variables

Required variables for Docker deployment:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Vision
ANTHROPIC_API_KEY=your-zai-api-key

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## ☁️ Akash Network Deployment

### What is Akash Network?

Akash is a **decentralized cloud computing marketplace** that provides:
- 💰 **90%+ cost savings** vs. AWS/GCP/Azure
- 🌍 **Global network** of providers
- 🔒 **Secure & private** deployments
- 🚀 **Fast deployment** via SDL (Stack Definition Language)
- 💳 **Pay-as-you-go** pricing

### Deployment Requirements

1. **Akash CLI** (`akashctl`) installed
2. **Akash wallet** with AKT tokens (approx $5-10/mo for typical deployment)
3. **Docker image** pushed to container registry
4. **Domain name** (optional but recommended)

### Quick Deployment Steps

```bash
# 1. Build and push Docker image (WITH EXPLICIT TAG!)
docker build -t ghcr.io/toxmon/petvision-web:1.0.0 ./petvision-web

echo "your-github-token" | docker login ghcr.io -u your-github-username --password-stdin
docker push ghcr.io/toxmon/petvision-web:1.0.0

# 2. Update image tag in akash-deployment.yml
nano akash-deployment.yml
# Change: image: ghcr.io/toxmon/petvision-web:latest
# To:      image: ghcr.io/toxmon/petvision-web:1.0.0

# 3. Create deployment certificate
akashctl tx cert create client --from mykeychain --chainid akashnet-2

# 4. Deploy to Akash
akashctl tx deployment create akash-deployment.yml --from mykeychain --chainid akashnet-2

# 5. Send manifest to provider
akashctl provider send-manifest <lease-id> --dseq <dseq> --provider <provider-address>
```

### Resource Configuration

Default resources in `akash-deployment.yml`:

| Resource | Allocation | Cost (approx) |
|----------|-----------|--------------|
| **CPU** | 2 units | $2-3/mo |
| **Memory** | 4 GiB | $4-6/mo |
| **Storage** | 10 GiB | $1-2/mo |
| **Total** | - | **$7-11/mo** |

> 💡 **Tip:** Start with these defaults and scale up as needed based on actual usage.

### Accessing Your Deployment

After deployment, Akash provides:
- **URI**: `https://your-lease-id.provider.akash.network`
- **IP**: Direct IP address
- **Status**: Deployment health metrics

#### Setting Up Custom Domain

1. **Configure DNS**:
   ```
   CNAME petvision.yourdomain.com -> your-uri.provider.akash.network
   ```

2. **Update Environment Variables**:
   ```bash
   - NEXT_PUBLIC_APP_URL=https://petvision.yourdomain.com
   ```

3. **Re-deploy** with new configuration

---

## 📊 Resource Optimization

### Scaling Guide

| Traffic Level | CPU | Memory | Storage | Cost |
|--------------|-----|--------|---------|------|
| **Development** | 1 unit | 2 GiB | 5 GiB | $3-5/mo |
| **Production** | 2 units | 4 GiB | 10 GiB | $7-11/mo |
| **High Traffic** | 4 units | 8 GiB | 20 GiB | $14-22/mo |

### Update Resources

Edit `akash-deployment.yml`:

```yaml
profiles:
  compute:
    petvision-compute:
      resources:
        cpu:
          units: 4  # Increase from 2
        memory:
          size: 8Gi  # Increase from 4Gi
        storage:
          size: 20Gi  # Increase from 10Gi
```

Then close old lease and create new deployment.

---

## 🔒 Security & SSL

### SSL/HTTPS with Nginx

The `docker-compose.yml` includes Nginx for SSL termination:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./ssl:/etc/nginx/ssl:ro
```

#### Setting Up SSL Certificates

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate (for development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/CN=petvision.localhost"

# For production, use Let's Encrypt
certbot certonly --webroot -w /var/www/html -d yourdomain.com
```

### Security Headers

Add to `nginx.conf`:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 📈 Monitoring & Logs

### View Deployment Logs

```bash
# SSH into deployment
akashctl provider lease-status <lease-id> --dseq <dseq> --provider <provider-address>

# View logs
docker logs -f petvision-web

# View all service logs
docker-compose logs -f
```

### Health Checks

Docker Compose includes health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

Check health:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Deployment Fails to Start

```bash
# Check deployment status
akashctl query deployment get <deployment-id>

# Check lease status
akashctl query market lease get <lease-id>
```

#### 2. Image Pull Errors

**Error**: `failed to pull image`

**Solution**:
```bash
# Verify image exists and is public
docker pull ghcr.io/toxmon/petvision-web:1.0.0

# Check image tag (CRITICAL: ensure explicit tag, not :latest)
docker images | grep petvision-web
```

#### 3. Out of Memory Errors

Increase memory in `akash-deployment.yml`:

```yaml
memory:
  size: 8Gi  # Increase from 4Gi
```

#### 4. Container Restarts

```bash
# View logs to find issue
docker logs petvision-web --tail 100

# Check resource usage
docker stats
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Complete Akash Deployment Guide](./docs/AKASH_DEPLOYMENT_GUIDE.md) | Step-by-step deployment instructions |
| [Docker Documentation](https://docs.docker.com/) | Official Docker documentation |
| [Akash Network Docs](https://docs.akash.network/) | Official Akash documentation |
| [Environment Setup Guide](https://github.com/ToXMon/petvision-mvp-product/tree/fullstack-env-setup) | Environment variable configuration |

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Akash

on:
  push:
    branches:
      - akash-sdl-deployment

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -t ghcr.io/toxmon/petvision-web:${{ github.sha }} ./petvision-web
          
      - name: Push to registry
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/toxmon/petvision-web:${{ github.sha }}
          
      - name: Deploy to Akash
        run: |
          akashctl tx deployment create akash-deployment.yml --from mykeychain
```

---

## 💡 Best Practices

### 1. Always Use Explicit Version Tags

```yaml
# ✅ CORRECT
image: ghcr.io/toxmon/petvision-web:1.0.0

# ❌ WRONG
image: ghcr.io/toxmon/petvision-web:latest
```

### 2. Tag Images with Git SHA

```bash
# Automatically tag with commit SHA
docker build -t ghcr.io/toxmon/petvision-web:$(git rev-parse --short HEAD) ./petvision-web
```

### 3. Monitor Resource Usage

```bash
# Check actual usage vs allocated
akashctl provider lease-status <lease-id>
```

### 4. Keep Image Size Small

- Use Alpine-based images
- Multi-stage builds
- Remove unnecessary dependencies
- Optimize layers

### 5. Enable Caching

Use Redis for:
- API response caching
- Session storage
- Rate limiting

---

## 🌍 Branch Comparison

| Branch | Purpose | Deployment |
|--------|---------|------------|
| **main** | Production MVP code | Vercel/Expo EAS |
| **akash-sdl-deployment** | Docker & Akash configs | Docker/Akash Network |
| **fullstack-env-setup** | Environment configuration | All platforms |

---

## 💰 Cost Comparison

| Platform | Monthly Cost | Pros | Cons |
|----------|--------------|------|------|
| **Akash Network** | $7-11 | Decentralized, 90% cheaper | Newer platform |
| **Vercel Pro** | $20+ | Easy, auto-scaling | More expensive |
| **AWS/GCP** | $50+ | Enterprise features | Most expensive |
| **DigitalOcean** | $20+ | Simple, reliable | Higher cost than Akash |

---

## 📞 Support

- 📧 Email: [support@petvision.app](mailto:support@petvision.app)
- 🐛 Issues: [GitHub Issues](https://github.com/ToXMon/petvision-mvp-product/issues)
- 📚 Docs: [Akash Deployment Guide](./docs/AKASH_DEPLOYMENT_GUIDE.md)
- 💬 Akash Discord: [Join](https://discord.gg/akash)

---

<div align="center">
  <strong>Deploy PetVision on Akash Network 🚀</strong>
  
  [⭐ Star this repo](https://github.com/ToXMon/petvision-mvp-product) • [🐛 Report issues](https://github.com/ToXMon/petvision-mvp-product/issues)
  
  <br>
  <em>Remember: ALWAYS use explicit image tags for reproducible Akash deployments! 🎯</em>
</div>
