# CivicLens 🏙️🔍
> **AI-Powered Civic Infrastructure Complaint Management Platform**  
> *Built for the IDEA//FORGE Online Hackathon*

CivicLens empowers citizens to report civic infrastructure failures (potholes, garbage dumps, broken streetlights, water leaks, traffic hazards) with photos. Powered by Google Gemini Vision AI, reports are automatically classified, prioritized by safety severity, and routed to the correct municipal departments. City administrators gain a real-time command dashboard with AI triage, while citizens can track resolution milestones with full public transparency.

---

## 🌟 Core Features

- 📸 **Citizen Reporting**: Fast mobile-first submission with photo upload, geo-locality, and instant preview.
- 🤖 **Gemini Multimodal AI Assessment**: Analyzes photos, detects hazards, predicts severity (Critical / High / Medium / Low), categorizes issue type, and suggests municipal action.
- 🔎 **Real-Time Tracking**: Unique complaint codes (e.g. `CL-2025-XXXX`) with full milestone timeline history.
- 🛡️ **Admin Command Dashboard**: JWT-authenticated municipal admin portal with multi-criteria filtering, severity badges, and status transition workflows.
- 📊 **Public Transparency Portal**: Open data analytics tracking city-wide infrastructure resolution rates, department distribution, and recent complaints.
- 🛡️ **Resilient Architecture**: Zero-downtime fallback if AI or external storage services encounter rate limits or timeouts.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Lucide React, Tailwind CSS
- **Backend**: Node.js, Express, Zod validation, JWT, Multer
- **Database**: Aiven Cloud MySQL with connection pooling & parameterized queries
- **Generative AI**: Official Google Gemini JavaScript SDK (`@google/genai`)
- **Media CDN**: Cloudinary Node SDK

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Configure
```bash
cp .env.example .env
# Edit .env with your MySQL, Gemini, and Cloudinary credentials
```

### 2. Install Dependencies
```bash
# Root
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 3. Database Migration & Seed
```bash
npm run migrate
npm run seed
```

### 4. Run Development Servers
```bash
# Start both Backend (Port 5000) and Frontend (Port 5173)
npm run dev
```

Visit `http://localhost:5173` to explore CivicLens!

---

## 🏛️ Project Structure

```
CivicLens/
├── backend/
│   ├── database/          # SQL migrations and seed scripts
│   └── src/
│       ├── config/        # Database and environment configs
│       ├── controllers/   # Complaint and admin controllers
│       ├── middleware/    # Auth, validation, rate limiting, error handling
│       ├── repositories/  # Parameterized SQL database repositories
│       ├── routes/        # Express REST API routes
│       ├── services/      # Gemini AI and Cloudinary storage services
│       ├── app.js         # Express app definition
│       └── server.js      # Server entrypoint
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/    # Reusable UI cards, badges, navbar, modals
│       ├── pages/         # Citizen report, track, transparency, admin dashboard
│       ├── services/      # API client
│       ├── App.jsx
│       └── main.jsx
├── docs/                  # Architecture, API contract, coordination board
└── tests/                 # Integration and contract test suites
```

---

## 📄 License
MIT
