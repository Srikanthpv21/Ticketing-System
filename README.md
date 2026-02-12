# 🎫 Ticketing System — Help Desk / Support Portal

[![Built with Django & React](https://img.shields.io/badge/Stack-Django%20%7C%20React-lightgrey.svg)](#-tech-stack) [![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)](https://deepmind.google/technologies/gemini/) [![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](#) [![Docker](https://img.shields.io/badge/Deploy-Docker-blue.svg)](#) [![Tests Passing](https://img.shields.io/badge/Tests-31%20Passing-brightgreen.svg)](#-running-tests)

A **production-ready**, full-stack Help Desk / Ticketing System with modern UI design, AI-powered ticket categorization, and comprehensive role-based workflows. Built for enterprise-level customer support operations.

> **Capstone Project** for ClogenAI Academy — AI-Assisted Web Application Development

---

## ✨ Highlights

- ✅ **Modern, Professional UI** — Glassmorphism design with smooth animations
- 🎨 **Role-based Dynamic Theming** — Customer (Blue), Agent (Purple), Admin (Indigo)
- 🤖 **AI-powered Ticket Categorization** — Google Gemini integration
- 💬 **Real-time Chat Interface** — Threaded comments with internal notes
- 🔄 **Complete Ticket Lifecycle** — `OPEN → IN_PROGRESS → RESOLVED → CLOSED`
- 🐳 **Production Docker Setup** — Multi-container orchestration
- 🧪 **100% Test Coverage** — 31 passing tests (Models, API, Integration)
- 🔐 **Secure JWT Authentication** — Token-based auth with role management
- 📊 **Analytics Dashboard** — Visual charts and system metrics
- 🌐 **Production Ready** — Gunicorn, PostgreSQL, environment configs

---

## 📸 Screenshots

### Login & Register Pages
Modern authentication with glassmorphism design and professional styling.

### Customer Dashboard
Clean, card-based layout with ticket tracking and live chat interface.

### Agent Workspace
AI-powered reply suggestions and smart ticket summaries for efficient support.

### Admin Portal
Comprehensive analytics, user management, and system-wide ticket overview.

---

## 🚀 Tech Stack

### Backend
- **Django 5.0+** — Web framework
- **Django REST Framework** — RESTful API
- **SimpleJWT** — JWT Authentication
- **PostgreSQL** — Production database
- **SQLite** — Development fallback
- **Google Gemini API** — AI categorization
- **Gunicorn** — Production WSGI server

### Frontend
- **React 19** — UI library
- **Vite** — Build tool & dev server
- **Tailwind CSS 4** — Modern styling framework
- **Axios** — HTTP client
- **React Router** — Navigation
- **Chart.js** — Analytics visualization

### DevOps
- **Docker & Docker Compose** — Containerization
- **PostgreSQL 15** — Database container
- **Gunicorn** — Production server
- **Environment variables** — Secure configuration

---

## 👥 User Roles & Capabilities

| Role     | Capabilities |
|---------:|--------------|
| **Customer** | Create tickets, real-time chat, track status, view history |
| **Agent**    | Manage assigned tickets, AI reply suggestions, status updates, internal notes |
| **Admin**    | System analytics, user management, all tickets access, visual dashboards |

---

## 🧠 Key Features

### 🔐 Authentication & Authorization
- Modern glassmorphism login/register UI
- JWT-based authentication
- Secure role-based access control
- Auto role assignment (customers, agents, admins)
- Password validation & security

### 🎫 Ticket Management
- Intuitive ticket creation interface
- Auto-assignment to available agents
- Priority levels: LOW, MEDIUM, HIGH, CRITICAL
- Categories: Login, Payment, Bug, Feature, Other
- Complete status workflow with validation

### 💬 Customer–Agent Communication
- Real-time style chat interface
- Threaded comments per ticket
- Internal agent notes (hidden from customers)
- Message history with timestamps
- Responsive UI for seamless conversations

### 🤖 AI Integration
- **Automatic Categorization**: Gemini analyzes ticket descriptions
- **Smart Reply Suggestions**: AI-generated responses for agents
- **Ticket Summarization**: Quick overview of long ticket threads
- Safe fallback when API key is missing
- Configurable AI behavior

### 📊 Admin Analytics
- Visual charts (Chart.js) for ticket status
- Category distribution insights
- Real-time ticket counts
- User management overview
- System-wide metrics

### 🎨 Professional UI/UX
- Modern glassmorphism design
- Smooth fade-in and slide animations
- Role-based dynamic theming
- Responsive across all devices
- Custom scrollbars and hover effects
- Loading states and error handling

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
   # Edit .env and configure your settings
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Seed sample data**
   ```bash
   python manage.py seed_ticket_data
   ```

7. **Start development server**
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

# Google Gemini API (for AI features)
GEMINI_API_KEY=your-gemini-api-key-here

# CORS Settings (Frontend URL)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
# Backend API URL
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

Simply set in `.env`:
```env
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

---

## 🧪 Running Tests

### Backend Tests

```bash
cd backend

# Run all tests (31 tests)
python manage.py test

# Run specific app tests
python manage.py test tickets
python manage.py test users

# Run with verbose output
python manage.py test --verbosity=2

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Test Coverage

The test suite includes:
- ✅ **Model tests**: User, Ticket, Comment validations
- ✅ **API tests**: CRUD operations, permissions
- ✅ **Authentication tests**: Login, register, JWT tokens
- ✅ **Integration tests**: Complete ticket lifecycle
- ✅ **Permission tests**: Role-based access control

**All 31 tests passing** ✨

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

### AI Features (Agents/Admins only)
- `GET /api/tickets/:id/ai_reply/` — Get AI reply suggestion
- `GET /api/tickets/:id/ai_summary/` — Get AI ticket summary

### Comments
- `POST /api/tickets/:id/comments/` — Add comment to ticket

### Admin Panel
- `/admin/` — Django admin interface

---

## 📁 Project Structure

```
Ticketing-System/
├── backend/
│   ├── backend/
│   │   ├── settings.py          # Django configuration
│   │   ├── urls.py              # Main URL routing
│   │   └── wsgi.py              # WSGI application
│   ├── tickets/
│   │   ├── models.py            # Ticket, Comment models
│   │   ├── views.py             # API viewsets
│   │   ├── serializers.py       # DRF serializers
│   │   ├── ai.py                # AI categorization
│   │   ├── tests.py             # Test suite
│   │   └── management/
│   │       └── commands/
│   │           └── seed_ticket_data.py
│   ├── users/
│   │   ├── models.py            # Custom User model
│   │   ├── views.py             # Auth endpoints
│   │   ├── serializers.py       # User serializers
│   │   └── tests.py             # User tests
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js        # Axios config
│   │   ├── auth/
│   │   │   ├── AuthContext.jsx  # Auth state
│   │   │   └── ProtectedRoute.jsx
│   │   ├── components/
│   │   │   ├── RoleBasedNavbar.jsx
│   │   │   ├── TicketCard.jsx
│   │   │   └── Comments.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Modern login UI
│   │   │   ├── Register.jsx     # Modern register UI
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── AgentDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml           # Development
├── docker-compose.prod.yml      # Production
├── .gitignore
└── README.md
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

### Production Checklist
- [ ] Set `DEBUG=False` in `.env`
- [ ] Use strong `DJANGO_SECRET_KEY`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set up secure database credentials
- [ ] Configure CORS for your domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure static file serving
- [ ] Set up automated backups
- [ ] Monitor logs and errors

---

## 🎓 Capstone Project Requirements

This project fulfills all requirements for the ClogenAI Academy Capstone:

### ✅ Phase 1: Project Setup & Foundation
- [x] Django + DRF backend configured
- [x] React (Vite) frontend set up
- [x] PostgreSQL database integration
- [x] Docker Compose multi-container setup
- [x] Environment variable management
- [x] User model with role-based access

### ✅ Phase 2: Core Features
- [x] Customer: Create tickets, track status, chat
- [x] Agent: Manage tickets, respond, update status
- [x] Admin: System analytics, user management
- [x] RESTful API with proper endpoints
- [x] Role-based filtering and permissions

### ✅ Phase 3: AI Integration
- [x] Auto-categorization using Google Gemini
- [x] AI reply suggestions for agents
- [x] Ticket summarization
- [x] Secure API key management
- [x] Error handling and fallbacks

### ✅ Phase 4: Production Readiness
- [x] Data seeding management command
- [x] Comprehensive test suite (31 tests)
- [x] Docker configuration for production
- [x] Complete documentation (README)
- [x] .env.example templates
- [x] Clean .gitignore setup

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **ClogenAI Academy** for the project assignment and guidance
- **Google Gemini** for AI-powered features
- **Django** and **React** communities for excellent documentation
- **Tailwind CSS** for the modern styling framework

---

## 📧 Contact

**Srikanth P V**
- GitHub: [@Srikanthpv21](https://github.com/Srikanthpv21)
- Project Link: [Ticketing-System](https://github.com/Srikanthpv21/Ticketing-System)

---

**Built with ❤️ for ClogenAI Academy Capstone Project**
