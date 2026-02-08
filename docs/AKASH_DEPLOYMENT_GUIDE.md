# Akash Network Deployment Guide for PetVision

This guide provides step-by-step instructions for deploying PetVision to the Akash Network, a decentralized cloud computing marketplace.

## Prerequisites

- Akash CLI (`akashctl`) installed
- Akash wallet with sufficient AKT tokens
- Docker image built and pushed to a registry
- Domain name (optional, for custom URL)

## Table of Contents

1. [Building the Docker Image](#building-the-docker-image)
2. [Pushing to Container Registry](#pushing-to-container-registry)
3. [Deploying to Akash](#deploying-to-akash)
4. [Managing the Deployment](#managing-the-deployment)
5. [Monitoring and Scaling](#monitoring-and-scaling)

---

## Building the Docker Image

### Build the PetVision Web App Docker Image

```bash
# Navigate to the web app directory
cd petvision-web

# Build the Docker image
docker build -t petvision-web:latest .
```

### Test Locally (Optional)

```bash
# Run the container locally to test
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  -e ANTHROPIC_API_KEY=your_anthropic_api_key \
  petvision-web:latest
```

---

## Pushing to Container Registry

### Option 1: GitHub Container Registry (Recommended)

```bash
# Login to GitHub Container Registry
echo "your_github_token" | docker login ghcr.io -u your_github_username --password-stdin

# Tag the image
docker tag petvision-web:latest ghcr.io/toxmon/petvision-web:latest

# Push the image
docker push ghcr.io/toxmon/petvision-web:latest
```

### Option 2: Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag the image
docker tag petvision-web:latest toxmon/petvision-web:latest

# Push the image
docker push toxmon/petvision-web:latest
```

---

## Deploying to Akash

### 1. Update SDL Configuration

Edit `akash-deployment.yml` to update the image URL if needed:

```yaml
services:
  petvision-web:
    image: ghcr.io/toxmon/petvision-web:latest  # Update this
```

### 2. Create Deployment Certificate

```bash
# Generate certificate
cert_id=$(akashctl tx cert create client --from mykeychain --chainid akashnet-2 --fees 5000uakt)
```

### 3. Create Deployment

```bash
# Deploy using the SDL file
akashctl tx deployment create akash-deployment.yml --from mykeychain --chainid akashnet-2 --fees 5000uakt
```

### 4. Get Deployment Details

```bash
# List deployments
akashctl query deployment list

# Get specific deployment details
akashctl query deployment get <deployment-id>
```

### 5. Get Lease Information

```bash
# List leases
akashctl query market lease list

# Get specific lease details
akashctl query market lease get <lease-id>
```

### 6. Send Manifest

```bash
# Send deployment manifest to provider
akashctl provider send-manifest <lease-id> --dseq <deployment-seq> --provider <provider-address> --from mykeychain --chainid akashnet-2 --fees 5000uakt
```

---

## Managing the Deployment

### Accessing Your Deployed Application

After deployment, Akash provides:
- **URI**: Akash network access URL
- **IP**: Direct IP address
- **Port**: Exposed port (default: 80)

### Setting Up Domain (Optional)

1. **Configure DNS**:
   ```bash
   # Add CNAME record pointing to your Akash URI
   CNAME petvision.yourdomain.com -> your-uri.provider.akash.network
   ```

2. **Update Environment Variables** (if using domain):
   ```bash
   - NEXT_PUBLIC_APP_URL=https://petvision.yourdomain.com
   ```

### Updating Environment Variables

Edit the `akash-deployment.yml` file:

```yaml
env:
  - NODE_ENV=production
  - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  - ANTHROPIC_API_KEY=your_anthropic_key
```

Then update the deployment:

```bash
# Close existing lease
akashctl tx market lease close <lease-id> --from mykeychain --chainid akashnet-2

# Create new deployment with updated config
akashctl tx deployment create akash-deployment.yml --from mykeychain --chainid akashnet-2
```

---

## Monitoring and Scaling

### View Deployment Logs

```bash
# SSH into the deployment
akashctl provider lease-status <lease-id> --dseq <deployment-seq> --provider <provider-address> --from mykeychain

# View logs
docker logs -f <container-id>
```

### Resource Scaling

Update resources in `akash-deployment.yml`:

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

Then redeploy with the new configuration.

---

## Cost Optimization

### Recommended Compute Resources

| Tier | CPU | Memory | Storage | Monthly Cost (approx) |
|------|-----|--------|---------|----------------------|
| Development | 1 | 2Gi | 5Gi | $5-10 |
| Production | 2 | 4Gi | 10Gi | $10-20 |
| High Traffic | 4 | 8Gi | 20Gi | $20-40 |

### Cost Saving Tips

1. **Use CDN** for static assets
2. **Enable caching** with Redis
3. **Optimize images** before uploading
4. **Monitor usage** and scale down during low traffic
5. **Use Spot instances** for non-critical workloads

---

## Troubleshooting

### Deployment Fails to Start

```bash
# Check deployment status
akashctl query deployment get <deployment-id>

# Check lease status
akashctl query market lease get <lease-id>

# View provider status
akashctl provider status
```

### Application Not Accessible

```bash
# Check container logs
akashctl provider lease-logs <lease-id> --dseq <deployment-seq> --provider <provider-address>

# Verify container is running
akashctl provider lease-status <lease-id> --dseq <deployment-seq> --provider <provider-address>
```

### Out of Memory Errors

Increase memory allocation in `akash-deployment.yml`:

```yaml
memory:
  size: 8Gi  # Increase from 4Gi
```

---

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use secrets management** for sensitive data
3. **Enable HTTPS** with SSL certificates
4. **Implement rate limiting** on API endpoints
5. **Regular security updates** for dependencies
6. **Monitor for anomalies** using logs and metrics

---

## Support

- **Akash Documentation**: https://docs.akash.network
- **Akash Discord**: https://discord.gg/akash
- **PetVision GitHub**: https://github.com/ToXMon/petvision-mvp-product

---

## Quick Reference Commands

```bash
# Deploy
akashctl tx deployment create akash-deployment.yml --from mykeychain --chainid akashnet-2

# List deployments
akashctl query deployment list

# Close deployment
akashctl tx deployment close <dseq> --from mykeychain --chainid akashnet-2

# Send manifest
akashctl provider send-manifest <lease-id> --dseq <dseq> --provider <provider-address>

# View logs
akashctl provider lease-logs <lease-id> --dseq <dseq> --provider <provider-address>
```
