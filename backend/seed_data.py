import os
import sys
from datetime import datetime, timezone, timedelta

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, init_db
from app.core.security import hash_password
from app.models.user import User
from app.models.candidate import CandidateProfile, Resume, CandidateEmbedding, CandidateNote
from app.models.job import Job, Application
from app.models.interview import Interview, InterviewFeedback
from app.models.notification import Notification
from app.services.embedding_service import CandidateEmbeddingService

def seed():
    """Seeds the database with realistic fictional data complying with all specifications."""
    init_db()
    db = SessionLocal()

    print("Checking existing data...")
    # Safe cleanup in correct foreign-key dependency order
    db.query(InterviewFeedback).delete()
    db.query(Interview).delete()
    db.query(Application).delete()
    db.query(Job).delete()
    db.query(CandidateNote).delete()
    db.query(CandidateEmbedding).delete()
    db.query(Resume).delete()
    db.query(CandidateProfile).delete()
    db.query(Notification).delete()
    db.query(User).delete()
    db.commit()

    # 1. Accounts
    print("Creating user accounts...")
    admin = User(
        email="admin@recruit.ai",
        full_name="Sarah Jenkins",
        hashed_password=hash_password("admin123"),
        role="admin"
    )
    interviewer = User(
        email="interviewer@recruit.ai",
        full_name="David Chen",
        hashed_password=hash_password("interviewer123"),
        role="interviewer"
    )
    cand1 = User(
        email="alex.rivera@example.com",
        full_name="Alex Rivera",
        hashed_password=hash_password("candidate123"),
        role="candidate"
    )
    cand2 = User(
        email="priya.sharma@example.com",
        full_name="Priya Sharma",
        hashed_password=hash_password("candidate123"),
        role="candidate"
    )

    db.add_all([admin, interviewer, cand1, cand2])
    db.commit()
    for u in [admin, interviewer, cand1, cand2]:
        db.refresh(u)

    # 2. Candidate Profiles (Fictional, unparsed raw candidates ready for genuine AI evaluation)
    print("Creating candidate profiles...")
    prof1 = CandidateProfile(
        user_id=cand1.id,
        phone="+1 (555) 234-5678",
        location="San Francisco, CA",
        headline="Full Stack Python & React Developer",
        summary="Software engineer with 4 years of experience building resilient microservices with Python, FastAPI, and dynamic SPAs using React.",
        skills=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "Tailwind CSS"],
        education=[{
            "institution": "University of California, Berkeley",
            "degree": "Bachelor of Science",
            "field_of_study": "Computer Science",
            "start_year": "2018",
            "end_year": "2022",
            "grade": "3.8 GPA"
        }],
        experience=[
            {
                "company": "CloudScale Systems",
                "title": "Software Engineer",
                "location": "San Francisco, CA",
                "start_date": "2022-07",
                "end_date": "Present",
                "is_current": True,
                "description": "Architected resilient REST APIs with FastAPI, reduced latency by 35%, built React management dashboard."
            },
            {
                "company": "NexTech Labs",
                "title": "Junior Developer Intern",
                "location": "San Jose, CA",
                "start_date": "2021-06",
                "end_date": "2022-05",
                "is_current": False,
                "description": "Implemented React UI components and automated backend integration tests."
            }
        ],
        projects=[{
            "name": "DevPulse Analytics",
            "description": "Real-time metrics visualizer for distributed microservices.",
            "technologies": ["React", "FastAPI", "WebSockets"],
            "link": "https://github.com/example/devpulse"
        }],
        total_experience_years=4.0,
        is_ai_parsed=0
    )

    prof2 = CandidateProfile(
        user_id=cand2.id,
        phone="+1 (555) 345-6789",
        location="New York, NY",
        headline="Senior Machine Learning & Data Engineer",
        summary="5+ years of experience applying deep learning, natural language processing, transformer architectures, and building production MLOps pipelines.",
        skills=["Python", "PyTorch", "NLP", "Machine Learning", "FastAPI", "SQL", "Docker", "AWS"],
        education=[
            {
                "institution": "Columbia University",
                "degree": "Master of Science",
                "field_of_study": "Data Science & AI",
                "start_year": "2019",
                "end_year": "2021",
                "grade": "3.9 GPA"
            },
            {
                "institution": "IIT Delhi",
                "degree": "Bachelor of Technology",
                "field_of_study": "Computer Engineering",
                "start_year": "2015",
                "end_year": "2019",
                "grade": "9.1/10"
            }
        ],
        experience=[{
            "company": "DeepVision Technologies",
            "title": "Senior ML Engineer",
            "location": "New York, NY",
            "start_date": "2021-08",
            "end_date": "Present",
            "is_current": True,
            "description": "Designed embedding-based search retrieval reducing query error by 40%. Deployed inference microservices on AWS ECS."
        }],
        projects=[{
            "name": "SemanticDoc Search",
            "description": "High-throughput semantic vector search engine for legal corpora.",
            "technologies": ["Python", "Hugging Face", "FastAPI"],
            "link": "https://github.com/example/semantic-doc"
        }],
        total_experience_years=5.5,
        is_ai_parsed=0
    )

    db.add_all([prof1, prof2])
    db.commit()

    # Generate genuine candidate embeddings for semantic search & AI matching
    print("Generating candidate embeddings with all-MiniLM-L6-v2...")
    text1 = CandidateEmbeddingService.build_candidate_search_text(
        full_name=cand1.full_name,
        headline=prof1.headline,
        summary=prof1.summary,
        skills=prof1.skills,
        experience=prof1.experience,
        education=prof1.education,
        total_experience_years=prof1.total_experience_years
    )
    CandidateEmbeddingService.store_or_update_candidate_embedding(db, cand1.id, text1)

    text2 = CandidateEmbeddingService.build_candidate_search_text(
        full_name=cand2.full_name,
        headline=prof2.headline,
        summary=prof2.summary,
        skills=prof2.skills,
        experience=prof2.experience,
        education=prof2.education,
        total_experience_years=prof2.total_experience_years
    )
    CandidateEmbeddingService.store_or_update_candidate_embedding(db, cand2.id, text2)

    # 3. Job Postings
    print("Creating job openings...")
    now = datetime.now(timezone.utc)
    job1 = Job(
        title="Senior Full Stack Python/React Engineer",
        description="We are seeking an experienced Full Stack Engineer to lead the architecture of our cloud recruitment suite. You will design resilient FastAPI backends, collaborate on responsive React dashboards, and integrate AI pipelines.",
        required_skills=["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
        preferred_skills=["TypeScript", "Redis", "Tailwind CSS"],
        min_experience=3.0,
        max_experience=6.0,
        education_requirements="Bachelor's degree in Computer Science or related field",
        location="Remote (US)",
        employment_type="Full-time",
        application_deadline=now + timedelta(days=30),
        status="active",
        created_by=admin.id
    )

    job2 = Job(
        title="AI/ML Engineer - NLP & Semantic Search",
        description="Join our AI engineering team to build advanced embedding models, LLM retrieval systems, and candidate ranking algorithms. Must have deep hands-on expertise with PyTorch, transformers, and vector databases.",
        required_skills=["Python", "PyTorch", "NLP", "Machine Learning", "Transformers"],
        preferred_skills=["FastAPI", "Docker", "AWS"],
        min_experience=3.0,
        max_experience=8.0,
        education_requirements="Master's degree or higher in Computer Science, AI or Data Science",
        location="New York, NY (Hybrid)",
        employment_type="Full-time",
        application_deadline=now + timedelta(days=45),
        status="active",
        created_by=admin.id
    )

    job3 = Job(
        title="Frontend UI/UX Developer",
        description="Looking for a passionate frontend developer to craft modern, accessible web applications using React, Tailwind CSS, and shadcn/ui.",
        required_skills=["React", "JavaScript", "HTML5", "CSS3", "Tailwind CSS"],
        preferred_skills=["TypeScript", "Figma"],
        min_experience=2.0,
        max_experience=4.0,
        education_requirements="Bachelor's degree or equivalent practical experience",
        location="Austin, TX / Remote",
        employment_type="Full-time",
        application_deadline=now + timedelta(days=20),
        status="active",
        created_by=admin.id
    )

    db.add_all([job1, job2, job3])
    db.commit()
    for j in [job1, job2, job3]:
        db.refresh(j)

    # 4. Sample Applications (Without fabricated AI scores)
    print("Creating sample applications...")
    app1 = Application(
        job_id=job1.id,
        candidate_user_id=cand1.id,
        status="applied",
        ai_match_score=None,
        ai_recommendation=None
    )

    app2 = Application(
        job_id=job2.id,
        candidate_user_id=cand2.id,
        status="interview",
        ai_match_score=None,
        ai_recommendation=None
    )

    db.add_all([app1, app2])
    db.commit()
    for a in [app1, app2]:
        db.refresh(a)

    # 5. Interview Record
    print("Scheduling interview...")
    iv1 = Interview(
        application_id=app2.id,
        candidate_user_id=cand2.id,
        interviewer_user_id=interviewer.id,
        job_id=job2.id,
        scheduled_date=now + timedelta(days=2, hours=3),
        duration_minutes=60,
        interview_type="technical",
        status="scheduled",
        meeting_link="https://meet.google.com/xyz-recruitment-demo",
        notes="Technical architecture review focusing on transformer architectures, cosine similarity search pipelines, and Python concurrency."
    )
    db.add(iv1)

    # 6. Notifications
    print("Creating initial notifications...")
    n1 = Notification(
        user_id=cand1.id,
        title="Application Received",
        message=f"Your application for '{job1.title}' has been received by the recruiting team.",
        type="info",
        link="/candidate/applications"
    )
    n2 = Notification(
        user_id=cand2.id,
        title="Technical Interview Scheduled",
        message=f"Your technical interview for '{job2.title}' with David Chen is scheduled.",
        type="info",
        link="/candidate/interviews"
    )
    n3 = Notification(
        user_id=interviewer.id,
        title="Upcoming Interview Assigned",
        message=f"You are assigned to conduct a technical interview with Priya Sharma for '{job2.title}'.",
        type="info",
        link="/interviewer/interviews"
    )
    db.add_all([n1, n2, n3])
    db.commit()

    print("\n" + "=" * 50)
    print("SEED DATA SUMMARY:")
    print("  Admin:       admin@recruit.ai / admin123")
    print("  Interviewer: interviewer@recruit.ai / interviewer123")
    print("  Candidate 1: alex.rivera@example.com / candidate123")
    print("  Candidate 2: priya.sharma@example.com / candidate123")
    print(f"  Jobs Created:         3 (IDs: {job1.id}, {job2.id}, {job3.id})")
    print(f"  Profiles Created:     2")
    print(f"  Applications Created: 2 (IDs: {app1.id}, {app2.id})")
    print(f"  Interviews Scheduled: 1 (ID: {iv1.id})")
    print("=" * 50 + "\n")
    db.close()

if __name__ == "__main__":
    seed()
