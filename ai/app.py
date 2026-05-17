from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from paper_ai import summarize_abstract, analyze_topic_trends

app = FastAPI(title="Web Paper Tracker AI Service")


class SummarizeRequest(BaseModel):
    abstract: str

class TrendRequest(BaseModel):
    topic_titles: List[str]

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


@app.post("/trends")
def get_trends(payload: TrendRequest):
    if not payload.topic_titles:
        raise HTTPException(status_code=400, detail="topic_titles is required")

    result = analyze_topic_trends(payload.topic_titles)

    return {
        "success": True,
        "message": "Analyze trends successfully",
        "data": result
    }