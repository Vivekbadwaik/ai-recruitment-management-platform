import os
import math
import re
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings

# Prefer offline local cache to prevent network stalls when weights are downloaded
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

# Global singleton model cache
_st_model = None
_model_init_error = None


def get_sentence_transformer():
    """
    Lazily loads the sentence-transformers all-MiniLM-L6-v2 model once as a singleton.
    Uses local cached weights without network delay.
    Raises RuntimeError with a clear message if initialization fails.
    """
    global _st_model, _model_init_error

    if _st_model is not None:
        return _st_model

    if _model_init_error is not None:
        raise RuntimeError(
            f"Sentence-Transformers model '{settings.EMBEDDING_MODEL_NAME}' failed to initialize: {_model_init_error}"
        )

    try:
        from sentence_transformers import SentenceTransformer
        try:
            _st_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, local_files_only=True)
        except Exception:
            _st_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        return _st_model
    except Exception as e:
        _model_init_error = str(e)
        raise RuntimeError(
            f"Failed to initialize SentenceTransformer model '{settings.EMBEDDING_MODEL_NAME}'. "
            f"Please ensure sentence-transformers and PyTorch are installed. Error: {e}"
        )


class CandidateEmbeddingService:
    """
    Enterprise-grade vector embedding and semantic search service.
    Powered by Sentence Transformers (all-MiniLM-L6-v2).
    Vectors are L2-normalized 384-dimensional embeddings.
    """

    MODEL_NAME = settings.EMBEDDING_MODEL_NAME  # "all-MiniLM-L6-v2"
    DIMENSION = 384  # Embedding dimension for all-MiniLM-L6-v2

    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """
        Generates a 384-dimensional L2-normalized embedding vector for text.
        Uses Sentence Transformers all-MiniLM-L6-v2.
        """
        if not text or not text.strip():
            return [0.0] * cls.DIMENSION

        clean_text = text.strip()
        model = get_sentence_transformer()

        # encode with normalize_embeddings=True to return unit vectors
        emb = model.encode(clean_text, normalize_embeddings=True)
        if hasattr(emb, "tolist"):
            return emb.tolist()
        return list(emb)

    @classmethod
    def cosine_similarity(cls, vec_a: List[float], vec_b: List[float]) -> float:
        """
        Calculates exact cosine similarity between two vectors:
            cos(theta) = (A . B) / (||A|| * ||B||)
        Returns a float between 0.0 and 1.0 (clamped).
        """
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))

        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0

        similarity = dot_product / (norm_a * norm_b)
        return max(0.0, min(1.0, float(similarity)))

    @classmethod
    def build_candidate_search_text(
        cls,
        full_name: Optional[str] = None,
        headline: Optional[str] = None,
        summary: Optional[str] = None,
        skills: Optional[List[str]] = None,
        experience: Optional[List[Dict[str, Any]]] = None,
        education: Optional[List[Dict[str, Any]]] = None,
        total_experience_years: Optional[float] = None
    ) -> str:
        """
        Builds a comprehensive, semantically rich representation of a candidate profile
        for embedding generation.
        """
        parts = []
        if full_name:
            parts.append(f"Candidate: {full_name}")
        if headline:
            parts.append(f"Title / Role: {headline}")
        if skills:
            parts.append(f"Skills: {', '.join(skills)}")
        if total_experience_years:
            parts.append(f"Total Experience: {total_experience_years} years")
        if summary:
            parts.append(f"Summary: {summary}")
        if experience:
            exp_strs = []
            for exp in experience:
                if isinstance(exp, dict):
                    t = exp.get("position") or exp.get("title") or ""
                    c = exp.get("company") or ""
                    d = exp.get("description") or ""
                    exp_strs.append(f"{t} at {c}: {d}".strip())
            if exp_strs:
                parts.append("Work History: " + " | ".join(exp_strs))
        if education:
            edu_strs = []
            for edu in education:
                if isinstance(edu, dict):
                    deg = edu.get("degree") or ""
                    field = edu.get("field") or edu.get("field_of_study") or ""
                    inst = edu.get("institution") or ""
                    edu_strs.append(f"{deg} in {field} from {inst}".strip())
            if edu_strs:
                parts.append("Education: " + " | ".join(edu_strs))

        return "\n".join(parts)

    @classmethod
    def build_job_search_text(
        cls,
        title: str,
        description: str,
        required_skills: Optional[List[str]] = None,
        preferred_skills: Optional[List[str]] = None
    ) -> str:
        """
        Builds a unified representation of a job posting for embedding generation.
        """
        parts = [f"Job Title: {title}", f"Description: {description}"]
        if required_skills:
            parts.append(f"Required Skills: {', '.join(required_skills)}")
        if preferred_skills:
            parts.append(f"Preferred Skills: {', '.join(preferred_skills)}")
        return "\n".join(parts)

    @classmethod
    def build_query_search_text(cls, query: str) -> str:
        """Normalizes and prepares a natural language query for vector search."""
        return query.strip()

    @classmethod
    def store_or_update_candidate_embedding(
        cls,
        db: Session,
        user_id: int,
        search_text: str
    ) -> List[float]:
        """
        Generates embedding and upserts into CandidateEmbedding record.
        Reuses existing record for (user_id, model_version) if present, updating embedding and text.
        """
        from app.models.candidate import CandidateEmbedding

        emb = cls.generate_embedding(search_text)

        cand_emb = db.query(CandidateEmbedding).filter(
            CandidateEmbedding.user_id == user_id,
            CandidateEmbedding.model_version == cls.MODEL_NAME
        ).first()

        if cand_emb:
            cand_emb.embedding = emb
            cand_emb.text_used = search_text
        else:
            cand_emb = CandidateEmbedding(
                user_id=user_id,
                model_version=cls.MODEL_NAME,
                embedding=emb,
                text_used=search_text
            )
            db.add(cand_emb)

        db.commit()
        db.refresh(cand_emb)
        return emb
