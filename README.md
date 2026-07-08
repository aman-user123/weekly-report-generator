# Weekly Report Generator & Team Dashboard

A full-stack web application for submitting structured weekly reports and manager analytics.

## Features

- Role-based authentication (Team Member + Manager)
- Structured weekly report submission
- Manager dashboard with filters and visual insights
- Project/Category management
- (Optional) AI Chat Assistant for team insights

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind + Recharts
- **Backend**: Python + FastAPI + SQLAlchemy + PostgreSQL
- **Auth**: JWT
- **Database**: MYSQL

## Project Structure

- `/backend` - FastAPI application
- `/frontend` - React application

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-link>
cd weekly-report-generator
```

## Backend Setup

cd backend
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Edit .env with your database credentials

alembic upgrade head
uvicorn app.main:app --reload

## Frontend setup

cd frontend
npm install
npm run dev
