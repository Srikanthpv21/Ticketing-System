🎫 Ticketing System (Help Desk / Support Portal)
A full-stack Help Desk / Ticketing System where customers can raise support tickets, agents can manage and resolve them, and admins can oversee the system with analytics.
Includes AI-powered ticket categorization and a role-based workflow.
________________________________________
🚀 Tech Stack
Backend
•	Django
•	Django REST Framework
•	JWT Authentication (SimpleJWT)
•	SQLite (dev) / PostgreSQL (production-ready)
•	OpenAI API (AI categorization)
Frontend
•	React (Vite)
•	Tailwind CSS
•	Axios
•	React Router
DevOps
•	Docker-ready architecture
•	Environment-variable driven config
________________________________________
👥 User Roles
Role	Capabilities
Customer	Create tickets, chat with agent, track status
Agent	View assigned tickets, reply, update status
Admin	View all tickets, analytics, system overview
________________________________________
🧠 Key Features
🔐 Authentication & Authorization
•	JWT-based login/logout
•	Secure role-based access
•	/auth/me/ endpoint for frontend state
🎟️ Ticket Management
•	Create tickets (customers only)
•	Auto-assign agents
•	Status workflow:
OPEN → IN_PROGRESS → RESOLVED → CLOSED
•	Priority & category support
💬 Customer–Agent Chat
•	Threaded comments per ticket
•	Internal comments hidden from customers
•	Real-time style UI (polling-based)
🤖 AI Integration
•	Automatic ticket categorization using OpenAI
•	Categories:
o	Login
o	Payment
o	Bug
o	Feature
o	Other
•	Safe fallback when API key is missing
📊 Admin Analytics
•	Total tickets
•	Open / In Progress / Resolved counts
•	Ticket overview table
•	User overview (optional extension)
