#!/bin/bash

# RouteLLM Chatbot - Quick Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on error

echo "🚀 RouteLLM Chatbot - Deployment Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Git repository not initialized. Initializing...${NC}"
    git init
    echo -e "${GREEN}✓ Git initialized${NC}"
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✓ Vercel CLI installed${NC}"
fi

# Check if node_modules exist
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}Dependencies not installed. Installing...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

# Build test
echo ""
echo "🔨 Testing build locally..."
if npm run build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

# Git status
echo ""
echo "📋 Git Status:"
git status --short

# Ask if user wants to commit
echo ""
read -p "Do you want to commit changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    read -p "Enter commit message: " commit_msg
    git commit -m "$commit_msg"
    echo -e "${GREEN}✓ Changes committed${NC}"
fi

# Check if GitHub remote exists
echo ""
if git remote -v | grep -q origin; then
    echo -e "${GREEN}✓ GitHub remote configured${NC}"
    read -p "Push to GitHub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main || git push origin master
        echo -e "${GREEN}✓ Pushed to GitHub${NC}"
    fi
else
    echo -e "${YELLOW}! GitHub remote not configured${NC}"
    echo "To add GitHub remote:"
    echo "  1. Create repository on GitHub"
    echo "  2. Run: git remote add origin https://github.com/YOUR_USERNAME/routellm-chatbot.git"
    echo "  3. Run: git push -u origin main"
fi

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
echo ""
echo -e "${YELLOW}IMPORTANT: You'll need to set environment variables:${NC}"
echo "  DEPLOYMENT_TOKEN: 2670ce30456644ddad56a334786a3a1a"
echo "  DEPLOYMENT_ID: 6a1d18f38"
echo ""

read -p "Ready to deploy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
    echo ""
    echo -e "${GREEN}✓ Deployment complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel dashboard"
    echo "2. Test your deployment URL"
    echo "3. Share with your field team"
    echo ""
else
    echo "Deployment cancelled. You can deploy manually with: vercel --prod"
fi

echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""
