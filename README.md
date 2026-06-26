# AI Tender Preparation Checklist Generator

An enterprise-grade, luxury gold and black themed full-stack web application designed for **AVINASH KANAPARTHI INFRA PRIVATE LIMITED** to streamline tender preparation, compliance verification, and risk assessment for infrastructure projects.

---

## Key Features

1. **AI-Powered Analysis**: Evaluates tender values, client requirements, scope of work, and location to generate customized checklists.
2. **Dynamic Compliance Score**: Recalculates readiness levels and details missing mandatory documents as updates are checked or uploaded.
3. **Structured Checklist Sections**: Grouped into Technical, Commercial, Financial, and Compliance sections.
4. **Document Upload Simulation**: Verifies and archives file attachments against requirements to boost tender compliance.
5. **PDF & Excel Export**: Downloads generated checklists in professional formats with corporate branding.
6. **Executive Dashboard**: Provides global analytics, team metrics, project distributions, and immutable audit logs.

---

## Directory Structure

* `/backend`: Node/Express backend APIs, database schemas, and AI/Mock compliance logic.
* `/frontend`: Vite + React frontend styled in a Luxury Gold & Black theme using Tailwind CSS v4 and custom glassmorphism utilities.

---

## Quick Start (Local Development)

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **MongoDB** (Ensure local MongoDB service is running, defaults to `mongodb://localhost:27017/tender-checklist-generator`)
* **OpenAI API Key** (Optional. If not set in the `.env` file, the server will automatically fall back to an intelligent, construction-specific mock generator).

### Setup and Startup

1. **Install Dependencies**:
   Install root, backend, and frontend packages simultaneously:
   ```bash
   npm run install-all
   ```

2. **Configuration**:
   Review or edit `backend/.env` to configure your connection strings or OpenAI secrets:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/tender-checklist-generator
   JWT_SECRET=AVINASH_KANAPARTHI_GOLDEN_SECRET_2026
   OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
   ```

3. **Start the Application**:
   Run both servers concurrently:
   ```bash
   npm start
   ```
   * The Express API will start on: `http://localhost:5000`
   * The Vite Frontend will start on: `http://localhost:5173` (Vite will proxy API requests automatically).

---

## Quick Demo Credentials

When the database is empty, the server automatically seeds two default roles:

* **Executive Director (Admin)**:
  * **Email**: `admin@avinashinfra.com`
  * **Password**: `adminpassword`
  * *Access: Global statistics, system audit logs, user management, and exports.*

* **Bid Architect (Staff)**:
  * **Email**: `staff@avinashinfra.com`
  * **Password**: `staffpassword`
  * *Access: Checklist creation, file uploads, rating systems, and exports.*

*(You can also use the registration form to create custom accounts).*
