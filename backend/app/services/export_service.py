import io
from typing import List, Dict, Any
import pandas as pd

class ExportService:
    """Exports shortlisted candidate tables into CSV and Excel formats using Pandas & OpenPyXL."""

    @staticmethod
    def export_candidates_to_csv(candidates: List[Dict[str, Any]]) -> io.BytesIO:
        df = pd.DataFrame(candidates)
        output = io.BytesIO()
        df.to_csv(output, index=False, encoding="utf-8")
        output.seek(0)
        return output

    @staticmethod
    def export_candidates_to_excel(candidates: List[Dict[str, Any]]) -> io.BytesIO:
        df = pd.DataFrame(candidates)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Candidates")
        output.seek(0)
        return output
