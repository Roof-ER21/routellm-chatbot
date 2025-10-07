#!/bin/bash
# Quick Railway Deployment Script
# Run this to deploy RouteLLM Chatbot to Railway

set -e

echo "============================================"
echo "Railway Quick Deployment"
echo "RouteLLM Chatbot - Next.js 15"
echo "============================================"
echo ""

cd /Users/a21/routellm-chatbot-railway

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "Error: Railway CLI not found. Install it first:"
    echo "npm i -g @railway/cli"
    exit 1
fi

# Login check
echo "Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway (browser will open)..."
    railway login
    echo ""
fi

echo "Logged in as: $(railway whoami)"
echo ""

# Initialize project if needed
if [ ! -d ".railway" ]; then
    echo "No Railway project linked. Initializing..."
    railway init
    echo ""
fi

# Set environment variables
echo "Setting environment variables..."
railway variables set DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
railway variables set ABACUS_DEPLOYMENT_ID=6a1d18f38
railway variables set NODE_ENV=production
echo ""

# Deploy
echo "Deploying to Railway..."
railway up

echo ""
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. View logs: railway logs"
echo "2. Open dashboard: railway open"
echo "3. Check status: railway status"
echo "4. Add domain: railway domain"
echo ""
