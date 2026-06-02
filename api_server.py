from fastapi import FastAPI
from pydantic import BaseModel
from search_service import hybrid_search
from context_builder import build_prompt
from llm_client import send_prompt

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

@app.post("/ask")
def ask_genesis(request: SearchRequest):
    results = hybrid_search(request.query, debug=False, max_results=5)

    prompt = build_prompt(request.query, results)
    response = send_prompt(prompt)

    sources = []

    for result in results:
        sources.append({
            "title": result.title,
            "path": result.path,
            "heading": result.heading,
            "preview": result.text[:300],
            "signals": result.signals
        })

    return {
        "query": request.query,
        "answer": response,
        "sources": sources
    }