#!/bin/bash

echo "🚀 RouteLLM Chatbot - Railway Deployment Script"
echo "================================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "npm i -g @railway/cli"
    exit 1
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial Railway deployment for RouteLLM Chatbot"
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Create or link project
echo "🔗 Setting up Railway project..."
read -p "Do you want to (1) Create new project or (2) Link existing? Enter 1 or 2: " choice

if [ "$choice" = "1" ]; then
    railway init
else
    railway link
fi

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
railway variables set ABACUS_DEPLOYMENT_ID=6a1d18f38
railway variables set NODE_ENV=production

echo ""
echo "📋 Optional environment variables (press Enter to skip):"
read -p "Enter HUGGINGFACE_API_KEY (or press Enter to skip): " hf_key
if [ ! -z "$hf_key" ]; then
    railway variables set HUGGINGFACE_API_KEY=$hf_key
fi

read -p "Enter RESEND_API_KEY (or press Enter to skip): " resend_key
if [ ! -z "$resend_key" ]; then
    railway variables set RESEND_API_KEY=$resend_key
fi

# Deploy
echo ""
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo "📊 View logs: railway logs"
echo "🌐 Open app: railway open"
echo "⚙️  View variables: railway variables"
