import json
import re
from typing import Optional, Dict, Any
from app.core.config import settings
from app.schemas.candidate import ParsedResumeData

try:
    from groq import Groq
except ImportError:
    Groq = None

GROQ_RESUME_PARSER_SYSTEM_PROMPT = """You are an expert AI recruitment assistant and resume parser.
Extract structured candidate information from the provided resume text into pure valid JSON.

You must strictly output a valid JSON object matching this structure:
{
  "full_name": "Candidate's full name, or null",
  "email": "Candidate's email address, or null",
  "phone": "Phone number, or null",
  "location": "City, State/Country, or null",
  "professional_summary": "Professional summary or objective statement from resume, or null",
  "total_experience_years": 0.0,
  "skills": ["Skill 1", "Skill 2"],
  "education": [
    {
      "degree": "Degree name e.g. B.S., M.S., Bachelor of Technology",
      "institution": "University / College name",
      "field": "Field of study e.g. Computer Science",
      "graduation_year": "Graduation year e.g. 2022"
    }
  ],
  "projects": [
    {
      "name": "Project title",
      "description": "Brief description of the project",
      "technologies": ["Python", "FastAPI"]
    }
  ],
  "employment_history": [
    {
      "company": "Company / Organization name",
      "position": "Job title / role",
      "start_date": "Start date e.g. 06/2021 or 2021",
      "end_date": "End date e.g. Present or 2023",
      "description": "Core responsibilities and technical accomplishments"
    }
  ]
}

STRICT GUIDELINES:
1. Extract ONLY facts supported by the text. NEVER hallucinate, invent, or extrapolate skills, degrees, or companies.
2. If total_experience_years is not explicitly written, compute it logically from employment history dates (as a decimal, e.g. 3.5).
3. If an item is not present in the resume, use null for strings and empty list [] for arrays.
4. Normalize technical skills into clean, recognized strings (e.g., "Python", "React", "PostgreSQL", "Docker").
5. Return ONLY the JSON object without any additional markdown text or commentary.
"""

class GroqResumeParser:
    """
    Parses resume text into structured Pydantic data using the Groq API.
    Model is dynamically configured via settings.GROQ_MODEL.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
        self.client = None

        if self.api_key and Groq is not None:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception:
                self.client = None

    def is_configured(self) -> bool:
        """Checks if Groq API credentials and client are available."""
        return bool(self.api_key and self.client)

    def parse_resume_text(self, resume_text: str) -> ParsedResumeData:
        """
        Parses resume text using Groq LLM and validates against ParsedResumeData.
        Raises ValueError with clear message if unconfigured, empty, or failed.
        """
        if not self.is_configured():
            raise ValueError(
                "Groq API key is not configured. Please set GROQ_API_KEY in backend/.env to enable live AI resume parsing."
            )

        if not resume_text or not resume_text.strip():
            raise ValueError("Resume text is empty. Cannot parse empty text.")

        # Cap text length to prevent context exhaustion while maintaining full resume detail
        clean_input = resume_text.strip()[:25000]

        # Prioritize configured model with automatic fallback across available Groq models
        candidate_models = [
            self.model,
            "qwen/qwen3.8-27b",
            "openai/gpt-oss-120b",
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
        ]
        models_to_try = []
        for m in candidate_models:
            if m and m not in models_to_try:
                models_to_try.append(m)

        raw_response = None
        last_exception = None

        for target_model in models_to_try:
            try:
                completion = self.client.chat.completions.create(
                    model=target_model,
                    messages=[
                        {"role": "system", "content": GROQ_RESUME_PARSER_SYSTEM_PROMPT},
                        {"role": "user", "content": f"Parse this resume:\n\n{clean_input}"}
                    ],
                    temperature=0.1,
                    max_tokens=4000,
                    response_format={"type": "json_object"}
                )
                raw_response = completion.choices[0].message.content
                if raw_response:
                    break
            except Exception as e:
                last_exception = e
                continue

        if not raw_response:
            raise ValueError(f"Groq API request failed: {str(last_exception)}")

        # Extract and parse JSON
        parsed_json = self.extract_json_from_response(raw_response)

        # Validate with Pydantic schema
        try:
            return ParsedResumeData(**parsed_json)
        except Exception as val_err:
            raise ValueError(f"Extracted resume data failed schema validation: {str(val_err)}")

    @classmethod
    def extract_json_from_response(cls, response_text: str) -> Dict[str, Any]:
        """
        Extracts and parses JSON object from LLM response text,
        handling markdown fences, leading/trailing text, and common formatting artifacts.
        """
        if not response_text:
            raise ValueError("Empty response received from LLM.")

        cleaned = response_text.strip()

        # Remove markdown code fences if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()

        # Direct parse attempt
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Locate outer JSON braces
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            snippet = cleaned[start:end+1]
            try:
                return json.loads(snippet)
            except json.JSONDecodeError as err:
                raise ValueError(f"Malformed JSON returned by LLM: {str(err)}")

        raise ValueError("Failed to locate valid JSON object in AI response.")
