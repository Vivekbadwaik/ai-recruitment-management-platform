# REST API Specification

Base URL: `http://localhost:8000/api`

## Authentication (`/api/auth`)
- `POST /api/auth/register` - Create account (`email`, `full_name`, `password`, `role`). Returns JWT token.
- `POST /api/auth/login` - Authenticate with email/password. Returns JWT bearer token.
- `GET /api/auth/me` - Get logged-in user identity.

## Candidate Portal (`/api/candidates`)
- `GET /api/candidates/me/profile` - Fetch candidate profile.
- `PUT /api/candidates/me/profile` - Update candidate profile (skills, experience, education).
- `POST /api/candidates/me/resume` - Upload resume file (PDF/DOCX). Triggers Groq AI parsing.
- `GET /api/candidates/me/resumes` - List uploaded resumes and parsing statuses.
- `POST /api/candidates/me/apply/{job_id}` - Apply for a job opening. Calculates instant AI match.
- `GET /api/candidates/me/applications` - View submitted applications and status.
- `GET /api/candidates/me/interviews` - View scheduled interviews for candidate.

## Job Management (`/api/jobs`)
- `GET /api/jobs` - List jobs (`?status_filter=active|closed|all`).
- `GET /api/jobs/{id}` - Retrieve job details.
- `POST /api/jobs` - Create job posting (Admin only).
- `PUT /api/jobs/{id}` - Update job posting (Admin only).
- `DELETE /api/jobs/{id}` - Remove job posting (Admin only).

## Admin Recruitment Portal (`/api/admin`)
- `GET /api/admin/stats` - Total counts for candidates, resumes, active jobs, applications, shortlists, interviews, selected.
- `POST /api/admin/resumes/bulk-upload` - Upload multiple PDF/DOCX resumes simultaneously with isolated error handling and duplicate candidate detection.
- `GET /api/admin/candidates` - Filter candidate talent directory (`search`, `skill`, `min_exp`, `location`).
- `GET /api/admin/candidates/{id}` - Get full candidate detail, resumes, and notes.
- `PUT /api/admin/candidates/{id}/profile` - Recruiter profile edits.
- `POST /api/admin/candidates/{id}/notes` - Add internal candidate notes.
- `GET /api/admin/interviewers` - List all registered interviewers for interview assignment modals.
- `GET /api/admin/applications` - List applications with filters (`status`, `job_id`), enriched with candidate profile details.
- `POST /api/admin/jobs/{job_id}/shortlist/{candidate_user_id}` - Shortlist candidate directly from AI Matching or Directory, creating or updating application records.
- `POST /api/admin/semantic-search` - Natural language query candidate search (`query`, `min_score`, `limit`).
- `POST /api/admin/jobs/{job_id}/match-candidates` - Calculate hybrid 5-factor AI matching scores with Explainable AI rationale.
- `GET /api/admin/candidates/{user_id}/match/{job_id}` - Individual candidate AI match score against a job.
- `PUT /api/admin/applications/{app_id}/status` - Advance candidate status with Human-in-the-Loop override decision and notes.
- `PUT /api/admin/applications/{app_id}/override` - Alias for application status and recruiter decision override.
- `GET /api/admin/export/shortlist` - Export shortlisted candidates to CSV or Excel (`?job_id=...&format=csv|excel`).

## Interview Management (`/api/interviews`)
- `POST /api/interviews` - Schedule interview and assign interviewer (Admin only).
- `GET /api/interviews/all` - List all interviews (Admin only).
- `PUT /api/interviews/{id}` - Reschedule interview date/time.
- `DELETE /api/interviews/{id}` - Cancel interview.
- `GET /api/interviews/assigned` - List interviews assigned to current interviewer.
- `GET /api/interviews/{id}/candidate-profile` - Interviewer authorized candidate details.
- `POST /api/interviews/{id}/feedback` - Submit interview scorecard (1-5 ratings + recommendation).
- `GET /api/interviews/{id}/feedback` - Retrieve interview evaluation scorecard.

## Notifications (`/api/notifications`)
- `GET /api/notifications` - Fetch user in-app notifications.
- `PUT /api/notifications/{id}/read` - Mark single notification as read.
- `PUT /api/notifications/read-all` - Mark all notifications read.
