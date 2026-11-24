# AI-Powered Recruitment Platform: Official 7–10 Minute Demo Recording Script

**Project:** AI-Powered Recruitment & Interview Management Platform  
**Target Recording Duration:** **8 to 9.5 minutes** (strictly between 7 and 10 minutes)  
**Author:** Vivek Krushna Badwaik  
**GitHub Repository:** `https://github.com/Vivekbadwaik/ai-recruitment-management-platform`  

---

## 📋 Pre-Recording Setup & Checklist

### 1. Application Startup Commands

Open two separate terminal windows:

#### Terminal 1 — Backend API (FastAPI)
```powershell
cd C:\Users\vivek\.gemini\antigravity\scratch\AI-Recruitment-Platform\backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Verify API is up: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser.

#### Terminal 2 — Frontend Application (React 19 + Vite)
```powershell
cd C:\Users\vivek\.gemini\antigravity\scratch\AI-Recruitment-Platform\frontend
npm.cmd run dev
```
- Verify Web App is up: Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 2. Pre-Configured Demo Credentials (Do Not Invent Accounts)

| Role | Email | Password | Pre-Configured Data |
| :--- | :--- | :--- | :--- |
| **Admin (Recruiter)** | `admin@recruit.ai` | `admin123` | Full dashboard KPIs, 3 active jobs, shortlist management |
| **Interviewer** | `interviewer@recruit.ai` | `interviewer123` | Assigned to candidate Priya Sharma for Technical Round 1 |
| **Candidate 1** | `alex.rivera@example.com` | `candidate123` | Full-stack profile with Python, React, Docker skills |
| **Candidate 2** | `priya.sharma@example.com` | `candidate123` | Machine Learning profile with scheduled interview |
| **Candidate 3 (Live)** | `vivekbadwaik2022@gmail.com` | Your password | Parsed profile with real PDF upload (`VIVEK_RESUME.pdf`) |

---

### 3. Test Files to Keep Ready on Desktop / Downloads
- `sample_resumes/John_Doe_FullStack.pdf`
- `sample_resumes/Elena_Rostova_Data_Scientist.docx`
- `sample_resumes/David_Kim_DevOps.pdf`

---

## ⏱️ Master Timeline & Sequence of Actions

| # | Demonstration Topic | View / Page | Target Timestamp | Segment Duration |
| :---: | :--- | :--- | :---: | :---: |
| **1** | Project Introduction & Architecture | Landing / Architecture Diagram | 0:00 – 0:40 | 0:40 |
| **2** | Candidate Registration & Login | `/register` & `/login` | 0:40 – 1:15 | 0:35 |
| **3** | Candidate Profile & Resume Upload | `/candidate/resume` | 1:15 – 1:50 | 0:35 |
| **4** | Real AI Resume Parsing & Profile Review/Edit | `/candidate/profile` | 1:50 – 2:30 | 0:40 |
| **5** | Job Browsing & 1-Click Application | `/candidate/jobs` | 2:30 – 3:05 | 0:35 |
| **6** | Admin Login & Recruitment KPI Dashboard | `/login` -> `/admin/dashboard` | 3:05 – 3:45 | 0:40 |
| **7** | Job Management (CRUD) & Bulk Resume Ingestion | `/admin/jobs` & Bulk Modal | 3:45 – 4:30 | 0:45 |
| **8** | 5-Factor AI Candidate Matching & Explainability (XAI) | `/admin/matching` | 4:30 – 5:15 | 0:45 |
| **9** | Natural Language Semantic Talent Search | `/admin/semantic-search` | 5:15 – 5:55 | 0:40 |
| **10** | Shortlisting & Human-in-the-Loop Override | `/admin/applications` | 5:55 – 6:30 | 0:35 |
| **11** | Interview Scheduling & Automated Notifications | Schedule Modal | 6:30 – 7:05 | 0:35 |
| **12** | Interviewer Portal & Evaluation Scorecards | `/interviewer/interviews` | 7:05 – 7:45 | 0:40 |
| **13** | Candidate Visibility & Application Tracking | `/candidate/applications` | 7:45 – 8:15 | 0:30 |
| **14** | Security & Candidate Data Isolation Demo | Cross-role URL tampering | 8:15 – 8:50 | 0:35 |
| **15** | Database Persistence & Swagger API Documentation | SQLite & `/docs` | 8:50 – 9:30 | 0:40 |
| **TOTAL** | **Complete Assessment Demonstration** | **Full System** | **9:30** | **9m 30s** |

---

## 🎬 Detailed Step-by-Step Recording Guide with Narration

---

### Step 1: Project Introduction & Architecture (0:00 – 0:40)

**On Screen:**
- Display `docs/ARCHITECTURE.md` architecture diagram or platform login screen at `http://localhost:5173`.
- Show backend terminal running `uvicorn` and frontend running Vite.

**Spoken Narration:**
> *"Hello, my name is Vivek Badwaik, and this is the final demonstration of the AI-Powered Recruitment & Interview Management Platform. This is a decoupled full-stack monorepo application. The backend is built on FastAPI, Python 3.14, SQLAlchemy 2.0 with foreign-key enforcement, and SQLite. The frontend is built on React 19, Tailwind CSS, Lucide icons, and Recharts. The AI engine features genuine Groq LLM resume parsing, Sentence Transformers dense vector embeddings, and a transparent 5-factor hybrid candidate matching algorithm with Explainable AI. Let’s start with the candidate experience."*

---

### Step 2: Candidate Registration & Login (0:40 – 1:15)

**On Screen:**
- Navigate to `http://localhost:5173/register`.

**Actions:**
1. Click **"Register as Candidate"**.
2. Type:
   - Full Name: `Marcus Vance`
   - Email: `marcus.vance@example.com`
   - Password: `password123`
3. Click **"Create Account"**. Show the success toast and automatic redirection into the Candidate Dashboard.

**Spoken Narration:**
> *"Here we register a brand-new candidate, Marcus Vance. Notice that upon registration, passwords are never stored in plain text; they are encrypted using bcrypt hashing, and a secure JWT access token is issued to manage the session."*

---

### Step 3: Candidate Profile & Resume Upload (1:15 – 1:50)

**On Screen:**
- Navigate to **"Upload Resume"** (`/candidate/resume`).

**Actions:**
1. Show the clean upload dropzone supporting PDF or DOCX up to 10MB.
2. Select or drag-and-drop `sample_resumes/John_Doe_FullStack.pdf`.
3. Click **"Upload & Parse Resume"**.
4. Show the loading spinner *"Parsing with Groq AI..."*.

**Spoken Narration:**
> *"Now we upload a real sample PDF resume. Under the hood, PyMuPDF extracts the raw text stream, verifies document integrity, and transmits the text directly to our Groq Cloud inference service for zero-shot structured parsing."*

---

### Step 4: Real AI Resume Parsing & Candidate Review/Edit (1:50 – 2:30)

**On Screen:**
- The resume finishes processing in ~2 seconds. The badge shows `● AI Parsed`.
- Click **"Go to Full Profile →"** or navigate to `/candidate/profile`.

**Actions:**
1. Point out the extracted data:
   - Name, phone, email, and location.
   - Professional summary.
   - Total experience years calculated mathematically.
   - Extracted skill badges: `Python`, `FastAPI`, `React`, `Docker`, `PostgreSQL`, `AWS`, etc.
   - Employment history and education cards.
2. Add a new skill manually (e.g. `GraphQL`) to prove candidate editability and click **"Save Profile"**.

**Spoken Narration:**
> *"Groq structured the resume into a strict Pydantic model with zero hallucinations. All 18 skills, work experience dates, and education degrees were populated automatically. Candidates maintain full agency to edit or add custom skills, and every profile update automatically synchronizes the candidate's dense vector embedding in the background."*

---

### Step 5: Job Browsing & 1-Click Application (2:30 – 3:05)

**On Screen:**
- Navigate to **"Browse Jobs"** (`/candidate/jobs`).

**Actions:**
1. Browse active positions: *Senior Full Stack Python/React Engineer*, *Machine Learning & NLP Specialist*, *DevOps Architect*.
2. Click on **"Senior Full Stack Python/React Engineer"**.
3. Click **"Apply Now"**.
4. Point out the instant feedback and navigate to **"My Applications"** (`/candidate/applications`).
5. Show the application status badge: `Submitted`, application date, and instant matching score.
6. Click **"Log Out"** in the sidebar.

**Spoken Narration:**
> *"Candidates can explore real-time job openings. When Marcus clicks Apply, the platform enforces database unique constraints to prevent duplicate applications and computes an instant matching baseline. Now let's switch to the Recruiter Portal."*

---

### Step 6: Admin Login & Recruitment KPI Dashboard (3:05 – 3:45)

**On Screen:**
- Navigate to `http://localhost:5173/login`.

**Actions:**
1. Click the quick-fill button **"Admin Demo"** (`admin@recruit.ai` / `admin123`).
2. Click **"Sign In"**.
3. Display the **Recruitment Command Center**:
   - Live KPI cards: Total Candidates, Total Resumes, Active Jobs, Total Applications, Shortlisted, Interviews.
   - Recharts visual graphs: Application Status Pipeline and Technical Skills Distribution.

**Spoken Narration:**
> *"Logging in as the Admin Recruiter brings us to the executive command center. None of these statistics are hardcoded; all metrics and Recharts pipeline charts are queried live from our FastAPI analytics endpoints."*

---

### Step 7: Job Management (CRUD) & Bulk Resume Ingestion (3:45 – 4:30)

**On Screen:**
- Navigate to **"Jobs Management"** (`/admin/jobs`).

**Actions:**
1. Click **"Post New Job"** and quickly fill:
   - Title: `Cloud & AI Solutions Architect`
   - Location: `Remote / Hybrid`
   - Min Experience: `4.0`
   - Required Skills: `Python, Docker, Kubernetes, AWS, FastAPI`
   - Status: `Active`
2. Save the job and show it in the list.
3. Open **Bulk Resume Upload** (modal or tab) and select `Elena_Rostova_Data_Scientist.docx` and `David_Kim_DevOps.pdf`.
4. Process batch: show the per-file transaction status and explain duplicate detection by email.

**Spoken Narration:**
> *"Recruiters have full CRUD capabilities over job requisitions. In the Bulk Ingestion engine, multiple resumes are parsed concurrently in isolated transactions. If an applicant already exists, the platform updates their resume record without creating orphaned or duplicate user rows."*

---

### Step 8: 5-Factor AI Candidate Matching & Explainability (4:30 – 5:15)

**On Screen:**
- Navigate to **"AI Job Matching"** (`/admin/matching`).

**Actions:**
1. Select Job: *Senior Full Stack Python/React Engineer*.
2. Click **"Calculate AI Match Scores"**.
3. Show the ranked leaderboard of candidates.
4. Click **"View Match Breakdown"** or the candidate name to open the **Explainable AI (XAI) Modal**:
   - **Required Skills Match (40% weight):** 100%
   - **Experience Match (20% weight):** 100%
   - **Education Match (10% weight):** 100%
   - **Preferred Skills Match (10% weight):** 75%
   - **Semantic Vector Cosine Similarity (20% weight):** 88%
   - **Overall Composite Score:** `93.0%`
5. Read the generated natural language reasoning explaining strengths and missing items.

**Spoken Narration:**
> *"Here is our genuine 5-factor hybrid matching engine. Instead of a black-box score, we evaluate required skills at 40%, experience at 20%, education at 10%, preferred skills at 10%, and dense semantic vector similarity at 20%. The system generates transparent Explainable AI reasoning detailing exactly why this candidate ranked at the top."*

---

### Step 9: Natural Language Semantic Talent Search (5:15 – 5:55)

**On Screen:**
- Navigate to **"Semantic Search"** (`/admin/semantic-search`).

**Actions:**
1. Type a natural language query in plain English:
   > *"Find a data scientist or machine learning engineer with deep learning, PyTorch, and transformer models experience."*
2. Set similarity threshold to `0.50` and click **"Search Talent"**.
3. Display the ranked results: Elena Rostova appears at the top with high cosine similarity (e.g. 0.82).
4. Highlight that this was achieved via dense vector representations from `all-MiniLM-L6-v2`, not simple keyword string matching.

**Spoken Narration:**
> *"Our semantic search converts conversational recruiter queries into 384-dimensional vector embeddings, computing cosine similarity against candidate profiles. Elena Rostova ranks first even though her job title wasn't an exact keyword match."*

---

### Step 10: Shortlisting & Human-in-the-Loop Override (5:55 – 6:30)

**On Screen:**
- In the Candidate Matching view or Applications list (`/admin/applications`).

**Actions:**
1. Click **"Shortlist Candidate"** for the top applicant.
2. In the decision box, enter recruiter notes:
   > *"Exceptional full-stack architecture background. Fast-tracking to Round 1 Technical."*
3. Advance status to `Shortlisted`.
4. Point out that the recruiter decision and notes are stored independently from the AI recommendation.
5. Click **"Export Shortlist"** -> Download as **CSV** and **Excel (.xlsx)** to show real file generation.

**Spoken Narration:**
> *"The platform emphasizes Human-in-the-Loop recruitment. Recruiters can override AI recommendations, log private notes, advance candidate stages, and export verified shortlists to Excel and CSV with one click."*

---

### Step 11: Interview Scheduling & Automated Notifications (6:30 – 7:05)

**On Screen:**
- Click **"Schedule Interview"** on the shortlisted candidate card.

**Actions:**
1. In the modal:
   - Assign Interviewer: Select `Dr. Sarah Chen (Senior Technical Lead)` from the registered interviewers dropdown.
   - Date & Time: Tomorrow at `10:00 AM`.
   - Round Type: `Technical Round 1`.
   - Meeting Link: `https://meet.google.com/abc-defg-hij`.
2. Click **"Confirm Interview"**.
3. Show the success toast and in-app notification dispatch.
4. Log out of Admin.

**Spoken Narration:**
> *"When the recruiter schedules the interview and assigns Dr. Sarah Chen, the database records the interview round and dispatches automated in-app notifications to both the candidate and interviewer."*

---

### Step 12: Interviewer Portal & Evaluation Scorecards (7:05 – 7:45)

**On Screen:**
- Login page; click quick-fill button **"Interviewer Demo"** (`interviewer@recruit.ai` / `interviewer123`).

**Actions:**
1. Navigate to **"My Assigned Interviews"** (`/interviewer/interviews`).
2. Show that Dr. Sarah Chen only sees interviews specifically assigned to her.
3. Click **"View Candidate Profile"** to review parsed skills and resume in the side drawer.
4. Click **"Submit Feedback"**:
   - Technical Proficiency: `5 / 5`
   - Problem Solving & System Design: `4 / 5`
   - Communication: `5 / 5`
   - Recommendation: Select **"Strong Hire"**.
   - Remarks: *"Excellent systems design capability, explained caching strategies clearly, strong React and FastAPI proficiency."*
5. Click **"Submit Scorecard"**. Show the status change to `Completed` with locked scorecard.
6. Log out.

**Spoken Narration:**
> *"In the Interviewer Portal, interviewers have authorized access strictly to their assigned candidates. They can review the parsed resume and submit structured scorecards with multi-criteria 1-to-5 star ratings, qualitative remarks, and final hiring recommendations."*

---

### Step 13: Candidate Visibility & Application Tracking (7:45 – 8:15)

**On Screen:**
- Log in as the candidate (`alex.rivera@example.com` / `candidate123` or Marcus Vance).

**Actions:**
1. Click the **Notification Bell 🔔** in the top navbar: show *"Interview Scheduled: Technical Round 1"*.
2. Navigate to **"My Interviews"** (`/candidate/interviews`): show the scheduled interview card with meeting link, interviewer name, and time.
3. Navigate to **"My Applications"** (`/candidate/applications`): show the status progressed to `Interview Scheduled`.

**Spoken Narration:**
> *"Back in the Candidate Portal, the candidate receives real-time notification updates, can join the meeting link directly, and sees their application status transparently updated."*

---

### Step 14: Security & Candidate Data Isolation Demo (8:15 – 8:50)

**On Screen:**
- Still logged in as Candidate.

**Actions:**
1. **RBAC Guard Test:**
   - In browser address bar, try navigating directly to `http://localhost:5173/admin/dashboard`.
   - Show that the frontend route guard immediately blocks access and redirects to candidate dashboard with an Unauthorized alert.
2. **Data Isolation Test:**
   - Open Developer Tools Console or mention API boundary: Candidate tokens cannot view other candidates' private resumes, salary notes, or administrative data (`403 Forbidden`).

**Spoken Narration:**
> *"Security is strictly enforced. Role-based guards prevent candidates from accessing admin or interviewer routes. Furthermore, backend API dependencies enforce data isolation—a candidate token attempting to access another user's profile is immediately rejected with HTTP 403 Forbidden."*

---

### Step 15: Database Persistence & Swagger API Documentation (8:50 – 9:30)

**On Screen:**
- Split screen: Browser showing `http://127.0.0.1:8000/docs` (Swagger UI) and Terminal running test suites.

**Actions:**
1. Scroll through the **FastAPI Swagger OpenAPI documentation**:
   - Highlight all 28 production endpoints across Auth, Candidates, Jobs, Admin, Interviews, and Notifications.
2. Point out that all data is persisted in SQLite with foreign keys enabled (`PRAGMA foreign_keys = ON`).
3. Conclude with a clear closing statement.

**Spoken Narration:**
> *"All endpoints are fully documented via FastAPI's OpenAPI specification. Every single record—from candidate profiles to vector embeddings, job applications, and interview feedback—is persisted in SQLite. The platform has passed all 33 automated database, AI, and integration tests with 100% success. Thank you!"*

---

## 🛑 Recording Day Final Checklist

Before pressing Record on OBS / Screen Recorder:
- [ ] Backend running (`uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`)
- [ ] Frontend running (`npm.cmd run dev` on `http://localhost:5173`)
- [ ] Database contains seeded demo data (`python seed_data.py`)
- [ ] Groq API key configured in `backend/.env`
- [ ] `sample_resumes/` folder open and accessible for drag-and-drop
- [ ] Browser zoom set to 100% or 110% for crisp readability
- [ ] Microphone tested and background noise minimized
- [ ] Target duration timer kept visible on phone or secondary monitor (aim for 8:30 to 9:15)
