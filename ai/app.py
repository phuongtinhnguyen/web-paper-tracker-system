from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from paper_ai import summarize_abstract

app = FastAPI(title="Web Paper Tracker AI Service")


class SummarizeRequest(BaseModel):
    abstract: str


@app.post("/summarize")
def summarize_paper(payload: SummarizeRequest):
    if not payload.abstract.strip():
        raise HTTPException(status_code=400, detail="Abstract is required")

    summary = summarize_abstract(payload.abstract)

    return {
        "success": True,
        "message": "Summarize successfully",
        "data": {
            "summary": summary
        }
    }
