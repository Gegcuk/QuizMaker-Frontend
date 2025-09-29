#!/bin/bash

# Quizzence Frontend - Server Setup Script
# Run this script on your Digital Ocean Ubuntu server

echo "🚀 Starting Quizzence Frontend server setup..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root or with sudo"
    echo "Usage: sudo bash server-setup.sh"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose plugin (recommended)
echo "🐳 Installing Docker Compose plugin..."
apt-get install -y docker-compose-plugin

# Add current user to docker group
usermod -aG docker $USER

# Create a non-root user for deployment (recommended)
echo "👤 Creating deployment user..."
if ! id "deploy" &>/dev/null; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    usermod -aG docker deploy
    echo "✅ Created 'deploy' user"
else
    echo "ℹ️  'deploy' user already exists"
fi

# Install Nginx
echo "🌐 Installing Nginx..."
apt install nginx -y
systemctl enable nginx
systemctl start nginx

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p /var/www/quizzence
chown deploy:deploy /var/www/quizzence
cd /var/www/quizzence

# Generate SSH key for GitHub Actions (for deploy user)
echo "🔑 Generating SSH key for GitHub Actions..."
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy ssh-keygen -t ed25519 -C "gha-deploy@quizzence" -f /home/deploy/.ssh/github_actions -N ""

# CRITICAL: authorize it for inbound SSH
echo "🔐 Authorizing SSH key for GitHub Actions..."
sudo -u deploy bash -lc 'cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys'

# Set proper permissions
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys /home/deploy/.ssh/github_actions
chmod 644 /home/deploy/.ssh/github_actions.pub

# Configure Nginx
echo "🌐 Configuring Nginx..."
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

# Enable the site
ln -sf /etc/nginx/sites-available/quizzence.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL certificates..."
apt install certbot python3-certbot-nginx -y

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Note: Monitoring is now handled by Docker healthcheck and restart policy
# No need for cron monitoring script

echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the SSH private key (for GitHub Secrets):"
echo "   cat /home/deploy/.ssh/github_actions"
echo ""
echo "2. Add this key to your GitHub repository secrets:"
echo "   - SERVER_SSH_KEY: (private key from step 1)"
echo "   - SERVER_HOST: 46.101.52.193"
echo "   - SERVER_USER: deploy"
echo "   - DOMAIN: quizzence.com"
echo ""
echo "3. IMPORTANT: After copying the key to GitHub Secrets, delete it from server:"
echo "   sudo shred -u /home/deploy/.ssh/github_actions"
echo "   (Keep only the .pub file and authorized_keys)"
echo ""
echo "4. The public key is already authorized on the server"
echo "   No need to add SERVER_SSH_PUBLIC_KEY secret"
echo ""
echo "5. Configure your domain DNS to point to this server"
echo "6. Run: certbot --nginx -d quizzence.com -d www.quizzence.com"
echo ""
echo "🎉 Setup complete! Your server is ready for deployment."
