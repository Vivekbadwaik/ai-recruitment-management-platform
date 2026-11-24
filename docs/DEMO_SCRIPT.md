# AI Recruitment Platform: 7–10 Minute Assessment Demonstration Script

This script provides an exact, step-by-step roadmap for recording or presenting the live technical demonstration of the **AI-Powered Recruitment & Interview Management Platform**.

---

## ⏱️ Demonstration Timeline Overview

| Section | Topic | Portal / View | Target Time | Cumulative |
| :---: | :--- | :--- | :---: | :---: |
| **1** | Introduction & Architectural Overview | Architecture Diagram | 0:45 | 0:45 |
| **2** | Candidate Registration & Live AI Resume Parsing | Candidate Portal | 1:15 | 2:00 |
| **3** | Job Discovery, 1-Click Apply & Instant AI Matching | Candidate Portal | 1:00 | 3:00 |
| **4** | Admin Recruitment Command Center & Job Management | Admin Portal | 1:15 | 4:15 |
| **5** | Bulk Resume Ingestion & Duplicate Detection | Admin Portal | 1:00 | 5:15 |
| **6** | Semantic Talent Search & 5-Factor Hybrid AI Matching | Admin Portal | 1:30 | 6:45 |
| **7** | Human-in-the-Loop Shortlisting & Interview Scheduling | Admin Portal | 1:00 | 7:45 |
| **8** | Interviewer Scorecards & Evaluation Feedback | Interviewer Portal | 1:00 | 8:45 |
| **9** | Security, RBAC Enforcement & Candidate Data Isolation | Cross-Role Test | 0:45 | 9:30 |
| **10** | Conclusion, OpenAPI Docs & Test Suite Proof | Terminal & Swagger | 0:30 | 10:00 |

---

## Section 1: Introduction & Architectural Overview (0:00 – 0:45)

### Screen Setup:
- Display the platform landing screen at `http://localhost:5173` or `docs/ARCHITECTURE.md` flowchart.
- Terminal showing FastAPI backend running on `http://127.0.0.1:8000`.

### Narration / Actions:
> *"Hello, and welcome to the technical demonstration of our AI-Powered Recruitment & Interview Management Platform. This enterprise-grade SaaS system is built on a modern full-stack decoupled architecture:*
> *- **Backend:** High-performance Python FastAPI service with SQLite, SQLAlchemy 2.0 relational models, foreign-key enforcement, and JWT authentication.*
> *- **AI / ML Engine:** Genuine integration with the Groq API (powered by Llama 3.3 70B) for zero-shot structured resume parsing, Sentence Transformers (`all-MiniLM-L6-v2`) for dense candidate vector embeddings, and a transparent 5-factor hybrid matching algorithm with Explainable AI.*
> *- **Frontend:** React 19 single-page application with Tailwind CSS, Lucide icons, responsive tables, real-time KPI dashboards, and 3 independent role-based portals.*
> *Let's begin by demonstrating the Candidate workflow."*

---

## Section 2: Candidate Registration & Live AI Resume Parsing (0:45 – 2:00)

### Screen Setup:
- Navigate to `http://localhost:5173/register`.

### Steps & Actions:
1. **Registration:**
   - Click **"Register as Candidate"**.
   - Input:
     - Name: `Marcus Vance`
     - Email: `marcus.vance@example.com`
     - Password: `password123`
   - Click **"Create Account"**. Show instant toast notification and redirect to Candidate Dashboard.
2. **Inspect Blank Profile:**
   - Navigate to the **Profile** tab (`/candidate/profile`).
   - Point out that the profile starts empty with zero skills and zero years of experience.
3. **Upload PDF Resume:**
   - Click the file upload box or drag-and-drop `sample_resumes/John_Doe_FullStack.pdf` (or your preferred test resume).
   - Click **"Upload & Parse with AI"**.
   - Note the real-time loading spinner indicating PDF text extraction (PyMuPDF) and Groq LLM parsing.
4. **Highlight Parsed Fields:**
   - Show how the candidate profile automatically populates:
     - Full Name, Phone, Location
     - Professional Headline & Summary
     - Total Experience: `5.0 years`
     - Interactive skill badges: `Python`, `FastAPI`, `React`, `Docker`, `PostgreSQL`, `AWS`, etc.
     - Work History with company names, roles, dates, and responsibilities.
     - Education details with degree, field, and university.
   - Point out the **"AI Parsed"** verification badge and demonstrate that the candidate can edit or add custom skills manually.

---

## Section 3: Job Discovery, 1-Click Apply & Instant AI Matching (2:00 – 3:00)

### Screen Setup:
- Candidate logged in; navigate to **"Browse Jobs"** (`/candidate/jobs`).

### Steps & Actions:
1. **Explore Available Positions:**
   - Show the active job listings:
     - *Senior Full-Stack Engineer* (Python, React, Docker)
     - *Machine Learning Engineer* (Python, PyTorch, Transformers)
     - *DevOps / Cloud Specialist* (Kubernetes, Terraform, AWS)
   - Filter or search for *"Full-Stack"*.
2. **Submit Application:**
   - Click on **"Senior Full-Stack Engineer"**.
   - Review job requirements: 3+ years experience, Python, React, Docker.
   - Click **"Apply Now"**.
3. **Verify Instant AI Match Score:**
   - Notice the instant AI match score computed immediately upon application (e.g., **92% Strong Match**).
   - Navigate to **"My Applications"** (`/candidate/applications`).
   - Highlight the application status badge: `Submitted`, application timestamp, and calculated match percentage.
   - Log out of the candidate portal.

---

## Section 4: Admin Recruitment Command Center & Job Management (3:00 – 4:15)

### Screen Setup:
- Navigate to `http://localhost:5173/login`.
- Click the quick-fill button **"Admin Demo"** (`admin@recruit.ai` / `admin123`) and log in.

### Steps & Actions:
1. **Recruitment KPI Metrics:**
   - Point out the top-level KPI cards populated by live backend APIs:
     - Total Candidates, Total Resumes Ingested, Active Job Postings, Total Applications, Shortlisted Talent, Scheduled Interviews.
   - Show the interactive Recharts distribution graphs displaying Application Pipeline stages and Skills Breakdown.
2. **Job Postings CRUD:**
   - Navigate to **"Jobs Management"** (`/admin/jobs`).
   - Click **"Post New Job"**.
   - Fill in:
     - Title: `Lead AI Research Engineer`
     - Location: `Remote / Hybrid`
     - Min Experience: `4` years
     - Required Skills: `Python, PyTorch, Transformers, LLM, LangChain`
     - Status: `Active`
   - Save the job and show it immediately appear in the active job listings.

---

## Section 5: Bulk Resume Ingestion & Duplicate Detection (4:15 – 5:15)

### Screen Setup:
- Navigate to **"Bulk Resume Upload"** (`/admin/resumes` or modal).

### Steps & Actions:
1. **Simultaneous Multi-File Upload:**
   - Select multiple test files from `sample_resumes/`:
     - `John_Doe_FullStack.pdf`
     - `Elena_Rostova_Data_Scientist.docx`
     - `David_Kim_DevOps.pdf`
   - Click **"Process Resumes"**.
2. **Show Processing Table & Error Isolation:**
   - Demonstrate the real-time processing feedback table displaying:
     - Filename, Detected Format, Extracted Characters, AI Parsing Status, Candidate Association.
   - Point out how each file is processed in an isolated transaction: one failure or unsupported file does not abort the rest of the batch.
3. **Demonstrate Duplicate Detection:**
   - Re-upload `John_Doe_FullStack.pdf`.
   - Point out the system response: the system recognizes the existing candidate by normalized email, links the new resume version to the existing profile without creating orphaned or duplicate user records.

---

## Section 6: Semantic Talent Search & 5-Factor Hybrid AI Matching (5:15 – 6:45)

### Screen Setup:
- Navigate to **"Semantic Search"** (`/admin/semantic-search`).

### Steps & Actions:
1. **Natural Language Semantic Search:**
   - Enter a conversational query in plain English:
     > *"Find a data scientist or ML engineer with strong PyTorch, deep learning, and transformer experience."*
   - Set the similarity threshold to `0.50` and click **"Search Talent"**.
   - Show the vector search results returned via Sentence Transformers cosine similarity:
     - Elena Rostova (Data Scientist) ranks at the top with high cosine similarity (e.g. 0.84).
     - Point out that neither the candidate headline nor filename needed an exact string match—the vector embedding captured the conceptual meaning of the query.
2. **Explainable 5-Factor Hybrid Matching:**
   - Navigate to **"AI Job Matching"** (`/admin/matching` or job candidate matching tab).
   - Select the job: *Senior Full-Stack Engineer*.
   - Click **"Calculate AI Match Scores"**.
   - Show the candidate leaderboard ranked from highest to lowest score.
   - Click on the top candidate to reveal the **Explainable AI (XAI) Modal**:
     - **Required Skills Match (40% weight):** 100% (Matched Python, React, Docker).
     - **Experience Match (20% weight):** 100% (Candidate has 5 yrs vs 3 yrs required).
     - **Education Match (10% weight):** 100% (B.S. in Computer Science).
     - **Preferred Skills Match (10% weight):** 75% (Matched AWS, PostgreSQL).
     - **Semantic Vector Similarity (20% weight):** 88% dense alignment.
     - **Composite Match Score:** **93.6%**.
     - Display the natural language rationale generated by the system explaining strengths and missing criteria.

---

## Section 7: Human-in-the-Loop Shortlisting & Interview Scheduling (6:45 – 7:45)

### Screen Setup:
- In the AI Matching table or Applications list (`/admin/applications`).

### Steps & Actions:
1. **Human-in-the-Loop Decision Override:**
   - Select Marcus Vance or Alex Rivera.
   - Click **"Shortlist Candidate"**.
   - Enter recruiter review notes: *"Candidate has exemplary full-stack experience and solid Docker background. Fast-tracking to Round 1 Technical."*
   - Change decision status to `Shortlisted`. Notice the recruiter decision is stored independently from the AI algorithm recommendation.
2. **Schedule an Interview:**
   - Click **"Schedule Interview"**.
   - In the modal:
     - Assign Interviewer: Select `Dr. Sarah Chen (Senior Technical Lead)` from the dropdown.
     - Date & Time: Select tomorrow at `10:00 AM`.
     - Round Type: `Technical Round 1`.
     - Meeting Link: `https://meet.google.com/abc-defg-hij`.
   - Click **"Confirm Interview"**.
   - Show toast notification and automated in-app notification dispatch to both candidate and interviewer.
3. **Data Export:**
   - Click **"Export Shortlist"** -> Download as **CSV** and **Excel (.xlsx)**.
   - Show that the exported spreadsheet contains candidate names, email, matched score, and status.
   - Log out of Admin.

---

## Section 8: Interviewer Scorecards & Evaluation Feedback (7:45 – 8:45)

### Screen Setup:
- Login page; click **"Interviewer Demo"** (`interviewer@recruit.ai` / `interviewer123`).

### Steps & Actions:
1. **Assigned Interviews Dashboard:**
   - Navigate to **"My Interviews"** (`/interviewer/interviews`).
   - Highlight that the interviewer *only* sees candidates assigned specifically to them, with no access to administrative salary or recruiter notes.
2. **Candidate Profile Inspection:**
   - Click **"View Candidate Profile"**.
   - Review verified skills, past projects, and resume details directly in the side panel.
3. **Structured Evaluation Scorecard Submission:**
   - Click **"Submit Feedback"**.
   - Provide structured ratings (1 to 5 stars):
     - Technical Proficiency: `5 / 5`
     - Problem Solving & Architecture: `4 / 5`
     - Communication & Culture Fit: `5 / 5`
     - Overall Score: Automatically averaged to `4.7 / 5`.
   - Final Recommendation: Select **"Strong Hire"**.
   - Detailed Remarks: *"Excellent systems design capability, explained caching strategies clearly, strong React and FastAPI proficiency."*
   - Click **"Submit Scorecard"**.
   - Notice the status badge updates to `Completed` with feedback locked and archived.
   - Log out of Interviewer.

---

## Section 9: Security, RBAC Enforcement & Candidate Data Isolation (8:45 – 9:30)

### Screen Setup:
- Browser and Terminal / API test view.

### Steps & Actions:
1. **Candidate Verification of Updates:**
   - Log in as the candidate (`alex.rivera@example.com` or newly created candidate).
   - Open **"Notifications"** bell in top navbar: show *"Interview Scheduled: Technical Round 1 with Dr. Sarah Chen"*.
   - Open **"My Interviews"**: show interview card with meeting link, scheduled time, and status.
2. **Data Isolation & Unauthorized Boundary Test:**
   - Demonstrate that if a candidate attempts to navigate to `/admin/dashboard` or call `/api/admin/candidates`, the application immediately denies access with `403 Forbidden` and redirects safely.
   - Demonstrate that Candidate A cannot view Candidate B's resume or applications by user ID parameter tampering.

---

## Section 10: Conclusion, OpenAPI Docs & Verification Proof (9:30 – 10:00)

### Screen Setup:
- Split screen: Browser at `http://127.0.0.1:8000/docs` (Swagger UI) and Terminal running test suites.

### Steps & Actions:
1. **FastAPI Swagger Documentation:**
   - Scroll through the interactive OpenAPI documentation covering all 28 production endpoints across Auth, Candidates, Jobs, Admin, Interviews, and Notifications.
2. **Automated Verification:**
   - In terminal, show the 3 passing test suites:
     - `test_database.py` (Database relationships & constraints: PASS)
     - `test_ai_engine.py` (AI extraction, Groq parser, vector embeddings: PASS)
     - `test_full_integration.py` (Full candidate-admin-interviewer flow: PASS)
3. **Closing Statement:**
   > *"The AI-Powered Recruitment & Interview Management Platform is complete, robustly tested, and fully ready for assessment submission. Thank you!"*

---
