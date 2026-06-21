# EVA System Architecture

## Overview

A production-grade Extreme Value Analysis (EVA) platform for reliability engineering, implementing PVP2006/ASTM E2283 methodology for corrosion data analysis.

## System Components

### 1. Frontend (Next.js 15)
**Location**: `frontend/`

- **Framework**: Next.js 15 (App Router), Tailwind CSS, Recharts
- **Routes**:
  - `/` - Landing page
  - `/login` - Authentication
  - `/register` - User registration
  - `/dashboard` - Main application
    - `/dashboard/datasets` - Dataset upload and management
    - `/dashboard/analysis` - EVA runs list
    - `/dashboard/analysis/[id]` - Results view with charts
    - `/dashboard/analysis/[id]/report` - PDF report generation
- **API Client**: `lib/api.ts` - Axios instance with JWT interceptor

### 2. Backend (NestJS)
**Location**: `backend/`

- **Framework**: NestJS with Prisma ORM
- **Global Prefix**: `/api/v1`
- **Modules**:
  - `auth/` - Registration, login, JWT authentication
  - `users/` - User profile management
  - `datasets/` - File upload (Multer), CSV/TXT parsing, storage
  - `eva/` - EVA analysis orchestration
  - `assets/` - Asset management
  - `reports/` - Report generation

**Key Endpoints**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | JWT login |
| GET | `/auth/profile` | Get user profile |
| POST | `/datasets/upload` | Upload CSV/TXT/XLSX |
| GET | `/datasets` | List user datasets |
| POST | `/eva/run` | Execute EVA analysis |
| GET | `/eva/:id/results` | Get analysis results |
| GET | `/eva/my-runs` | List user's runs |

### 3. Statistical Engine (FastAPI/Python)
**Location**: `eva-engine/`

- **Framework**: FastAPI
- **Port**: 8000
- **Endpoints**:
  - `POST /analyze` - Run EVA analysis
  - `GET /health` - Health check

**Pipeline (PVP2006)**:
1. Preprocess data (sort ascending, validate)
2. MLE or MoM parameter estimation
3. Return levels x_N for each population size N
4. Analytical confidence intervals (Eq. 15-16)
5. Anderson-Darling & KS goodness-of-fit tests
6. Plot data generation

## Database Schema (PostgreSQL)

| Model | Fields |
|-------|--------|
| User | id, tenantId, email, password, firstName, lastName, role |
| Tenant | id, name, slug |
| Asset | id, tenantId, name, location, material, designThickness |
| Dataset | id, tenantId, userId, name, filePath, rowCount, status |
| EvaRun | id, datasetId, userId, method, confidenceLevel, mu, beta, status, result, timestamps |
| ReturnLevel | id, evaRunId, returnPeriod, predictedValue, ciLower, ciUpper, allConfidences |

## Data Flow

```
1. User uploads CSV/TXT dataset → /datasets/upload
2. Backend stores file in ./uploads/ and records in Dataset table
3. User triggers EVA analysis → /eva/run
4. Backend loads data, converts to wall loss if originalThickness provided
5. Backend calls Python engine → http://localhost:8000/analyze
6. Engine fits Gumbel distribution, computes return levels, CI, GoF tests
7. Backend stores EvaRun + ReturnLevel records in database
8. Frontend fetches results → /eva/:id/results
9. Results displayed with charts (Recharts) and tables
```

## EVA Methodology (PVP2006)

### Parameters
- **μ (mu)**: Location parameter
- **β (beta)**: Scale parameter
- **ξ (xi)**: Shape parameter (NULL for Gumbel)

### Confidence Intervals
- Uses analytical SE formula (Eq. 15-16)
- Student's t-test for CI bounds
- Lower bound (x_N - t·SE) is conservative estimate for integrity

### Return Levels
Default periods: 2, 5, 10, 25, 50, 100 years
Confidence levels: 99%, 95%, 90%, 80%

### Wall Loss Conversion
If `originalThickness` is provided, observed thickness values are converted to wall loss:
```
wall_loss = max(0, originalThickness - observed_thickness)
```

### End-of-Life Calculation
- **With serviceStartDate**: `EOL = startDate + ((originalThickness - minRequired) / corrosionRate) * 365.25 days`
- **With inspectionDate only**: `EOL = inspectionDate + ((remainingThickness - minRequired) / corrosionRate) * 365.25 days`

## Authentication

- JWT-based authentication
- Multi-tenant support (users belong to tenants)
- Roles: ADMIN, ENGINEER, VIEWER

## File Structure

```
EVA-generator/
├── backend/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── datasets/
│   │   │   ├── eva/
│   │   │   └── assets/
│   │   ├── prisma/
│   │   └── common/
│   └── prisma/
│       └── schema.prisma
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── register/
│   └── lib/
├── eva-engine/
│   ├── main.py
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── statistics/
│   │   └── models/
│   └── requirements.txt
└── uploads/
```

## Running the System

```bash
# 1. Python Engine
cd eva-engine
pip install -r requirements.txt
python main.py

# 2. Backend
cd backend
npm install
npx prisma generate
npm run start:dev

# 3. Frontend
cd frontend
npm install
npm run dev
```