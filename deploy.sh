#!/bin/bash

# Quizzence Frontend - Local Deployment Script
# Run this script locally to test deployment

echo "🚀 Starting local deployment test..."

# Check if we're in the right directory
if [ ! -f "quizmaker-frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to frontend directory
cd quizmaker-frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Install Playwright browser for prerendering (idempotent)
echo "🌐 Installing Playwright Chromium for prerender..."
npx playwright install chromium

# Build the application with prerendered HTML for key routes
echo "🔨 Building application with prerender..."
npm run build:prerender

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

# Test Docker build
echo "🐳 Testing Docker build..."
docker build -t quizzence-frontend:test .

# Test Docker Compose
echo "🐳 Testing Docker Compose..."
docker-compose up -d --build

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Check if container is running
if docker ps | grep -q quizzence-frontend; then
    echo "✅ Container is running successfully!"
    echo "🌐 Application should be available at: http://localhost:3000"
    echo ""
    echo "📋 To stop the application, run:"
    echo "   docker-compose down"
    echo ""
    echo "📋 To view logs, run:"
    echo "   docker-compose logs -f"
else
    echo "❌ Error: Container failed to start"
    echo "📋 Check logs with: docker-compose logs"
    exit 1
fi

echo "🎉 Local deployment test completed successfully!"
