from fastapi import FastAPI
from pydantic import BaseModel
from search_service import hybrid_search

app = FastAPI()

class SearchRequest(BaseModel):
    query: str

@app.get("/")
def health_check():
    return {"status": "Genesis API running"}

@app.post("/search")
def search_vault(request: SearchRequest):
    results = hybrid_search(request.query, debug=False, max_results=5)
    api_results = []

    for result in results:
        api_results.append({
            "title": result.title,
            "path": result.path,
            "heading": result.heading,
            "preview": result.text[:500],
            "final_score": result.final_score,
            "signals": result.signals
        })

    return {
        "query": request.query,
        "results": api_results
    }