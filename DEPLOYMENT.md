# CivicLens Production Deployment Guide

CivicLens can be deployed to live URLs in two ways:
1. **Option 1 (Recommended - Single Unified Live URL)**: Deploy both frontend and backend on **Render** (or Railway) with a single live URL (`https://civiclens.onrender.com`).
2. **Option 2 (Multi-Tier)**: Deploy the Frontend on **Vercel** (`https://civiclens.vercel.app`) and the Backend API on **Render** (`https://civiclens-api.onrender.com`).

---

## Prerequisites (Live Services)
- **Database**: Aiven Cloud MySQL is already live and connected!
- **AI Triage**: Google Gemini API key configured.
- **Image Storage**: Cloudinary credentials configured (with resilient local fallback).

---

## Step 1: Push Code to GitHub

1. If you haven't created a GitHub repository yet, go to [github.com/new](https://github.com/new) and create a repository named `CivicLens`.
2. Connect your local repository and push:
   ```bash
   git remote add origin https://github.com/<your-username>/CivicLens.git
   git branch -M master
   git push -u origin master
   ```

---

## Option 1: One-Click Unified Deployment (Render)

Deploying as a single web service gives you a single live domain, zero CORS complications, and automatic SPA routing.

1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your `CivicLens` GitHub repository.
3. Select **Node** environment:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Set the following **Environment Variables** under the Environment tab:
   ```env
   NODE_ENV=production
   PORT=10000
   DB_HOST=civiclens-jangapallyabhinash-8654.a.aivencloud.com
   DB_PORT=19631
   DB_USER=avnadmin
   DB_PASSWORD=your_aiven_mysql_password
   DB_NAME=civiclens
   DB_SSL=true
   JWT_SECRET=your_secure_jwt_secret_random_string_here
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@civiclens.gov
   ADMIN_PASSWORD=AdminSecureCivic2025!
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.8-flash
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
5. Click **Create Web Service**.
6. Render builds the Vite frontend, links it to Express, and serves the entire platform at your live URL: `https://<your-service>.onrender.com`.

---

## Option 2: Multi-Tier Deployment (Vercel + Render)

### A. Deploy Backend API to Render
1. Create a **Web Service** on Render pointing to your GitHub repo.
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node src/server.js`
5. Configure the environment variables (same as above, plus `CLIENT_ORIGIN=https://<your-vercel-app>.vercel.app`).
6. Copy the live API URL: `https://civiclens-api.onrender.com`.

### B. Deploy Frontend to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import your `CivicLens` repository.
2. Select **Root Directory**: `frontend`.
3. Framework Preset: `Vite`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://civiclens-api.onrender.com/api`
5. Click **Deploy**. Vercel will build and launch your frontend at `https://civiclens.vercel.app`.

---

## Step 2: Verify Your Live Deployment

1. **System Health Check**:
   - `GET https://<live-url>/api/health`
   - Should return `{ "success": true, "status": "UP" }`.
2. **Database Connectivity**:
   - `GET https://<live-url>/api/health/db`
   - Should return `{ "success": true, "database": "CONNECTED" }`.
3. **Public Citizen Portal**:
   - Visit `https://<live-url>/` in your browser.
   - Test filing a civic report with photo at `/report`.
   - Inspect the AI triage assessment card and live progress timeline.
4. **Administrator Portal**:
   - Visit `https://<live-url>/admin/login`.
   - Login with `admin@civiclens.gov` / `AdminSecureCivic2025!`.
   - Manage complaint status transitions and audit notes.
