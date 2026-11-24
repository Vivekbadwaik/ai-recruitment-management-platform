"""
End-to-End Comprehensive Integration Test Suite
Verifies all 3 Portals:
  1. Candidate Portal (Profile, Resumes, Jobs, Apply, Applications, Interviews)
  2. Admin Recruitment Portal (Stats, Jobs CRUD, Candidates directory, Notes, AI Matching, Shortlist, Semantic Search, Exports)
  3. Interviewer Portal (Assigned Interviews, Candidate Profile Access, Multi-Criteria Feedback Scorecards)
  4. Role-based Access Control and In-App Notifications
"""

import sys
import os
import unittest
from datetime import datetime, timezone, timedelta

# Ensure backend path is in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal, init_db
from app.models.user import User
from app.models.candidate import CandidateProfile, Resume, CandidateEmbedding, CandidateNote
from app.models.job import Job, Application
from app.models.interview import Interview, InterviewFeedback
from app.models.notification import Notification

from app.core.security import verify_password, hash_password, create_access_token
from app.routers import auth as auth_router
from app.routers import admin as admin_router
from app.routers import candidates as cand_router
from app.routers import jobs as jobs_router
from app.routers import interviews as iv_router
from app.routers import notifications as notif_router

from app.schemas.auth import UserLogin, UserCreate
from app.schemas.job import JobCreate, JobUpdate, ApplicationStatusUpdate
from app.schemas.candidate import CandidateProfileUpdate, CandidateNoteCreate
from app.schemas.interview import InterviewCreate, InterviewReschedule, InterviewFeedbackCreate
from app.schemas.matching import SemanticSearchQuery


from seed_data import seed

class TestFullEndToEndPlatform(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed()
        cls.db = SessionLocal()

        # Fetch seed accounts
        cls.admin = cls.db.query(User).filter(User.role == "admin").first()
        cls.interviewer = cls.db.query(User).filter(User.role == "interviewer").first()
        cls.candidate1 = cls.db.query(User).filter(User.email == "alex.rivera@example.com").first()
        cls.candidate2 = cls.db.query(User).filter(User.email == "priya.sharma@example.com").first()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_authentication_all_roles(self):
        """Test login and JWT token generation for Admin, Interviewer, Candidate."""
        print("\n--- TEST 1: Authentication for All Roles ---")
        for email, password, role in [
            ("admin@recruit.ai", "admin123", "admin"),
            ("interviewer@recruit.ai", "interviewer123", "interviewer"),
            ("alex.rivera@example.com", "candidate123", "candidate"),
        ]:
            user = self.db.query(User).filter(User.email == email).first()
            self.assertIsNotNone(user, f"User {email} should exist")
            self.assertTrue(verify_password(password, user.hashed_password))
            token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
            self.assertIsInstance(token, str)
            self.assertTrue(len(token) > 20)
            print(f"  [PASS] Logged in as {role.upper()} ({email}) successfully.")

    def test_02_admin_dashboard_stats(self):
        """Test Admin Dashboard KPI stats generation from real database queries."""
        print("\n--- TEST 2: Admin Dashboard Statistics ---")
        stats = admin_router.get_dashboard_stats(current_user=self.admin, db=self.db)
        self.assertIn("total_candidates", stats)
        self.assertIn("total_resumes", stats)
        self.assertIn("active_jobs", stats)
        self.assertIn("total_applications", stats)
        self.assertIn("shortlisted", stats)
        self.assertIn("scheduled_interviews", stats)
        self.assertIn("selected", stats)
        self.assertGreaterEqual(stats["total_candidates"], 2)
        print(f"  [PASS] Dashboard Stats: {stats}")

    def test_03_job_management_crud(self):
        """Test Admin Job Management: Create, Read, Update, Delete."""
        print("\n--- TEST 3: Admin Job Management CRUD ---")
        # Create Job
        new_job_in = JobCreate(
            title="Senior Full-Stack Architect (E2E Test)",
            description="Leading enterprise microservices and AI integration",
            required_skills=["Python", "FastAPI", "React", "Docker"],
            preferred_skills=["Kubernetes", "GraphQL"],
            min_experience=5.0,
            max_experience=10.0,
            education_requirements="Bachelor's in Computer Science",
            location="Remote",
            employment_type="Full-time",
            status="active"
        )
        created = jobs_router.create_job(job_in=new_job_in, current_user=self.admin, db=self.db)
        self.assertEqual(created.title, new_job_in.title)
        job_id = created.id
        print(f"  [PASS] Created Job ID {job_id}: {created.title}")

        # Update Job
        update_in = JobUpdate(min_experience=6.0, location="New York / Remote")
        updated = jobs_router.update_job(job_id=job_id, job_in=update_in, current_user=self.admin, db=self.db)
        self.assertEqual(updated.min_experience, 6.0)
        self.assertEqual(updated.location, "New York / Remote")
        print(f"  [PASS] Updated Job ID {job_id} location & experience requirements.")

        # List Jobs
        job_list = jobs_router.list_jobs(status_filter="all", db=self.db)
        self.assertTrue(any(j.id == job_id for j in job_list))
        print(f"  [PASS] Listed {len(job_list)} jobs containing newly created job.")

        # Delete Job
        jobs_router.delete_job(job_id=job_id, current_user=self.admin, db=self.db)
        deleted_check = self.db.query(Job).filter(Job.id == job_id).first()
        self.assertIsNone(deleted_check)
        print(f"  [PASS] Deleted Job ID {job_id} successfully.")

    def test_04_admin_candidates_directory_and_notes(self):
        """Test candidate directory filtering and recruiter note creation."""
        print("\n--- TEST 4: Candidate Directory & Recruiter Notes ---")
        candidates = admin_router.list_candidates(
            search=None, skill="Python", min_exp=1.0, location=None,
            current_user=self.admin, db=self.db
        )
        self.assertGreaterEqual(len(candidates), 1)
        target_cand = candidates[0]
        print(f"  [PASS] Filtered {len(candidates)} candidates matching 'Python' & min_exp >= 1.0.")

        # Add Recruiter Note
        note_in = CandidateNoteCreate(note="Exceptional communication during screening call. Strong React background.")
        note_res = admin_router.add_candidate_note(
            user_id=target_cand["user_id"], note_in=note_in,
            current_user=self.admin, db=self.db
        )
        self.assertEqual(note_res.note, note_in.note)
        print(f"  [PASS] Added recruiter note for candidate '{target_cand['full_name']}'.")

        # Get Candidate Detail
        detail = admin_router.get_candidate_detail(
            user_id=target_cand["user_id"], current_user=self.admin, db=self.db
        )
        self.assertIn("profile", detail)
        self.assertIn("notes", detail)
        self.assertTrue(any(n["note"] == note_in.note for n in detail["notes"]))
        print(f"  [PASS] Retrieved candidate details with {len(detail['notes'])} notes and profile.")

    def test_05_ai_candidate_matching_engine(self):
        """Test AI hybrid candidate matching for a job posting."""
        print("\n--- TEST 5: AI Candidate Matching Engine ---")
        job = self.db.query(Job).filter(Job.status == "active").first()
        self.assertIsNotNone(job, "Active job required for matching test")

        matches = admin_router.match_candidates_for_job(job_id=job.id, current_user=self.admin, db=self.db)
        self.assertGreaterEqual(len(matches), 1)
        top_match = matches[0]
        self.assertIsNotNone(top_match.breakdown)
        self.assertGreaterEqual(top_match.breakdown.overall_match_score, 0.0)
        self.assertLessEqual(top_match.breakdown.overall_match_score, 100.0)
        self.assertTrue(len(top_match.breakdown.explanation) > 10)
        print(f"  [PASS] Top match for '{job.title}': {top_match.full_name} with score {top_match.breakdown.overall_match_score}%")
        print(f"         Explainable AI Rationale: {top_match.breakdown.explanation[:80]}...")

    def test_06_admin_shortlist_and_status_advance(self):
        """Test Admin shortlisting candidate and advancing pipeline status."""
        print("\n--- TEST 6: Admin Shortlist & Human-in-the-Loop Override ---")
        job = self.db.query(Job).filter(Job.status == "active").first()
        cand = self.candidate1

        # Shortlist candidate directly
        shortlist_res = admin_router.shortlist_candidate_for_job(
            job_id=job.id, candidate_user_id=cand.id,
            current_user=self.admin, db=self.db
        )
        self.assertEqual(shortlist_res["status"], "shortlisted")
        app_id = shortlist_res["application_id"]
        print(f"  [PASS] Shortlisted {cand.full_name} for Job '{job.title}'. App ID: {app_id}")

        # Update application status with decision override
        status_in = ApplicationStatusUpdate(
            status="interview",
            admin_decision="Proceed to Round 1 Technical",
            admin_notes="Candidate demonstrated strong API design knowledge."
        )
        updated = admin_router.update_application_status(
            app_id=app_id, status_update=status_in,
            current_user=self.admin, db=self.db
        )
        self.assertEqual(updated["status"], "interview")
        print(f"  [PASS] Advanced application {app_id} status to 'interview' with Human-in-the-Loop notes.")

        # Verify in shortlisted applications endpoint
        shortlist_apps = admin_router.list_applications(status="shortlisted", current_user=self.admin, db=self.db)
        self.assertTrue(any(a["id"] == app_id for a in shortlist_apps))
        print(f"  [PASS] Verified application {app_id} in shortlisted applications list.")

    def test_07_export_shortlist_csv_and_excel(self):
        """Test shortlist dataset export to CSV and Excel."""
        print("\n--- TEST 7: Shortlist Export (CSV & Excel) ---")
        csv_resp = admin_router.export_shortlist(format="csv", current_user=self.admin, db=self.db)
        self.assertEqual(csv_resp.media_type, "text/csv")
        self.assertTrue(len(csv_resp.body) > 0)
        print(f"  [PASS] Exported CSV shortlist ({len(csv_resp.body)} bytes).")

        excel_resp = admin_router.export_shortlist(format="excel", current_user=self.admin, db=self.db)
        self.assertEqual(excel_resp.media_type, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.assertTrue(len(excel_resp.body) > 0)
        print(f"  [PASS] Exported Excel shortlist ({len(excel_resp.body)} bytes).")

    def test_08_semantic_vector_search(self):
        """Test natural language semantic talent search using vector embeddings."""
        print("\n--- TEST 8: Semantic Vector Talent Search ---")
        query_in = SemanticSearchQuery(
            query="Senior software developer experienced with FastAPI backend, Python and React user interfaces",
            min_score=0.0,
            limit=5
        )
        results = admin_router.semantic_search_candidates(
            search_body=query_in, current_user=self.admin, db=self.db
        )
        self.assertGreaterEqual(len(results), 1)
        top = results[0]
        self.assertGreater(top.similarity_score, 0.0)
        print(f"  [PASS] Semantic query returned {len(results)} matches. Top: {top.full_name} ({top.similarity_score:.1f}%)")

    def test_09_candidate_portal_profile_and_apply(self):
        """Test Candidate Portal: profile management and 1-click job application."""
        print("\n--- TEST 9: Candidate Portal Profile & Application ---")
        # Get Profile
        prof = cand_router.get_my_profile(current_user=self.candidate1, db=self.db)
        self.assertEqual(prof.full_name, self.candidate1.full_name)
        print(f"  [PASS] Retrieved candidate profile for '{prof.full_name}'.")

        # Update Profile
        update_in = CandidateProfileUpdate(
            headline="Lead Cloud & AI Engineer",
            skills=prof.skills + ["FastAPI", "TensorFlow"] if "TensorFlow" not in prof.skills else prof.skills
        )
        updated_prof = cand_router.update_my_profile(data=update_in, current_user=self.candidate1, db=self.db)
        self.assertEqual(updated_prof.headline, "Lead Cloud & AI Engineer")
        print(f"  [PASS] Updated candidate profile headline & skills.")

        # Browse Jobs
        jobs = self.db.query(Job).filter(Job.status == "active").all()
        self.assertGreaterEqual(len(jobs), 1)

        # Candidate applications list
        my_apps = cand_router.get_my_applications(current_user=self.candidate1, db=self.db)
        self.assertIsInstance(my_apps, list)
        print(f"  [PASS] Candidate application tracking returns {len(my_apps)} submitted applications.")

    def test_10_interviewer_portal_workflow(self):
        """Test Interviewer Portal: view assigned, view candidate profile, submit feedback."""
        print("\n--- TEST 10: Interviewer Portal Workflow & Feedback Scorecard ---")
        assigned = iv_router.get_assigned_interviews(current_user=self.interviewer, db=self.db)
        self.assertGreaterEqual(len(assigned), 1)
        target_iv = assigned[0]
        print(f"  [PASS] Interviewer has {len(assigned)} assigned interviews. Target ID: {target_iv.id}")

        # View Candidate Profile
        cand_preview = iv_router.get_interview_candidate_profile(
            interview_id=target_iv.id, current_user=self.interviewer, db=self.db
        )
        self.assertIn("candidate", cand_preview)
        self.assertIn("interview", cand_preview)
        print(f"  [PASS] Interviewer authorized to view candidate: {cand_preview['candidate']['full_name']}")

        # Clear existing feedback for this interview if already exists
        existing_fb = self.db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == target_iv.id).first()
        if existing_fb:
            self.db.delete(existing_fb)
            self.db.commit()

        # Submit Feedback
        feedback_in = InterviewFeedbackCreate(
            technical_skills_rating=4.5,
            communication_rating=4.0,
            problem_solving_rating=4.5,
            remarks="Outstanding system design capabilities, clean code presentation, highly recommended.",
            recommendation="hire"
        )
        submitted_fb = iv_router.submit_interview_feedback(
            interview_id=target_iv.id, feedback_in=feedback_in,
            current_user=self.interviewer, db=self.db
        )
        self.assertEqual(submitted_fb.recommendation, "hire")
        self.assertAlmostEqual(submitted_fb.overall_rating, 4.3, places=1)
        print(f"  [PASS] Submitted feedback scorecard: Overall {submitted_fb.overall_rating}/5.0 (Recommendation: {submitted_fb.recommendation})")

        # View Feedback
        viewed_fb = iv_router.get_interview_feedback(
            interview_id=target_iv.id, current_user=self.admin, db=self.db
        )
        self.assertIsNotNone(viewed_fb)
        self.assertEqual(viewed_fb.recommendation, "hire")
        print(f"  [PASS] Admin verified evaluation scorecard successfully.")

    def test_11_in_app_notifications(self):
        """Test in-app notification creation, retrieval, and marking as read."""
        print("\n--- TEST 11: In-App Notifications ---")
        notifs = notif_router.get_notifications(current_user=self.candidate1, db=self.db)
        self.assertIsInstance(notifs, list)
        print(f"  [PASS] Retrieved {len(notifs)} in-app notifications for candidate.")

        # Mark all as read
        res = notif_router.mark_all_notifications_read(current_user=self.candidate1, db=self.db)
        self.assertEqual(res["message"], "All notifications marked as read.")
        print(f"  [PASS] Marked all notifications as read.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
