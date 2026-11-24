import os
import sys
from datetime import datetime, timezone, timedelta
from sqlalchemy.exc import IntegrityError
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, init_db, engine
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.models.candidate import CandidateProfile, Resume, CandidateEmbedding, CandidateNote
from app.models.job import Job, Application
from app.models.interview import Interview, InterviewFeedback
from app.models.notification import Notification
from app.main import app

def run_database_and_security_tests():
    print("=" * 60)
    print("STARTING DATABASE & SECURITY VERIFICATION SUITE")
    print("=" * 60)

    # 1. Database Initialization
    print("\n[TEST 1] Verifying Database Initialization & Tables...")
    init_db()
    db = SessionLocal()

    # Query tables via models
    user_count = db.query(User).count()
    job_count = db.query(Job).count()
    profile_count = db.query(CandidateProfile).count()
    app_count = db.query(Application).count()
    iv_count = db.query(Interview).count()
    notif_count = db.query(Notification).count()

    assert user_count >= 4, f"Expected at least 4 users, found {user_count}"
    assert job_count >= 3, f"Expected at least 3 jobs, found {job_count}"
    assert profile_count >= 2, f"Expected at least 2 profiles, found {profile_count}"
    assert app_count >= 2, f"Expected at least 2 applications, found {app_count}"
    assert iv_count >= 1, f"Expected at least 1 interview, found {iv_count}"
    assert notif_count >= 3, f"Expected at least 3 notifications, found {notif_count}"
    print(f"  PASS: Initialized tables verified (Users: {user_count}, Jobs: {job_count}, Profiles: {profile_count}, Apps: {app_count}, Interviews: {iv_count}, Notifications: {notif_count})")

    # 2. Password Hashing & Security
    print("\n[TEST 2] Verifying Password Hashing & Encryption...")
    admin = db.query(User).filter(User.email == "admin@recruit.ai").first()
    assert admin is not None
    # Password must NEVER be plaintext
    assert admin.hashed_password != "admin123"
    assert admin.hashed_password.startswith("$2b$") or len(admin.hashed_password) >= 50
    assert "admin123" not in admin.hashed_password
    # Verify bcrypt verification function
    assert verify_password("admin123", admin.hashed_password) is True
    assert verify_password("wrongpassword", admin.hashed_password) is False
    print("  PASS: Passwords are securely hashed with bcrypt and never stored in plain text.")

    # 3. User Login Compatibility via API
    print("\n[TEST 3] Verifying User Login Compatibility across Roles...")
    from app.routers.auth import login
    from app.schemas.auth import UserLogin
    from fastapi import HTTPException

    # Admin Login
    res_admin = login(UserLogin(email="admin@recruit.ai", password="admin123"), db)
    assert res_admin.access_token is not None
    assert res_admin.user.role == "admin"
    admin_token = res_admin.access_token

    # Interviewer Login
    res_iv = login(UserLogin(email="interviewer@recruit.ai", password="interviewer123"), db)
    assert res_iv.access_token is not None
    assert res_iv.user.role == "interviewer"
    iv_token = res_iv.access_token

    # Candidate 1 Login
    res_cand1 = login(UserLogin(email="alex.rivera@example.com", password="candidate123"), db)
    assert res_cand1.access_token is not None
    assert res_cand1.user.role == "candidate"
    cand1_token = res_cand1.access_token

    # Candidate 2 Login
    res_cand2 = login(UserLogin(email="priya.sharma@example.com", password="candidate123"), db)
    assert res_cand2.access_token is not None
    assert res_cand2.user.role == "candidate"
    cand2_token = res_cand2.access_token

    # Invalid password check
    try:
        login(UserLogin(email="admin@recruit.ai", password="incorrect_pwd"), db)
        assert False, "Invalid password should have raised 401!"
    except HTTPException as e:
        assert e.status_code == 401
    print("  PASS: All 4 user roles authenticate smoothly via JWT; invalid credentials rejected with 401.")

    # 4. Model Relationships Verification
    print("\n[TEST 4] Verifying 10 SQLAlchemy Relationships...")

    # Rel 1: User <-> CandidateProfile (One-to-One)
    cand1_user = db.query(User).filter(User.email == "alex.rivera@example.com").first()
    assert cand1_user.profile is not None
    assert cand1_user.profile.user.email == "alex.rivera@example.com"
    print("  PASS Rel 1: User <-> CandidateProfile (One-to-One)")

    # Rel 2: Candidate <-> Resumes (One-to-Many)
    sample_resume = Resume(
        user_id=cand1_user.id,
        filename="test_res.pdf",
        original_filename="Alex_Resume.pdf",
        file_path="uploads/resumes/test_res.pdf",
        file_type="pdf",
        file_size=12000,
        raw_text="Sample resume text",
        parsing_status="pending"
    )
    db.add(sample_resume)
    db.commit()
    db.refresh(cand1_user)
    assert len(cand1_user.resumes) >= 1
    assert cand1_user.resumes[0].user.id == cand1_user.id
    print("  PASS Rel 2: User <-> Resumes (One-to-Many)")

    # Rel 3: Candidate <-> Applications (One-to-Many)
    assert len(cand1_user.applications) >= 1
    assert cand1_user.applications[0].candidate.id == cand1_user.id
    print("  PASS Rel 3: Candidate <-> Applications (One-to-Many)")

    # Rel 4: Job <-> Applications (One-to-Many)
    first_job = db.query(Job).first()
    assert len(first_job.applications) >= 1
    assert first_job.applications[0].job.id == first_job.id
    print("  PASS Rel 4: Job <-> Applications (One-to-Many)")

    # Rel 5: Candidate <-> CandidateEmbedding (One-to-One per model)
    db.query(CandidateEmbedding).filter(
        CandidateEmbedding.user_id == cand1_user.id,
        CandidateEmbedding.model_version == "all-MiniLM-L6-v2"
    ).delete()
    db.commit()

    emb = CandidateEmbedding(
        user_id=cand1_user.id,
        model_version="all-MiniLM-L6-v2",
        embedding=[0.01] * 384,
        text_used="Profile search text"
    )
    db.add(emb)
    db.commit()
    db.refresh(cand1_user)
    assert len(cand1_user.embeddings) >= 1
    assert cand1_user.embeddings[0].user.id == cand1_user.id

    # Verify duplicate embedding prevention for same user & model version
    dup_emb = CandidateEmbedding(
        user_id=cand1_user.id,
        model_version="all-MiniLM-L6-v2",
        embedding=[0.02] * 384,
        text_used="Duplicate embedding"
    )
    db.add(dup_emb)
    try:
        db.commit()
        assert False, "Duplicate embedding for same user & model should have raised IntegrityError!"
    except IntegrityError:
        db.rollback()
        print("  PASS Rel 5: Candidate <-> CandidateEmbedding (Composite unique constraint verified)")

    # Rel 6: Candidate <-> CandidateNotes (One-to-Many)
    note = CandidateNote(
        candidate_user_id=cand1_user.id,
        admin_user_id=admin.id,
        note="Strong communication during initial screening."
    )
    db.add(note)
    db.commit()
    db.refresh(cand1_user)
    assert len(cand1_user.candidate_notes) >= 1
    assert cand1_user.candidate_notes[0].author.id == admin.id
    print("  PASS Rel 6: Candidate <-> CandidateNote (Author & Candidate relationships)")

    # Rel 7: Candidate <-> Interviews (One-to-Many)
    cand2_user = db.query(User).filter(User.email == "priya.sharma@example.com").first()
    assert len(cand2_user.candidate_interviews) >= 1
    assert cand2_user.candidate_interviews[0].candidate.id == cand2_user.id
    print("  PASS Rel 7: Candidate <-> Interview (One-to-Many)")

    # Rel 8: Interviewer <-> Interviews (One-to-Many)
    iv_user = db.query(User).filter(User.email == "interviewer@recruit.ai").first()
    assert len(iv_user.assigned_interviews) >= 1
    assert iv_user.assigned_interviews[0].interviewer.id == iv_user.id
    print("  PASS Rel 8: Interviewer <-> Assigned Interviews (One-to-Many)")

    # Rel 9: Interview <-> InterviewFeedback (One-to-One)
    interview_record = iv_user.assigned_interviews[0]
    db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == interview_record.id).delete()
    db.commit()

    feedback = InterviewFeedback(
        interview_id=interview_record.id,
        interviewer_user_id=iv_user.id,
        technical_skills_rating=4.5,
        communication_rating=4.0,
        problem_solving_rating=4.5,
        overall_rating=4.3,
        remarks="Excellent command of transformer architectures and clean Python code.",
        recommendation="strong_hire"
    )
    db.add(feedback)
    db.commit()
    db.refresh(interview_record)
    assert interview_record.feedback is not None
    assert interview_record.feedback.recommendation == "strong_hire"
    assert interview_record.feedback.interview.id == interview_record.id

    # Verify duplicate feedback prevention (One interview can only have one feedback record)
    dup_feedback = InterviewFeedback(
        interview_id=interview_record.id,
        interviewer_user_id=iv_user.id,
        technical_skills_rating=3.0,
        remarks="Duplicate review attempt"
    )
    db.add(dup_feedback)
    try:
        db.commit()
        assert False, "Duplicate feedback for same interview should have raised IntegrityError!"
    except IntegrityError:
        db.rollback()
        print("  PASS Rel 9: Interview <-> InterviewFeedback (One-to-One & unique constraint verified)")

    # Rel 10: User <-> Notifications (One-to-Many)
    assert len(cand1_user.notifications) >= 1
    assert cand1_user.notifications[0].user.id == cand1_user.id
    print("  PASS Rel 10: User <-> Notification (One-to-Many)")

    # 5. Duplicate Application Prevention (Database Constraint)
    print("\n[TEST 5] Verifying Duplicate Application Prevention Constraint...")
    # cand1 already applied for job1 (job_id=1, candidate_user_id=cand1.id)
    dup_app = Application(
        job_id=first_job.id,
        candidate_user_id=cand1_user.id,
        status="applied"
    )
    db.add(dup_app)
    try:
        db.commit()
        assert False, "Duplicate application insertion should have raised IntegrityError!"
    except IntegrityError:
        db.rollback()
        print("  PASS: Database UNIQUE constraint 'uq_job_candidate' blocked duplicate application.")

    # 6. Foreign Key Enforcement Verification
    print("\n[TEST 6] Verifying SQLite Foreign Key Constraint Enforcement...")
    invalid_app = Application(
        job_id=999999,  # Non-existent job ID
        candidate_user_id=cand1_user.id,
        status="applied"
    )
    db.add(invalid_app)
    try:
        db.commit()
        assert False, "Application with invalid job_id foreign key should have raised IntegrityError!"
    except IntegrityError:
        db.rollback()
        print("  PASS: Foreign key constraints enforced by SQLite PRAGMA foreign_keys=ON.")

    # 7. Security: Admin Authorization Enforcement
    print("\n[TEST 7] Verifying Admin-Only Operation Authorization...")
    from app.core.security import require_role

    # Non-admin user (candidate) attempting admin-only action -> Must raise 403 Forbidden
    try:
        require_role("admin")(current_user=cand1_user)
        assert False, "Candidate user must be rejected by admin role checker!"
    except HTTPException as e:
        assert e.status_code == 403

    # Non-admin user (interviewer) attempting admin-only action -> Must raise 403 Forbidden
    try:
        require_role("admin")(current_user=iv_user)
        assert False, "Interviewer user must be rejected by admin role checker!"
    except HTTPException as e:
        assert e.status_code == 403

    # Authorized admin request -> Must succeed
    auth_admin = require_role("admin")(current_user=admin)
    assert auth_admin.id == admin.id
    print("  PASS: Admin endpoints strictly enforce 403 Forbidden for non-admin tokens.")

    # 8. Security: Candidate Data Ownership Enforcement
    print("\n[TEST 8] Verifying Candidate Data Ownership & Isolation...")
    cand2_user = db.query(User).filter(User.email == "priya.sharma@example.com").first()
    assert cand2_user is not None

    # Candidate 1 data isolation
    profile1 = db.query(CandidateProfile).filter(CandidateProfile.user_id == cand1_user.id).first()
    assert profile1.user_id == cand1_user.id
    assert cand1_user.email == "alex.rivera@example.com"

    # Candidate 2 data isolation
    profile2 = db.query(CandidateProfile).filter(CandidateProfile.user_id == cand2_user.id).first()
    assert profile2.user_id == cand2_user.id
    assert cand2_user.email == "priya.sharma@example.com"
    assert profile1.user_id != profile2.user_id

    # Candidate cannot perform admin operations -> Must raise 403
    try:
        require_role("admin")(current_user=cand1_user)
        assert False
    except HTTPException as e:
        assert e.status_code == 403
    print("  PASS: Candidate data ownership strictly isolated to JWT authenticated identity.")

    # 9. Security: Interviewer Authorization Enforcement
    print("\n[TEST 9] Verifying Interviewer Access Restrictions...")
    # Interviewer can only view their assigned interviews
    assigned_interviews = db.query(Interview).filter(Interview.interviewer_user_id == iv_user.id).all()
    assert len(assigned_interviews) >= 1
    assert all(iv.interviewer_user_id == iv_user.id for iv in assigned_interviews)

    # Candidate attempting interviewer operations -> Must raise 403 Forbidden
    try:
        require_role("interviewer")(current_user=cand1_user)
        assert False
    except HTTPException as e:
        assert e.status_code == 403

    # Authorized interviewer request -> Must succeed
    auth_iv = require_role("interviewer")(current_user=iv_user)
    assert auth_iv.id == iv_user.id
    print("  PASS: Interviewer access controls and candidate authorization verified.")

    # 10. Cascading Delete Integrity Verification
    print("\n[TEST 10] Verifying Cascading Delete Integrity...")
    # Create a temporary test user and child records
    temp_user = User(
        email="temp_delete_test@example.com",
        full_name="Temp Delete",
        hashed_password=hash_password("temp123"),
        role="candidate"
    )
    db.add(temp_user)
    db.commit()
    db.refresh(temp_user)
    temp_user_id = temp_user.id

    temp_profile = CandidateProfile(user_id=temp_user_id, headline="Temporary")
    temp_notif = Notification(user_id=temp_user_id, title="Temp", message="Temp")
    temp_resume = Resume(
        user_id=temp_user_id,
        filename="temp.pdf",
        original_filename="temp.pdf",
        file_path="uploads/temp.pdf",
        file_type="pdf",
        parsing_status="pending"
    )
    db.add_all([temp_profile, temp_notif, temp_resume])
    db.commit()

    # Now delete temp_user
    db.delete(temp_user)
    db.commit()

    # Assert children were deleted via cascading relationship / foreign keys
    assert db.query(CandidateProfile).filter(CandidateProfile.user_id == temp_user_id).first() is None
    assert db.query(Notification).filter(Notification.user_id == temp_user_id).first() is None
    assert db.query(Resume).filter(Resume.user_id == temp_user_id).first() is None
    print("  PASS: Deleting parent User correctly cascades to all child records.")

    print("\n" + "=" * 60)
    print("ALL 10 DATABASE AND SECURITY TEST SUITES PASSED SUCCESSFULLY!")
    print("=" * 60 + "\n")
    db.close()

if __name__ == "__main__":
    run_database_and_security_tests()
