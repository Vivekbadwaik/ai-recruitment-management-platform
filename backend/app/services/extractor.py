import os
import re
from typing import Tuple, Optional
import pymupdf as fitz
import docx

class ResumeTextExtractor:
    """
    Robust resume text extraction supporting PDF and DOCX files.
    Handles empty documents, corrupted files, and unsupported formats gracefully.
    """

    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}

    @classmethod
    def clean_text(cls, raw: str) -> str:
        """Normalizes extracted text by removing control characters and excessive whitespace."""
        if not raw:
            return ""
        # Remove null bytes or non-printable control characters (except newline, carriage return, tab)
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw)
        # Normalize carriage returns
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
        # Collapse 3 or more consecutive newlines into 2
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned.strip()

    @classmethod
    def extract_from_pdf(cls, file_path: str) -> str:
        """
        Extracts text from a PDF file using PyMuPDF.
        Detects empty and corrupted PDF files.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Resume file not found at path: {file_path}")

        try:
            doc = fitz.open(file_path)
        except Exception as e:
            raise ValueError(f"Corrupted or invalid PDF file: {str(e)}")

        try:
            if doc.page_count == 0:
                raise ValueError("PDF document contains 0 pages.")

            text_chunks = []
            for page_idx in range(doc.page_count):
                try:
                    page = doc.load_page(page_idx)
                    page_text = page.get_text("text")
                    if page_text and page_text.strip():
                        text_chunks.append(page_text.strip())
                except Exception as page_err:
                    # Continue extracting other pages if one page fails
                    continue
            
            doc.close()
        except Exception as e:
            if "doc" in locals() and not doc.is_closed:
                doc.close()
            raise ValueError(f"Error reading PDF content: {str(e)}")

        combined = "\n\n".join(text_chunks)
        cleaned = cls.clean_text(combined)

        if not cleaned:
            raise ValueError(
                "PDF file contains no readable text. It may be empty or contain only scanned images/bitmaps without OCR."
            )
        return cleaned

    @classmethod
    def extract_from_docx(cls, file_path: str) -> str:
        """
        Extracts text from a DOCX file using python-docx.
        Extracts text from paragraphs and tables. Detects empty and corrupted files.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Resume file not found at path: {file_path}")

        try:
            doc = docx.Document(file_path)
        except Exception as e:
            raise ValueError(f"Corrupted or invalid DOCX file: {str(e)}")

        text_chunks = []

        # Extract paragraphs
        for p in doc.paragraphs:
            if p.text and p.text.strip():
                text_chunks.append(p.text.strip())

        # Extract tables
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    # Remove duplicate adjacent cell texts caused by merged cells
                    unique_cells = []
                    for c in row_cells:
                        if not unique_cells or c != unique_cells[-1]:
                            unique_cells.append(c)
                    if unique_cells:
                        text_chunks.append(" | ".join(unique_cells))

        combined = "\n\n".join(text_chunks)
        cleaned = cls.clean_text(combined)

        if not cleaned:
            raise ValueError("DOCX document contains no readable text. The document is empty.")
        return cleaned

    @classmethod
    def extract_text(cls, file_path: str) -> Tuple[str, str]:
        """
        Detects file extension and extracts text.
        Returns: Tuple of (cleaned_text: str, file_type: str)
        Raises:
            FileNotFoundError if the file does not exist.
            ValueError if format is unsupported, empty, or corrupted.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Resume file not found at path: {file_path}")

        # Check if file is 0 bytes
        if os.path.getsize(file_path) == 0:
            raise ValueError("File is empty (0 bytes).")

        ext = os.path.splitext(file_path)[1].lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file format '{ext}'. Only PDF (.pdf) and Word documents (.docx, .doc) are supported."
            )

        if ext == ".pdf":
            return cls.extract_from_pdf(file_path), "pdf"
        elif ext in [".docx", ".doc"]:
            return cls.extract_from_docx(file_path), "docx"
        else:
            raise ValueError(f"Unsupported file format: {ext}")
