# CivicLens Deployment Guide

This guide provides step-by-step instructions for deploying CivicLens to production using:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Aiven Cloud MySQL
- **AI**: Google Gemini API
- **Image Storage**: Cloudinary

---

## 1. Database Setup (Aiven Cloud MySQL)

1. Create a MySQL service in your [Aiven Console](https://console.aiven.io/).
2. Under **Overview**, locate:
   - Host (`DB_HOST`)
   - Port (`DB_PORT`, typically `25060` or similar)
   - User (`DB_USER`, default `avnadmin`)
   - Password (`DB_PASSWORD`)
   - Database name (`DB_NAME`, create `civiclens` or use default `defaultdb`)
3. Download the CA Certificate if required (`ca.pem`), or configure SSL with `DB_SSL=true`.
4. Run migrations from your local or build machine:
   ```bash
   node backend/database/run-migrations.js
   node backend/database/seed.js
   ```

---

## 2. Backend Deployment (Render)

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your Git repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Add the following Environment Variables in the Render dashboard:
   ```env
   PORT=10000
   NODE_ENV=production
   CLIENT_ORIGIN=https://your-civiclens-app.vercel.app
   DB_HOST=your-aiven-mysql.aivencloud.com
   DB_PORT=25060
   DB_USER=avnadmin
   DB_PASSWORD=your_db_password
   DB_NAME=civiclens
   DB_SSL=true
   JWT_SECRET=production_random_jwt_secret_64_characters_long
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@civiclens.gov
   ADMIN_PASSWORD=YourStrongAdminPassword123!
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.8-flash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
5. Deploy the service and copy the backend URL (e.g. `https://civiclens-backend.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

1. Import your Git repository into [Vercel](https://vercel.com/).
2. Set **Root Directory** to `frontend`.
3. Framework Preset will auto-detect as `Vite`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://civiclens-backend.onrender.com/api`
5. Ensure SPA rewrites are in `vercel.json` in `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
6. Deploy and access your live application!

---

## 4. Verification Check After Deployment

- Verify health: `GET https://civiclens-backend.onrender.com/api/health`
- Verify DB health: `GET https://civiclens-backend.onrender.com/api/health/db`
- Test citizen complaint submission with photo on the Vercel frontend.
- Login to `/admin/login` on the Vercel frontend using your configured admin credentials.
