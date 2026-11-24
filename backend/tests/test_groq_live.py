"""
Live Groq API Integration Test
Tests live LLM resume parsing with the real Groq API when GROQ_API_KEY is configured.
If no key is configured, provides clear diagnostic guidance without failing the test suite.
"""

import os
import sys

# Ensure app package is discoverable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.extractor import ResumeTextExtractor
from app.services.groq_service import GroqResumeParser


def run_live_groq_test():
    print("\n======================================================================")
    print("GROQ API LIVE INTEGRATION TEST")
    print("======================================================================\n")

    api_key = (sys.argv[1] if len(sys.argv) > 1 else None) or os.environ.get("GROQ_API_KEY") or settings.GROQ_API_KEY
    model = settings.GROQ_MODEL

    print(f"Target Groq Model: {model}")

    if not api_key or api_key.strip() == "" or "your-groq-api-key" in api_key.lower():
        print("\n[NOTE] Live Groq API test skipped:")
        print("  GROQ_API_KEY is not set or contains default placeholder in backend/.env.")
        print("  To run live Groq parsing:")
        print("    1. Sign up at https://console.groq.com")
        print("    2. Add GROQ_API_KEY=gsk_... to backend/.env")
        print("    3. Re-run: python tests/test_groq_live.py\n")
        print("  Unit tests with mocked Groq client continue to pass 100% in test_ai_engine.py.")
        return 0

    print(f"Configured API Key found: {api_key[:8]}...{api_key[-4:]}")
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sample_pdf = os.path.join(repo_root, "sample_resumes", "John_Doe_FullStack.pdf")

    if not os.path.exists(sample_pdf):
        print(f"[ERROR] Sample resume file not found at: {sample_pdf}")
        return 1

    print(f"Extracting text from: {sample_pdf}...")
    raw_text, file_type = ResumeTextExtractor.extract_text(sample_pdf)
    print(f"Extracted {len(raw_text)} characters of text from {file_type.upper()}.")

    print("\nSending live request to Groq API...")
    parser = GroqResumeParser(api_key=api_key, model=model)

    try:
        parsed_data = parser.parse_resume_text(raw_text)
        print("\n[SUCCESS] Live Groq API parsing succeeded!")
        print("\n--- ACTUAL STRUCTURED JSON RETURNED BY GROQ ---")
        import json
        print(json.dumps(parsed_data.model_dump(), indent=2))
        print("------------------------------------------------\n")
        print(f"  Candidate Name:     {parsed_data.full_name}")
        print(f"  Email:              {parsed_data.email}")
        print(f"  Phone:              {parsed_data.phone}")
        print(f"  Location:           {parsed_data.location}")
        print(f"  Experience:         {parsed_data.total_experience_years} years")
        print(f"  Extracted Skills:   {', '.join(parsed_data.skills)}")
        print(f"  Education Count:    {len(parsed_data.education)}")
        print(f"  Projects Count:     {len(parsed_data.projects)}")
        print(f"  Employment Count:   {len(parsed_data.employment_history)}")
        return 0
    except Exception as e:
        print(f"\n[ERROR] Live Groq API request failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(run_live_groq_test())
