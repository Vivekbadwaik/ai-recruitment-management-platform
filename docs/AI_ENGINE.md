# AI Engine Architecture & Implementation Guide

## 1. AI Engine Overview & Architecture

The AI Recruitment & Interview Management Platform incorporates an enterprise-grade, multi-stage Artificial Intelligence engine combining Generative AI (LLMs) and Vector Embeddings (Semantic Search & Matching).

```
+-----------------------------------------------------------------------------------------+
|                                    AI RECRUITMENT ENGINE                                 |
+-----------------------------------------------------------------------------------------+
                                             |
                   +-------------------------+-------------------------+
                   |                                                   |
                   v                                                   v
      [RESUME INGESTION PIPELINE]                         [SEMANTIC SEARCH & MATCHING]
                   |                                                   |
   1. Multi-format Extraction (PyMuPDF / docx)          1. Sentence Transformers (384-dim)
   2. Cleaning & Sanitization                           2. L2-Normalized Vector Embeddings
   3. Groq LLM Extraction (Llama 3.3 70B)               3. Cosine Similarity Calculation
   4. Pydantic Schema Validation (ParsedResumeData)     4. 5-Factor Pure Python Match Formula
   5. SQLite Profile & Embedding Persistence            5. Explainable AI Breakdown & Text
                   |                                                   |
                   +-------------------------+-------------------------+
                                             |
                                             v
                           [HUMAN-IN-THE-LOOP OVERRIDE]
                           - AI Recommendation Visibility
                           - Recruiter Final Authority
                           - Internal Recruiter Notes & Audit Trail
```

---

## 2. Resume Text Extraction Pipeline (`extractor.py`)

The extraction pipeline is implemented in `app/services/extractor.py` under `ResumeTextExtractor`:

- **PDF Documents**: Extracted page-by-page using **PyMuPDF (`pymupdf`)**, extracting text blocks, metadata, and preserving visual line breaks.
- **DOCX Documents**: Extracted using **`python-docx`**, traversing paragraph runs and tabular grid layouts to capture structured job experiences and educational tables.
- **Empty Document Protection**: Immediately detects 0-byte files or documents containing 0 readable characters (e.g. un-OCR'd scanned images) and raises informative `ValueError`.
- **Corrupted Document Protection**: Traps binary corruption and malformed headers gracefully, returning descriptive error messages.
- **Unsupported File Filtering**: Enforces strict extension gating (`.pdf`, `.docx`, `.doc`), rejecting unauthorized filetypes with HTTP 400.
- **Text Normalization (`clean_text`)**: Strips null bytes (`\x00`), non-printable ASCII control characters, normalizes Windows (`\r\n`) and Mac (`\r`) newlines, and collapses excessive whitespace.

---

## 3. Groq LLM Resume Parsing (`groq_service.py`)

Resume parsing utilizes the **Groq API** with ultra-fast inference speed and high accuracy.

### Configuration
- **Model**: Configured via `settings.GROQ_MODEL` (default: `llama-3.3-70b-versatile`, with graceful fallback to `llama-3.1-8b-instant`).
- **Temperature**: Set to `0.1` for deterministic, fact-grounded structured extraction.
- **Response Format**: Uses JSON Object enforcement (`{"type": "json_object"}`).

### Prompt Engineering
The system prompt strictly commands the LLM to:
1. Extract only facts directly stated in the resume text; hallucination or extrapolation is strictly forbidden.
2. Calculate total professional experience years from employment dates if not explicitly stated.
3. Normalize technical skills into industry-standard names (e.g., "Python", "FastAPI", "React", "PostgreSQL", "Docker").
4. Return pure JSON without conversational filler or markdown code blocks.

### Malformed Output Recovery (`extract_json_from_response`)
- Strips markdown code fences (````json ... ````).
- Implements brace-matching fallback (`{` ... `}`) to isolate JSON from any conversational commentary.
- Validates the resulting payload through Pydantic's `ParsedResumeData`.

---

## 4. Structured JSON Schema (`ParsedResumeData`)

The exact extracted resume schema:

```json
{
  "full_name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+1-555-0144",
  "location": "San Francisco, CA",
  "professional_summary": "Senior Full Stack Engineer with 6 years experience building distributed backend systems.",
  "total_experience_years": 6.0,
  "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Kubernetes"],
  "education": [
    {
      "degree": "B.S.",
      "institution": "Stanford University",
      "field": "Computer Science",
      "graduation_year": "2018"
    }
  ],
  "projects": [
    {
      "name": "Cloud Microservices",
      "description": "High-throughput messaging and event processing platform.",
      "technologies": ["Python", "Redis", "Kafka"]
    }
  ],
  "employment_history": [
    {
      "company": "Tech Corp",
      "position": "Senior Software Engineer",
      "start_date": "2020",
      "end_date": "Present",
      "description": "Architected low-latency microservices serving 10M daily active users."
    }
  ]
}
```

---

## 5. Embedding Generation with Sentence Transformers (`embedding_service.py`)

Vector representations are powered by **Sentence Transformers (`sentence-transformers 6.3.0`)**:

- **Model**: `all-MiniLM-L6-v2` (384-dimensional dense vector space).
- **Singleton Architecture**: `get_sentence_transformer()` caches the loaded model in memory once to eliminate re-initialization overhead.
- **Offline Reliability**: Configured with `local_files_only=True`, `HF_HUB_OFFLINE=1`, and `TRANSFORMERS_OFFLINE=1` to guarantee local execution without external network dependency.
- **Unified Vector Space**: The exact same embedding model is used for:
  1. Candidate resume / profile text
  2. Job postings and requirement specifications
  3. Natural language recruiter search queries
- **L2 Vector Normalization**: Every generated embedding is unit-normalized ($\|v\|_2 = 1.0$), simplifying cosine similarity to an efficient dot product.
- **Persistence (`CandidateEmbedding`)**: Stored in SQLite as JSON arrays alongside `model_version="all-MiniLM-L6-v2"` and the source `text_used`. Unique constraint `uq_candidate_embedding_model` guarantees idempotency and prevents duplicate vector records.

---

## 6. Vector Semantic Search (`/api/admin/semantic-search`)

Recruiters can discover qualified talent using natural language queries (e.g., *"Find candidates with Python, machine learning, and experience building REST APIs"*).

### Pipeline:
1. The search query string is converted to a 384-dimensional normalized vector $Q$.
2. All stored candidate vectors $C_i$ are retrieved from `candidate_embeddings`.
3. Cosine similarity is computed:
   $$\text{sim}(Q, C_i) = \frac{Q \cdot C_i}{\|Q\|_2 \cdot \|C_i\|_2} = \sum_{k=1}^{384} Q_k \cdot C_{i,k}$$
4. Results are filtered by `min_score` (default: 0.0%), sorted in descending order of similarity, and paginated using `limit` and `skip`.
5. Supported via both `GET /api/admin/semantic-search?q=...` and `POST /api/admin/semantic-search`.

---

## 7. 5-Factor Candidate Matching Algorithm (`matching_service.py`)

Unlike unreliable LLM-hallucinated match scores, our scoring engine runs **100% deterministic pure Python business logic** across five distinct factors:

$$\text{Overall Score} = (S_{\text{req}} \times 0.40) + (S_{\text{exp}} \times 0.20) + (S_{\text{edu}} \times 0.10) + (S_{\text{pref}} \times 0.10) + (S_{\text{sem}} \times 0.20)$$

| Factor | Weight | Scoring Mechanism |
|---|---|---|
| **Required Technical Skills** | **40%** | Normalized token matching between candidate skills and job requirements: $\frac{|\text{Matched}|}{|\text{Required}|} \times 100$. |
| **Relevant Experience** | **20%** | Pro-rated based on candidate experience vs `min_experience` and target `max_experience`. Full credit (100%) when meeting/exceeding minimum requirement. |
| **Education Match** | **10%** | Degree level hierarchy (PhD: 4, Master's: 3, Bachelor's: 2, Associate: 1). Full credit (100%) if meeting/exceeding job education requirements. |
| **Preferred Skills** | **10%** | Bonus evaluation of secondary/preferred technologies: $\frac{|\text{Matched Preferred}|}{|\text{Preferred}|} \times 100$. |
| **Semantic Similarity** | **20%** | Dense vector context alignment between complete candidate profile and job description: $\text{Cosine Similarity} \times 100$. |

---

## 8. Explainable AI (XAI) Generation

Every match computation generates an **`AIMatchBreakdown`** object with rich, transparent diagnostics:
- Overall match score (0.0 to 100.0%)
- Categorized match tier:
  - **Strong Match ($\ge 80\%$)**: Exceptional alignment across all criteria.
  - **Good Match ($60\% - 79\%$)**: Strong core alignment with minor gaps.
  - **Moderate Match ($40\% - 59\%$)**: Transferable skills with notable gaps.
  - **Low Match ($< 40\%$)**: Substantial divergence from requirements.
- Matched required skills list
- Missing required skills list
- Matched preferred skills list
- Candidate years vs required min/max years summary
- Candidate degree vs required degree summary
- Cohesive natural language explanation paragraph synthesizing the assessment.

---

## 9. Human-in-the-Loop (HITL) Recruiter Overrides

The platform guarantees recruiter sovereignty over algorithmic recommendations:
- The AI score (`ai_match_score`) and recommendation (`ai_recommendation`) remain visible and immutable as transparent data points.
- Recruiter decisions (`admin_decision`) and internal recruiter commentary (`admin_notes`) are stored independently in the `Application` record.
- Recruiters can promote candidates with non-traditional backgrounds, override low scores, or reject candidates despite high semantic scores.
- All actions are logged and trigger automated candidate notifications.
- Endpoints:
  - `PUT /api/admin/applications/{app_id}/override`
  - `PUT /api/admin/applications/{app_id}/status`
