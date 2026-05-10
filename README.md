# EVA Platform — Extreme Value Analysis

This is a production-grade Extreme Value Analysis (EVA) platform for reliability engineering, built with Next.js, NestJS, and Python.

## System Architecture

1.  **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide, Recharts.
2.  **Backend**: NestJS (Node.js), Prisma ORM, JWT Auth, Multer (file upload).
3.  **Statistical Engine**: FastAPI (Python), SciPy, NumPy, MLE, Bootstrap.
4.  **Database**: Neon PostgreSQL (Serverless).

## How to Run

### 1. Python Statistical Engine
```bash
cd eva-engine
# Recommended: Create a venv
# python -m venv venv
# .\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*Runs at: http://localhost:8000*

### 2. NestJS Backend
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```
*Runs at: http://localhost:3001*

### 3. Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
*Runs at: http://localhost:3000*

## Project Structure

- `backend/`: API Gateway, Database logic, Orchestration.
- `frontend/`: React UI, Dashboard, Data Visualization.
- `eva-engine/`: Python-based statistical modules (MLE, Gumbel, Diagnostics).
- `uploads/`: Temporary local storage for datasets (in dev).

## Features Implemented

- [x] Multi-tenant Authentication (Register/Login).
- [x] Dataset Upload & Inventory.
- [x] Gumbel Distribution Fitting (MLE & MoM).
- [x] Bootstrap Confidence Intervals.
- [x] Anderson-Darling & KS Goodness-of-Fit Tests.
- [x] Interactive Charts & Diagnostic Reports.
- [x] Premium Dark-Themed Engineering UI.
