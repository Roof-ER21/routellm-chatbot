# Setting Up Abacus.AI Custom Deployment

## Current Issue
We need the correct deployment token to call your Susan AI-21 or Agnes models.

## How to Get Your Deployment Token

### Option 1: Via Abacus.AI Dashboard
1. Go to https://abacus.ai
2. Navigate to **Deployments**
3. Click on **Susan AI-21 Model Deployment** (ID: 6a1d18f38)
4. Look for **"Prediction API"** or **"Deployment Tokens"** tab
5. Click **"Create Deployment Token"** or copy existing token
6. Copy the deployment token (it will look different from your API key)

### Option 2: Check Deployment Details
1. In your deployment page, look for **"API"** or **"Prediction"** section
2. You should see a curl example like:
   ```
   curl -X POST "https://abacus.ai/api/predict?deploymentToken=YOUR_TOKEN&deploymentId=6a1d18f38"
   ```
3. Copy the `deploymentToken` value

## Update Your .env.local

Once you have the deployment token, update `/Users/a21/routellm-chatbot/.env.local`:

```env
# This is your regular API key (current)
ROUTELLM_API_KEY=s2_81107c9b0bc042a0804e16bee98f8a8d

# Add this new line with your deployment token
DEPLOYMENT_TOKEN=your_deployment_token_here

# Deployment ID
DEPLOYMENT_ID=6a1d18f38
```

## Alternative: Use Python SDK Method

If you have the Python SDK installed, you can also call predictions using:

```python
from abacusai import ApiClient
client = ApiClient(api_key='your_api_key')
deployment = client.describe_deployment(deployment_id='6a1d18f38')
result = deployment.predict({'messages': [{'role': 'user', 'content': 'Hello'}]})
```

## Deployment IDs Available

- **Susan AI-21**: `6a1d18f38`
- **Agnes (Field Roofer)**: `797cd309a` or `dc81d48ba`

## Next Steps

1. Get the deployment token from Abacus.AI
2. Add it to `.env.local` as `DEPLOYMENT_TOKEN`
3. I'll update the code to use the deployment token
4. Test the chatbot!
