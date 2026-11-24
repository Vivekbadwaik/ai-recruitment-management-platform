import re
from typing import List, Dict, Any, Optional, Tuple
from app.schemas.matching import AIMatchBreakdown
from app.services.embedding_service import CandidateEmbeddingService

class CandidateMatchingEngine:
    """
    Pure Python hybrid candidate matching engine.
    Weights:
      - Required Technical Skills Match: 40%
      - Relevant Experience Match: 20%
      - Education Match: 10%
      - Preferred Skills Match: 10%
      - Semantic Similarity: 20%
    All components normalized to 0 - 100 scale before weighting.
    """

    @classmethod
    def calculate_match(
        cls,
        candidate_profile: Dict[str, Any],
        job_data: Dict[str, Any],
        candidate_embedding: Optional[List[float]] = None
    ) -> AIMatchBreakdown:
        # 1. Required Technical Skills Match (40%)
        req_score, matched_req, missing_req = cls._score_skills(
            candidate_skills=candidate_profile.get("skills") or [],
            job_skills=job_data.get("required_skills") or []
        )

        # 2. Preferred Skills Match (10%)
        pref_score, matched_pref, missing_pref = cls._score_skills(
            candidate_skills=candidate_profile.get("skills") or [],
            job_skills=job_data.get("preferred_skills") or []
        )

        # 3. Experience Match (20%)
        candidate_years = float(candidate_profile.get("total_experience_years") or 0.0)
        min_years = float(job_data.get("min_experience") or 0.0)
        max_years = job_data.get("max_experience")
        max_years_float = float(max_years) if max_years is not None else None

        exp_score, exp_summary = cls._score_experience(
            candidate_years=candidate_years,
            min_years=min_years,
            max_years=max_years_float
        )

        # 4. Education Match (10%)
        edu_score, cand_edu_str, job_edu_req, edu_summary = cls._score_education(
            candidate_education=candidate_profile.get("education") or [],
            job_education_req=job_data.get("education_requirements")
        )

        # 5. Semantic Similarity (20%)
        # Build job search text and embedding
        job_text = f"{job_data.get('title', '')}\n{job_data.get('description', '')}\nRequired: {', '.join(job_data.get('required_skills') or [])}"
        job_embedding = CandidateEmbeddingService.generate_embedding(job_text)

        if candidate_embedding and len(candidate_embedding) == len(job_embedding):
            semantic_sim = CandidateEmbeddingService.cosine_similarity(candidate_embedding, job_embedding)
        else:
            cand_text = CandidateEmbeddingService.build_candidate_search_text(
                headline=candidate_profile.get("headline"),
                summary=candidate_profile.get("summary"),
                skills=candidate_profile.get("skills"),
                experience=candidate_profile.get("experience"),
                education=candidate_profile.get("education"),
                total_experience_years=candidate_years
            )
            cand_emb = CandidateEmbeddingService.generate_embedding(cand_text)
            semantic_sim = CandidateEmbeddingService.cosine_similarity(cand_emb, job_embedding)

        # Normalize semantic similarity (0.0 - 1.0) to (0.0 - 100.0)
        semantic_score = round(semantic_sim * 100.0, 1)

        # Calculate Overall Weighted Score (0 - 100)
        # Weights: 0.40, 0.20, 0.10, 0.10, 0.20
        overall = (
            (req_score * 0.40) +
            (exp_score * 0.20) +
            (edu_score * 0.10) +
            (pref_score * 0.10) +
            (semantic_score * 0.20)
        )
        overall_score = round(max(0.0, min(100.0, overall)), 1)

        # Generate Explainable AI breakdown
        explanation = cls._generate_explanation(
            overall_score=overall_score,
            req_score=req_score,
            matched_req=matched_req,
            missing_req=missing_req,
            matched_pref=matched_pref,
            candidate_years=candidate_years,
            min_years=min_years,
            exp_summary=exp_summary,
            edu_summary=edu_summary,
            semantic_score=semantic_score
        )

        return AIMatchBreakdown(
            required_skill_score=round(req_score, 1),
            experience_score=round(exp_score, 1),
            education_score=round(edu_score, 1),
            preferred_skill_score=round(pref_score, 1),
            semantic_similarity_score=round(semantic_score, 1),
            overall_match_score=overall_score,
            matched_required_skills=matched_req,
            missing_required_skills=missing_req,
            matched_preferred_skills=matched_pref,
            missing_preferred_skills=missing_pref,
            candidate_experience_years=candidate_years,
            required_experience_min=min_years,
            required_experience_max=max_years_float,
            experience_summary=exp_summary,
            candidate_education_summary=cand_edu_str,
            job_education_requirements=job_edu_req,
            education_summary=edu_summary,
            explanation=explanation
        )

    @classmethod
    def _score_skills(cls, candidate_skills: List[str], job_skills: List[str]) -> Tuple[float, List[str], List[str]]:
        if not job_skills:
            return 100.0, [], []

        matched = []
        missing = []
        cand_norm = {cls._normalize_skill(s): s for s in candidate_skills}

        for j_skill in job_skills:
            norm_j = cls._normalize_skill(j_skill)
            # Exact or substring match
            found = False
            for c_norm, orig_c in cand_norm.items():
                if norm_j == c_norm or norm_j in c_norm or c_norm in norm_j:
                    matched.append(j_skill)
                    found = True
                    break
            if not found:
                missing.append(j_skill)

        score = (len(matched) / len(job_skills)) * 100.0
        return score, matched, missing

    @classmethod
    def _score_experience(
        cls, candidate_years: float, min_years: float, max_years: Optional[float]
    ) -> Tuple[float, str]:
        if min_years <= 0.0:
            return 100.0, f"Candidate has {candidate_years:.1f} years (no minimum requirement)."

        if candidate_years >= min_years:
            if max_years and candidate_years > max_years * 1.5:
                # Slightly overqualified but still solid
                return 85.0, f"Candidate has {candidate_years:.1f} years, exceeding the target range of {min_years}-{max_years} years."
            elif max_years and candidate_years > max_years:
                return 95.0, f"Candidate has {candidate_years:.1f} years, within target window ({min_years}-{max_years} years)."
            else:
                return 100.0, f"Candidate meets or exceeds requirement with {candidate_years:.1f} years (min: {min_years} years)."
        else:
            # Partial credit based on fraction achieved
            ratio = candidate_years / min_years
            score = max(20.0, ratio * 100.0)
            return score, f"Candidate has {candidate_years:.1f} years, which is below the minimum required {min_years} years."

    @classmethod
    def _score_education(
        cls, candidate_education: List[Dict[str, Any]], job_education_req: Optional[str]
    ) -> Tuple[float, str, Optional[str], str]:
        if not job_education_req or not job_education_req.strip():
            # No specific educational gate
            return 100.0, cls._format_edu_list(candidate_education), None, "No specific educational requirement specified."

        cand_edu_str = cls._format_edu_list(candidate_education)
        req_lower = job_education_req.lower()

        degree_levels = {
            "phd": 4, "doctorate": 4,
            "master": 3, "ms": 3, "msc": 3, "mtech": 3, "mba": 3,
            "bachelor": 2, "bs": 2, "bsc": 2, "btech": 2, "be": 2, "bba": 2,
            "associate": 1, "diploma": 1
        }

        # Check candidate degree level
        cand_level = 0
        for edu in candidate_education:
            deg = (edu.get("degree") or "").lower()
            field = (edu.get("field_of_study") or "").lower()
            combined = f"{deg} {field}"
            for d_name, lvl in degree_levels.items():
                if d_name in combined:
                    cand_level = max(cand_level, lvl)

        # Check job requirement level
        job_level = 0
        for d_name, lvl in degree_levels.items():
            if d_name in req_lower:
                job_level = max(job_level, lvl)

        if job_level == 0:
            # Mentioned custom education (e.g. "Computer Science degree")
            matches = any(token in cand_edu_str.lower() for token in req_lower.split() if len(token) > 3)
            score = 90.0 if matches else 60.0
            summary = "Candidate's educational background aligns with requirements." if matches else "Candidate's education partially matches requirements."
            return score, cand_edu_str, job_education_req, summary

        if cand_level >= job_level:
            return 100.0, cand_edu_str, job_education_req, f"Candidate meets or exceeds education requirement ({job_education_req})."
        elif cand_level == job_level - 1:
            return 70.0, cand_edu_str, job_education_req, f"Candidate has related degree level ({cand_edu_str}) close to requested {job_education_req}."
        else:
            return 50.0, cand_edu_str, job_education_req, f"Candidate holds {cand_edu_str or 'unspecified degree'}, while {job_education_req} is requested."

    @classmethod
    def _generate_explanation(
        cls,
        overall_score: float,
        req_score: float,
        matched_req: List[str],
        missing_req: List[str],
        matched_pref: List[str],
        candidate_years: float,
        min_years: float,
        exp_summary: str,
        edu_summary: str,
        semantic_score: float
    ) -> str:
        paragraphs = []
        if overall_score >= 80:
            paragraphs.append(f"Strong Match ({overall_score:.1f}%): Candidate demonstrates exceptional alignment with the job specifications.")
        elif overall_score >= 60:
            paragraphs.append(f"Good Match ({overall_score:.1f}%): Candidate meets core criteria with minor skill or experience gaps.")
        elif overall_score >= 40:
            paragraphs.append(f"Moderate Match ({overall_score:.1f}%): Candidate possesses transferable skills but lacks several key requirements.")
        else:
            paragraphs.append(f"Low Match ({overall_score:.1f}%): Significant differences between candidate profile and job requirements.")

        # Skills breakdown
        if matched_req:
            paragraphs.append(f"Matched Required Skills: {', '.join(matched_req)}.")
        if missing_req:
            paragraphs.append(f"Missing Required Skills: {', '.join(missing_req)}.")
        if matched_pref:
            paragraphs.append(f"Preferred Skills Present: {', '.join(matched_pref)}.")

        # Experience & Education
        paragraphs.append(f"Experience: {exp_summary}")
        paragraphs.append(f"Education: {edu_summary}")
        paragraphs.append(f"Semantic Alignment: {semantic_score:.1f}% context similarity with the job description.")

        return " ".join(paragraphs)

    @staticmethod
    def _normalize_skill(s: str) -> str:
        return re.sub(r"[^a-z0-9]", "", s.lower())

    @staticmethod
    def _format_edu_list(edu_list: List[Dict[str, Any]]) -> str:
        if not edu_list:
            return "Not specified"
        parts = []
        for e in edu_list:
            deg = e.get("degree") or ""
            inst = e.get("institution") or ""
            parts.append(f"{deg} ({inst})".strip())
        return ", ".join(parts)
