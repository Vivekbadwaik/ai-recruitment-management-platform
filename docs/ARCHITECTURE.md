# AI-Powered Recruitment & Interview Management Platform: Architecture & Database Schema

## 1. System Overview

The platform is designed as an enterprise-grade full-stack recruitment and interview intelligence system. It automates candidate resume parsing, semantic talent search, hybrid multi-factor candidate ranking, interview scheduling, and feedback management.

```mermaid
flowchart TD
    subgraph Client["Frontend (React 19 + Vite + Tailwind CSS)"]
        CP["Candidate Portal"]
        AP["Admin Recruitment Portal"]
        IP["Interviewer Portal"]
        Router["React Router v7 + Auth Guards"]
    end

    subgraph API["Backend API (FastAPI)"]
        Auth["JWT Auth & Role Check"]
        CandRouter["/api/candidates"]
        JobRouter["/api/jobs"]
        AdminRouter["/api/admin"]
        IVRouter["/api/interviews"]
        NotifRouter["/api/notifications"]
    end

    subgraph AIEngine["AI & ML Processing Engine"]
        Groq["Groq LLM (llama-3.3-70b / 3.1-8b)"]
        ST["Sentence Transformers (all-MiniLM-L6-v2)"]
        Cosine["Cosine Vector Similarity Engine"]
        Hybrid["Hybrid 5-Factor Match Calculator"]
        XAI["Explainable AI Generation"]
    end

    subgraph Storage["Persistent Storage"]
        DB[("SQLite Database via SQLAlchemy")]
        Uploads["Local Secure Storage (PDF/DOCX)"]
    end

    Client --> Router
    Router --> Auth
    Auth --> CandRouter & JobRouter & AdminRouter & IVRouter & NotifRouter
    CandRouter & AdminRouter --> Groq
    CandRouter & AdminRouter --> ST --> Cosine
    AdminRouter --> Hybrid --> XAI
    CandRouter & JobRouter & AdminRouter & IVRouter & NotifRouter --> DB
    CandRouter & AdminRouter --> Uploads
```

---

## 2. Database Schema & Relational Model

The database is built on SQLAlchemy 2.0 with automated table generation and runtime SQLite foreign key enforcement via `@event.listens_for(engine, "connect")` executing `PRAGMA foreign_keys=ON;`.

```mermaid
erDiagram
    User ||--o| CandidateProfile : "1:1 profile"
    User ||--o{ Resume : "1:M uploaded resumes"
    User ||--o{ Application : "1:M candidate applications"
    User ||--o{ CandidateEmbedding : "1:M candidate embeddings"
    User ||--o{ CandidateNote : "1:M notes received / authored"
    User ||--o{ Interview : "1:M interviews (candidate / interviewer)"
    User ||--o{ Notification : "1:M notifications"
    User ||--o{ Job : "1:M jobs created (admin)"
    Job ||--o{ Application : "1:M applications"
    Job ||--o{ Interview : "1:M interviews"
    Application ||--o{ Interview : "1:M rounds"
    Interview ||--o| InterviewFeedback : "1:1 feedback"

    User {
        int id PK
        string email UK
        string full_name
        string hashed_password
        string role
        int is_active
        datetime created_at
        datetime updated_at
    }

    CandidateProfile {
        int id PK
        int user_id FK, UK
        string phone
        string location
        string headline
        text summary
        json skills
        json education
        json experience
        json projects
        float total_experience_years
        int is_ai_parsed
        datetime created_at
        datetime updated_at
    }

    Resume {
        int id PK
        int user_id FK
        string filename
        string original_filename
        string file_path
        string file_type
        int file_size
        text raw_text
        json parsed_data
        string parsing_status
        text parsing_error
        datetime uploaded_at
    }

    Job {
        int id PK
        int created_by FK
        string title
        text description
        json required_skills
        json preferred_skills
        float min_experience
        float max_experience
        string education_requirements
        string location
        string employment_type
        datetime application_deadline
        string status
        datetime created_at
        datetime updated_at
    }

    Application {
        int id PK
        int job_id FK
        int candidate_user_id FK
        string status
        float ai_match_score
        json ai_recommendation
        string admin_decision
        text admin_notes
        datetime applied_at
        datetime updated_at
    }

    CandidateEmbedding {
        int id PK
        int user_id FK
        string model_version
        json embedding
        text text_used
        datetime created_at
        datetime updated_at
    }

    CandidateNote {
        int id PK
        int candidate_user_id FK
        int admin_user_id FK
        text note
        datetime created_at
        datetime updated_at
    }

    Interview {
        int id PK
        int application_id FK
        int candidate_user_id FK
        int interviewer_user_id FK
        int job_id FK
        datetime scheduled_date
        int duration_minutes
        string interview_type
        string status
        string meeting_link
        text notes
        datetime created_at
        datetime updated_at
    }

    InterviewFeedback {
        int id PK
        int interview_id FK, UK
        int interviewer_user_id FK
        float technical_skills_rating
        float communication_rating
        float problem_solving_rating
        float overall_rating
        text remarks
        string recommendation
        datetime submitted_at
        datetime updated_at
    }

    Notification {
        int id PK
        int user_id FK
        string title
        text message
        string type
        int is_read
        string link
        datetime created_at
    }
```

---

## 3. Database Constraints & Relationships Map

| # | Relationship Description | Parent Model | Child Model | Relationship Attributes |
|---|---|---|---|---|
| 1 | One user has one candidate profile | `User` | `CandidateProfile` | `profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")` |
| 2 | One candidate has multiple resumes | `User` | `Resume` | `resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")` |
| 3 | One candidate has multiple applications | `User` | `Application` | `applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")` |
| 4 | One job has multiple applications | `Job` | `Application` | `applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")` |
| 5 | One candidate has one embedding per model version | `User` | `CandidateEmbedding` | `embeddings = relationship("CandidateEmbedding", back_populates="user", cascade="all, delete-orphan")`; `UniqueConstraint("user_id", "model_version")` |
| 6 | One candidate has multiple internal notes | `User` | `CandidateNote` | `candidate_notes = relationship("CandidateNote", foreign_keys="CandidateNote.candidate_user_id", back_populates="candidate", cascade="all, delete-orphan")` |
| 7 | One candidate has multiple interviews | `User` | `Interview` | `candidate_interviews = relationship("Interview", foreign_keys="Interview.candidate_user_id", back_populates="candidate", cascade="all, delete-orphan")` |
| 8 | One interviewer assigned multiple interviews | `User` | `Interview` | `assigned_interviews = relationship("Interview", foreign_keys="Interview.interviewer_user_id", back_populates="interviewer")` |
| 9 | One interview has interview feedback | `Interview` | `InterviewFeedback` | `feedback = relationship("InterviewFeedback", back_populates="interview", uselist=False, cascade="all, delete-orphan")`; `unique=True` on `interview_id` |
| 10 | One user receives multiple notifications | `User` | `Notification` | `notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")` |

### Key Integrity Constraints:
- **Duplicate Application Prevention:** `UniqueConstraint("job_id", "candidate_user_id", name="uq_job_candidate")` on table `applications`.
- **Duplicate Model Embedding Prevention:** `UniqueConstraint("user_id", "model_version", name="uq_candidate_embedding_model")` on table `candidate_embeddings`.
- **One Feedback per Interview:** `unique=True` on `interview_feedback.interview_id`.
- **Foreign Key Enforcing Engine:** SQLite pragma `PRAGMA foreign_keys=ON;` enforced on every DBAPI connection.
