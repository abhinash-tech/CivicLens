# CivicLens API Contract Specification

Base URL: `/api`
All successful responses return JSON format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```
All error responses return:
```json
{
  "success": false,
  "error": "Error code or title",
  "message": "Human-readable explanation of error",
  "details": [] // optional validation issues
}
```

---

## 1. System Health Endpoints

### GET `/api/health`
Checks backend application health.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-11-22T10:00:00.000Z",
    "uptime": 124.5
  }
}
```

### GET `/api/health/db`
Checks database connectivity.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "database": "MySQL (Aiven)"
  }
}
```
- **Response `503 Service Unavailable`**:
```json
{
  "success": false,
  "error": "DATABASE_UNAVAILABLE",
  "message": "Database ping failed"
}
```

---

## 2. Citizen Complaint Endpoints

### POST `/api/complaints`
Submits a new civic complaint with optional photo and triggers AI assessment.
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `title` (string, 5-200 chars, required)
  - `description` (string, 10-2000 chars, required)
  - `locality` (string, 2-100 chars, required)
  - `landmark` (string, optional)
  - `citizenName` (string, optional)
  - `citizenPhone` (string, optional)
  - `citizenEmail` (string, optional)
  - `image` (file binary: image/jpeg, image/png, image/webp; max 10MB; optional)
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "complaintCode": "CL-2025-9481",
    "title": "Large pothole on 4th Main Road",
    "status": "SUBMITTED",
    "locality": "Indiranagar",
    "createdAt": "2025-11-22T10:00:00.000Z",
    "imageUrl": "https://res.cloudinary.com/.../complaint.jpg",
    "aiAssessment": {
      "issueType": "Roads and Potholes",
      "severity": "High",
      "department": "Roads and Infrastructure",
      "summary": "Severe pothole approximately 1 foot deep causing traffic slowdown and hazard.",
      "riskReason": "High vehicular risk for two-wheelers especially during wet conditions.",
      "recommendedAction": "Immediate cold mix asphalt patching recommended.",
      "confidence": "High",
      "needsHumanReview": true
    }
  },
  "message": "Complaint submitted successfully."
}
```

### GET `/api/complaints/track/:code`
Allows citizens to track their complaint status using the tracking code.
- **Param**: `code` (e.g. `CL-2025-9481`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "complaintCode": "CL-2025-9481",
    "title": "Large pothole on 4th Main Road",
    "description": "Pothole near the intersection.",
    "locality": "Indiranagar",
    "landmark": "Near Metro Pillar 42",
    "imageUrl": "https://res.cloudinary.com/.../complaint.jpg",
    "issueType": "Roads and Potholes",
    "severity": "High",
    "department": "Roads and Infrastructure",
    "status": "IN_PROGRESS",
    "createdAt": "2025-11-22T10:00:00.000Z",
    "updatedAt": "2025-11-22T11:30:00.000Z",
    "aiAssessment": {
      "summary": "Severe pothole causing hazard.",
      "recommendedAction": "Immediate cold mix asphalt patching."
    },
    "timeline": [
      {
        "status": "SUBMITTED",
        "changedBy": "Citizen",
        "reason": "Complaint received",
        "timestamp": "2025-11-22T10:00:00.000Z"
      },
      {
        "status": "IN_PROGRESS",
        "changedBy": "Municipal Officer",
        "reason": "Field engineer dispatched",
        "timestamp": "2025-11-22T11:30:00.000Z"
      }
    ]
  }
}
```
- **Response `404 Not Found`**:
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "No complaint found with code CL-2025-9481"
}
```

---

## 3. Public Transparency Endpoints

### GET `/api/public/stats`
Summary analytics for the citizen transparency dashboard.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "totalComplaints": 128,
    "resolvedComplaints": 84,
    "inProgressComplaints": 31,
    "avgResolutionTimeDays": 2.4,
    "byDepartment": [
      { "department": "Roads and Infrastructure", "count": 52 },
      { "department": "Solid Waste Management", "count": 34 },
      { "department": "Water Supply & Drainage", "count": 22 },
      { "department": "Electrical & Streetlights", "count": 20 }
    ],
    "bySeverity": [
      { "severity": "Critical", "count": 14 },
      { "severity": "High", "count": 48 },
      { "severity": "Medium", "count": 50 },
      { "severity": "Low", "count": 16 }
    ]
  }
}
```

### GET `/api/public/recent?limit=10`
Recent anonymized complaints for public transparency feed.
- **Query**: `limit` (int, default 10, max 50)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "complaintCode": "CL-2025-9481",
      "title": "Large pothole on 4th Main Road",
      "locality": "Indiranagar",
      "issueType": "Roads and Potholes",
      "severity": "High",
      "status": "IN_PROGRESS",
      "imageUrl": "https://res.cloudinary.com/.../complaint.jpg",
      "createdAt": "2025-11-22T10:00:00.000Z"
    }
  ]
}
```

---

## 4. Admin Authentication and Management Endpoints

### POST `/api/admin/auth/login`
- **Body**:
```json
{
  "email": "admin@civiclens.gov",
  "password": "AdminSecureCivic2025!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "admin": {
      "id": 1,
      "email": "admin@civiclens.gov",
      "fullName": "Chief Municipal Administrator",
      "role": "admin"
    }
  }
}
```

### GET `/api/admin/complaints`
Protected endpoint (`Authorization: Bearer <token>`).
- **Query params**:
  - `status`: `SUBMITTED`, `IN_REVIEW`, `ACTION_SCHEDULED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`
  - `severity`: `Low`, `Medium`, `High`, `Critical`
  - `department`: string
  - `search`: string
  - `page`: int (default 1)
  - `limit`: int (default 20)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "complaints": [ ... ],
    "pagination": {
      "total": 128,
      "page": 1,
      "limit": 20,
      "totalPages": 7
    }
  }
}
```

### GET `/api/admin/complaints/:id`
Protected endpoint (`Authorization: Bearer <token>`).
- Full complaint details including citizen contact info, complete AI assessment breakdown, and full audit status history.

### PATCH `/api/admin/complaints/:id/status`
Protected endpoint (`Authorization: Bearer <token>`).
- **Body**:
```json
{
  "status": "IN_PROGRESS",
  "adminNotes": "Team scheduled to inspect location on Monday morning.",
  "reason": "Assigned to Ward 82 road maintenance team."
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "complaintCode": "CL-2025-9481",
    "status": "IN_PROGRESS",
    "adminNotes": "Team scheduled to inspect location on Monday morning.",
    "updatedAt": "2025-11-22T11:45:00.000Z"
  },
  "message": "Status updated successfully."
}
```
