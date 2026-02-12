# 🎫 Ticketing System — Help Desk / Support Portal

[![Built with Django & React](https://img.shields.io/badge/Stack-Django%20%7C%20React-lightgrey.svg)](#-tech-stack) [![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)](https://deepmind.google/technologies/gemini/) [![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](#) [![Docker](https://img.shields.io/badge/Deploy-Docker-blue.svg)](#)

A **production-ready**, full-stack Help Desk / Ticketing System where customers raise support tickets, agents manage and resolve them, and admins oversee the entire system with analytics. Features AI-powered ticket categorization and comprehensive role-based workflows.

> **Capstone Project** for ClogenAI Academy — AI-Assisted Web Application Development

---

## ✨ Highlights

- ✅ **Clean role-based access**: Customer, Agent, Admin
- 🤖 **AI-powered automatic ticket categorization** (Google Gemini)
- 💬 **Threaded comments** (customer / internal agent notes)
- 🔄 **Status workflow**: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`
- 🐳 **Docker-ready** with PostgreSQL database
- 🧪 **Comprehensive test suite** (Models, API, Integration)
- 🔐 **JWT Authentication** with secure token management
- 📊 **Admin analytics dashboard**
- 🌐 **Environment-driven configuration** for production

---

## 📚 Table of Contents

- [Tech Stack](#-tech-stack)
- [User Roles](#-user-roles--capabilities)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start with Docker](#quick-start-with-docker-recommended)
  - [Local Development Setup](#local-development-setup-without-docker)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running Tests](#-running-tests)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🚀 Tech Stack

### Backend
- **Django 5.0+** — Web framework
- **Django REST Framework** — RESTful API
- **SimpleJWT** — JWT Authentication
- **PostgreSQL** — Production database
- **SQLite** — Development fallback
- **Google Gemini API** — AI categorization

### Frontend
- **React 19** — UI library
- **Vite** — Build tool & dev server
- **Tailwind CSS 4** — Styling
- **Axios** — HTTP client
- **React Router** — Navigation
- **Chart.js** — Analytics visualization

### DevOps
- **Docker & Docker Compose** — Containerization
- **PostgreSQL 15** — Database container
- **Environment variables** — Configuration management

---

## 👥 User Roles & Capabilities

| Role     | Capabilities |
|---------:|--------------|
| **Customer** | Create tickets, chat with agents, track ticket status, view ticket history |
| **Agent**    | View & reply to assigned tickets, update status, add internal notes, manage workload |
| **Admin**    | View all tickets, system analytics, user overview, manage agents |

---

## 🧠 Key Features

### 🔐 Authentication & Authorization
- JWT-based login/logout
- Secure role-based access control
- `/auth/me/` endpoint for frontend state
- Password validation & security

### 🎫 Ticket Management
- Create tickets (customers only)
- Auto-assign agents (configurable)
- Priority levels: LOW, MEDIUM, HIGH, CRITICAL
- Categories: Login, Payment, Bug, Feature, Other
- Status workflow with validation

### 💬 Customer–Agent Chat
- Threaded comments per ticket
- Internal comments (hidden from customers)
- Real-time style UI (polling-based)
- Easy to upgrade to WebSockets

### 🤖 AI Integration
- **Automatic ticket categorization** using Google Gemini
- Categories: `Login`, `Payment`, `Bug`, `Feature`, `Other`
- Safe fallback when API key is missing
- Configurable AI behavior

### 📊 Admin Analytics
- Total tickets overview
- Counts by status (Open / In Progress / Resolved / Closed)
- Ticket table with filtering
- User management overview

---

## 🛠️ Getting Started

### Prerequisites

- **Docker & Docker Compose** (recommended) OR
- **Python 3.11+** and **Node.js 20+**
- **PostgreSQL 15+** (if running locally without Docker)
- **Git**

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Srikanthpv21/Ticketing-System.git
   cd Ticketing-System
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   
   # (Optional) Add your Google Gemini API key to backend/.env
   ```

3. **Start all services with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **Admin Panel**: http://localhost:8000/admin

5. **Default test users** (created by seed command):
   - **Customer**: `customer1` / `password123`
   - **Agent**: `agent1` / `password123`
   - **Admin**: `admin1` / `password123`

### Local Development Setup (Without Docker)

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and configure your database settings
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Seed sample data**
   ```bash
   python manage.py seed_ticket_data
   ```

8. **Start development server**
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ticketing_db
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=localhost  # Use 'db' for Docker
DB_PORT=5432

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60

# Google Gemini API (for AI-powered ticket categorization)
GEMINI_API_KEY=your-gemini-api-key-here

# CORS Settings (Frontend URL)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
# React Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🗄️ Database Setup

### Using PostgreSQL (Production)

1. **Install PostgreSQL** (if not using Docker)
   ```bash
   # Windows: Download from postgresql.org
   # macOS: brew install postgresql
   # Linux: sudo apt-get install postgresql
   ```

2. **Create database**
   ```sql
   CREATE DATABASE ticketing_db;
   CREATE USER postgres WITH PASSWORD 'postgres123';
   GRANT ALL PRIVILEGES ON DATABASE ticketing_db TO postgres;
   ```

3. **Update `.env` file**
   ```env
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=ticketing_db
   DB_USER=postgres
   DB_PASSWORD=postgres123
   DB_HOST=localhost
   DB_PORT=5432
   ```

### Using SQLite (Development Fallback)

Simply leave `DB_ENGINE` unset or set to `django.db.backends.sqlite3` in `.env`:

```env
DB_ENGINE=django.db.backends.sqlite3
```

---

## 🧪 Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
python manage.py test

# Run specific app tests
python manage.py test tickets
python manage.py test users

# Run with verbose output
python manage.py test --verbosity=2

# Run with coverage (install coverage first: pip install coverage)
coverage run --source='.' manage.py test
coverage report
```

### Test Coverage

The test suite includes:
- ✅ **Model tests**: User, Ticket, Comment validations
- ✅ **API tests**: CRUD operations, permissions
- ✅ **Authentication tests**: Login, register, JWT
- ✅ **Integration tests**: Complete ticket lifecycle
- ✅ **Permission tests**: Role-based access control

---

## 🔍 API Endpoints

### Authentication
- `POST /auth/register/` — Register new user
- `POST /auth/login/` — Login (returns JWT)
- `GET /auth/me/` — Get current user info
- `POST /auth/token/refresh/` — Refresh JWT token

### Tickets
- `GET /api/tickets/` — List tickets (role-based filtering)
- `POST /api/tickets/` — Create ticket (customer only)
- `GET /api/tickets/:id/` — Get ticket details
- `PATCH /api/tickets/:id/` — Update ticket
- `DELETE /api/tickets/:id/` — Delete ticket

### Comments
- `POST /api/tickets/:id/comments/` — Add comment to ticket
- `GET /api/tickets/:id/` — Get ticket with comments

### Categories
- `GET /api/categories/` — List all categories

### Analytics (Admin only)
- `GET /api/analytics/` — Get system analytics

### Admin Panel
- `/admin/` — Django admin interface

---

## 📁 Project Structure

```
Ticketing-System/
├── backend/
│   ├── backend/
│   │   ├── settings.py          # Django settings
│   │   ├── urls.py              # Main URL configuration
│   │   └── wsgi.py              # WSGI application
│   ├── tickets/
│   │   ├── models.py            # Ticket, Comment, Category models
│   │   ├── views.py             # API views
│   │   ├── serializers.py       # DRF serializers
│   │   ├── permissions.py       # Custom permissions
│   │   ├── ai.py                # AI categorization logic
│   │   ├── tests.py             # Comprehensive tests
│   │   └── management/
│   │       └── commands/
│   │           └── seed_ticket_data.py  # Data seeding
│   ├── users/
│   │   ├── models.py            # Custom User model
│   │   ├── views.py             # Auth views
│   │   ├── serializers.py       # User serializers
│   │   └── tests.py             # User tests
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Backend Docker config
│   └── .env.example             # Environment template
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js        # Axios configuration
│   │   ├── auth/
│   │   │   ├── AuthContext.jsx  # Auth state management
│   │   │   └── ProtectedRoute.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── TicketCard.jsx
│   │   │   └── Comments.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── AgentDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── TicketChat.jsx
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── package.json             # Node dependencies
│   ├── Dockerfile               # Frontend Docker config
│   └── .env.example             # Environment template
├── docker-compose.yml           # Docker Compose configuration
└── README.md                    # This file
```

---

## 🚀 Deployment

### Docker Production Deployment

1. **Update environment variables for production**
   ```bash
   # Set DEBUG=False
   # Use strong SECRET_KEY
   # Configure proper ALLOWED_HOSTS
   # Set secure database credentials
   ```

2. **Build and run**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Collect static files**
   ```bash
   docker-compose exec backend python manage.py collectstatic --noinput
   ```

### Manual Deployment

1. **Backend (Django)**
   - Use Gunicorn or uWSGI
   - Set up Nginx as reverse proxy
   - Configure PostgreSQL
   - Set environment variables
   - Run migrations
   - Collect static files

2. **Frontend (React)**
   - Build production bundle: `npm run build`
   - Serve with Nginx or CDN
   - Update API base URL
