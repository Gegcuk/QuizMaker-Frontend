# QuizMaker Frontend - Complete Deployment Guide

This comprehensive guide covers everything you need to deploy your QuizMaker Frontend to Digital Ocean using GitHub Actions and Docker.

## 🎯 Overview

- **Server**: Digital Ocean Ubuntu at `46.101.52.193`
- **Domain**: `quizzence.com`
- **Deployment**: Automated via GitHub Actions
- **Container**: Docker with Nginx
- **SSL**: Let's Encrypt via Certbot

## 📋 Prerequisites

- Digital Ocean server (Ubuntu)
- GitHub repository with your code
- Domain `quizzence.com` configured at GoDaddy
- Windows PowerShell with SSH access

## 🚀 Quick Start (5 Steps)

### Step 1: SSH Connection ✅ COMPLETED

**Great! You've already established SSH connection from PowerShell to your server.**
- ✅ SSH keys are set up
- ✅ Connection to `46.101.52.193` is working
- ✅ You can proceed directly to Step 2

**If you need to test the connection again:**
```powershell
ssh root@46.101.52.193
```

### Step 2: Run Server Setup

**Option A: Copy script to server (Recommended)**
```bash
# From your local machine, copy the script to server
scp server-setup.sh root@46.101.52.193:/root/

# Then SSH to server and run it
ssh root@46.101.52.193
chmod +x /root/server-setup.sh
/root/server-setup.sh
```

**Option B: Run commands manually on server**
```bash
# SSH to your server
ssh root@46.101.52.193

# Then run the setup commands manually (see Detailed Setup section below)
```

### Step 3: Get SSH Key for GitHub
```bash
# Copy the private key (starts with -----BEGIN OPENSSH PRIVATE KEY-----)
cat /home/deploy/.ssh/github_actions
```

**⚠️ Security Note**: After copying the key to GitHub Secrets, delete it from the server:
```bash
sudo shred -u /home/deploy/.ssh/github_actions
# Keep only the .pub file and authorized_keys
```

### Step 4: Configure GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions
**Repository**: [https://github.com/Gegcuk/QuizMaker-Frontend](https://github.com/Gegcuk/QuizMaker-Frontend)

Add these secrets:
- `SERVER_SSH_KEY`: (private key from step 3)
- `SERVER_HOST`: `46.101.52.193`
- `SERVER_USER`: `deploy`
- `DOMAIN`: `quizzence.com`

### Step 5: Configure Domain DNS
1. Go to GoDaddy DNS Management
2. Add A records:
   - `@` → `46.101.52.193`
   - `www` → `46.101.52.193`

**That's it!** Push to `main` branch and your app will deploy automatically.


#### 2. Install Docker and Compose Plugin
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose plugin (recommended)
apt-get install -y docker-compose-plugin

# Add user to docker group
usermod -aG docker $USER
```

#### 3. Create Deployment User
```bash
# Create non-root user for security
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Create deployment directory
mkdir -p /var/www/quizzence
chown deploy:deploy /var/www/quizzence
```

#### 4. Generate SSH Key for GitHub Actions
```bash
# Generate SSH key for automated deployment
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy ssh-keygen -t ed25519 -C "gha-deploy@quizzence" -f /home/deploy/.ssh/github_actions -N ""

# CRITICAL: Authorize the key for inbound SSH
sudo -u deploy bash -lc 'cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys'

# Set proper permissions
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys /home/deploy/.ssh/github_actions
chmod 644 /home/deploy/.ssh/github_actions.pub
```

#### 5. Install and Configure Nginx
```bash
# Install Nginx
apt install nginx -y
systemctl enable nginx
systemctl start nginx

# Configure site
cat > /etc/nginx/sites-available/quizzence.com << EOF
server {
    listen 80;
    server_name quizzence.com www.quizzence.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/quizzence.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

#### 6. Configure Firewall
```bash
# Configure UFW firewall
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable
```

#### 7. Install SSL Certificate (Optional but Recommended)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d quizzence.com -d www.quizzence.com
```

### GitHub Actions Workflow

The workflow automatically:
1. Builds your React app
2. Copies built files to server
3. Starts Docker containers
4. Serves your app

**File: `.github/workflows/deploy.yml`**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: quizmaker-frontend/package-lock.json

      - name: Install deps
        working-directory: quizmaker-frontend
        run: npm ci

      - name: Build
        working-directory: quizmaker-frontend
        run: npm run build

      - name: Prepare deployment bundle
        run: |
          rm -rf deployment && mkdir -p deployment
          cp -r quizmaker-frontend/dist deployment/
          cp quizmaker-frontend/Dockerfile deployment/
          cp quizmaker-frontend/docker-compose.yml deployment/
          cp quizmaker-frontend/nginx.conf deployment/

      - name: Stop old app (ignore if first run)
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            set -e
            mkdir -p /var/www/quizzence
            cd /var/www/quizzence
            docker compose down || true

      - name: Copy files
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: "deployment/*"
          target: "/var/www/quizzence"

      - name: Start app
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            set -e
            cd /var/www/quizzence
            # Prefer plugin form if installed
            if docker compose version >/dev/null 2>&1; then
              docker compose up -d --build
            else
              docker-compose up -d --build
            fi
```

### Docker Configuration

**File: `quizmaker-frontend/Dockerfile`**
```dockerfile
# Runtime-only Dockerfile - no Node build here
FROM nginx:alpine
RUN apk add --no-cache curl
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**File: `quizmaker-frontend/docker-compose.yml`**
```yaml
version: "3.8"

services:
  quizzence-frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:3000:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - quizzence-network

networks:
  quizzence-network:
    driver: bridge
```

**File: `quizmaker-frontend/nginx.conf`**
```nginx
server {
    listen 80;
    server_name quizzence.com www.quizzence.com;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

## 🧪 Testing Your Deployment

### Local Testing
```bash
# Test Docker build locally
cd quizmaker-frontend
docker-compose up --build

# Should be available at http://localhost:3000
```

### Server Testing
```bash
# Check if containers are running
docker ps

# Check logs
docker-compose logs -f

# Test domain
curl -I http://quizzence.com
```

## 🔧 Troubleshooting

### Can't connect to server?
1. **Check SSH key setup**:
   - Make sure you generated SSH key: `ssh-keygen -t rsa -b 4096 -C "your-email@example.com"`
   - Verify key was added to Digital Ocean → Account → Security → SSH Keys
   - Test connection: `ssh root@46.101.52.193`
2. **Backup option**: Use Digital Ocean Console (droplet → Console button)
3. Check if server is running in Digital Ocean dashboard
4. Verify your IP address: `46.101.52.193`

### SSH key not working?
1. Make sure you copied the complete private key
2. Check key permissions: `chmod 600 /home/deploy/.ssh/github_actions`
3. Test connection from your local machine: `ssh -i <your_local_private_key> deploy@46.101.52.193 'hostname'`

### Docker not working?
1. Check if user is in docker group: `groups deploy`
2. Test: `docker --version`
3. Check logs: `docker-compose logs -f`

### Domain not loading?
1. Check DNS propagation: `nslookup quizzence.com`
2. Verify Nginx is running: `systemctl status nginx`
3. Check if containers are running: `docker ps`

### GitHub Actions failing?
1. Check all GitHub Secrets are set correctly
2. Verify SSH key permissions
3. Check server disk space
4. Review GitHub Actions logs

## 📊 Monitoring

The deployment includes:
- **Docker healthcheck**: Automatically restarts unhealthy containers
- **Restart policy**: `unless-stopped` ensures containers restart on server reboot
- **Nginx logs**: `journalctl -u nginx`
- **Container logs**: `docker-compose logs -f`

## 🔒 Security Features

- Non-root deployment user
- UFW firewall configured
- SSL/TLS encryption via Let's Encrypt
- Security headers in Nginx
- Docker container isolation

## 📁 File Structure

```
├── .github/workflows/deploy.yml    # GitHub Actions workflow
├── quizmaker-frontend/
│   ├── Dockerfile                  # Runtime-only Docker config
│   ├── docker-compose.yml          # Docker Compose setup
│   └── nginx.conf                  # Nginx configuration
├── server-setup.sh                # Automated server setup
└── COMPLETE_DEPLOYMENT_GUIDE.md   # This guide
```

## ✅ Verification Checklist

- [ ] Server accessible via Console or SSH
- [ ] Docker and Compose plugin installed
- [ ] Nginx installed and running
- [ ] SSH keys generated and authorized
- [ ] GitHub Secrets configured
- [ ] Domain DNS configured
- [ ] SSL certificate installed (optional)
- [ ] First deployment successful
- [ ] App accessible at `https://quizzence.com`

## 🆘 Need Help?

1. **Use Digital Ocean Console** for all server operations (no SSH keys needed)
2. **Check the troubleshooting section** above
3. **Verify all steps** were completed correctly
4. **Check server logs**: `docker-compose logs -f`
5. **Ensure domain DNS** has propagated (can take up to 48 hours)

---

**Note**: This setup creates a secure, production-ready deployment with automated CI/CD, Docker containerization, SSL encryption, and monitoring. Every push to `main` will automatically deploy your app!
