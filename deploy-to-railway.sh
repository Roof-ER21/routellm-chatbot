#!/bin/bash
# RouteLLM Chatbot - Railway Deployment Script
# This script handles the complete deployment process to Railway

set -e  # Exit on error

echo "======================================"
echo "Railway Deployment Script"
echo "RouteLLM Chatbot - Next.js 15"
echo "======================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Error: Railway CLI is not installed."
    echo "Install it with: npm i -g @railway/cli"
    exit 1
fi

# Step 1: Login to Railway (interactive)
echo "Step 1: Logging into Railway..."
railway whoami &> /dev/null || {
    echo "Not logged in. Please login to Railway..."
    railway login
}

# Verify login
echo "Logged in as: $(railway whoami)"
echo ""

# Step 2: Initialize or link Railway project
echo "Step 2: Setting up Railway project..."
if [ ! -d ".railway" ]; then
    echo "No Railway project found. Choose an option:"
    echo "1) Create new Railway project"
    echo "2) Link to existing project"
    read -p "Enter choice (1 or 2): " choice

    if [ "$choice" = "1" ]; then
        echo "Creating new Railway project..."
        railway init
    else
        echo "Available projects:"
        railway list
        read -p "Enter project ID to link: " project_id
        railway link "$project_id"
    fi
else
    echo "Railway project already configured."
    railway status
fi
echo ""

# Step 3: Set environment variables
echo "Step 3: Setting environment variables..."
echo "Setting DEPLOYMENT_TOKEN..."
railway variables set DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a

echo "Setting ABACUS_DEPLOYMENT_ID..."
railway variables set ABACUS_DEPLOYMENT_ID=6a1d18f38

echo "Setting NODE_ENV..."
railway variables set NODE_ENV=production

# Optional variables
read -p "Do you want to set HUGGINGFACE_API_KEY? (y/n): " set_hf
if [ "$set_hf" = "y" ]; then
    read -p "Enter HUGGINGFACE_API_KEY: " hf_key
    railway variables set HUGGINGFACE_API_KEY="$hf_key"
fi

read -p "Do you want to set RESEND_API_KEY? (y/n): " set_resend
if [ "$set_resend" = "y" ]; then
    read -p "Enter RESEND_API_KEY: " resend_key
    railway variables set RESEND_API_KEY="$resend_key"
fi

echo ""
echo "Current environment variables:"
railway variables
echo ""

# Step 4: Commit any pending changes
echo "Step 4: Checking Git status..."
if [[ -n $(git status -s) ]]; then
    echo "Warning: You have uncommitted changes."
    read -p "Commit them now? (y/n): " commit_changes
    if [ "$commit_changes" = "y" ]; then
        git add .
        git commit -m "Pre-deployment commit"
    fi
fi

# Push to origin if needed
if [[ $(git status | grep "Your branch is ahead") ]]; then
    echo "Pushing to git remote..."
    git push origin main || echo "Warning: Could not push to origin"
fi
echo ""

# Step 5: Deploy to Railway
echo "Step 5: Deploying to Railway..."
echo "Starting deployment..."
railway up

echo ""
echo "======================================"
echo "Deployment initiated!"
echo "======================================"
echo ""

# Step 6: Get deployment information
echo "Step 6: Getting deployment information..."
echo ""
echo "Project Status:"
railway status
echo ""

echo "To view logs, run: railway logs"
echo "To open dashboard, run: railway open"
echo "To add a domain, run: railway domain"
echo ""

echo "======================================"
echo "Next Steps:"
echo "======================================"
echo "1. Run 'railway logs' to monitor deployment"
echo "2. Run 'railway open' to open Railway dashboard"
echo "3. Add a custom domain with 'railway domain'"
echo "4. Get your production URL from the Railway dashboard"
echo ""
echo "Deployment script completed!"
