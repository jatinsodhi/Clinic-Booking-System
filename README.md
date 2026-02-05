# Event-Driven Booking System
This app is built with React JS, Node JS, and deployed on vercel and GCP(pending due to limited credits).

# Deploying to Google Cloud Run

To fix the Vercel crash, we must deploy the backend to Cloud Run (or similar) because it supports **long-running Node.js processes** and **WebSockets**, unlike Vercel Functions.

## Prerequisites
1.  Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
2.  Enable **Cloud Run API** and **Artifact Registry API** in your GCP Console.

## Step 1: Initialize GCP
Open a terminal in the root of your project:
```powershell
gcloud init
gcloud auth login
gcloud config set project [YOUR_PROJECT_ID]
```

## Step 2: Deploy Backend
Run this command to build and deploy your container automatically.
Replace `[SERVICE_NAME]` with a name like `clinic-backend`.

```powershell
gcloud run deploy clinic-backend --source . --port 3000 --allow-unauthenticated --region us-central1
```

Once finished, it will give you a **Service URL** (e.g., `https://clinic-backend-xyz.a.run.app`).
**Copy this URL.**

## Step 3: Connect Frontend
You need to tell your Vercel frontend where the new backend is.

1.  Go to your **Vercel Project Dashboard** > **Settings** > **Environment Variables**.
2.  Add a new variable:
    *   **Key**: `VITE_API_ORIGIN`
    *   **Value**: `https://clinic-backend-xyz.a.run.app` (The URL from Step 2)
3.  **Redeploy** your Vercel project (Go to Deployments > Redeploy).

## Step 4: Verify
Open your Vercel app. It should now connect to the Cloud Run backend, and the "Serverless Function has crashed" error will be gone.
