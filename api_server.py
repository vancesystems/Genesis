from fastapi import FastAPI
from pydantic import BaseModel
from search_service import hybrid_search
from context_builder import build_prompt
from llm_client import send_prompt, stream_prompt_chunks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str

class StreamRequest(BaseModel):
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

@app.post("/ask-stream")
def stream_genesis(request: StreamRequest):
    results = hybrid_search(request.query, debug=False, max_results=5)
    prompt = build_prompt(request.query, results)

    sources = []

    for result in results:
        sources.append({
            "title": result.title,
            "path": result.path,
            "heading": result.heading,
            "preview": result.text[:300],
            "signals": result.signals
        })

    def event_generator():
        yield json.dumps({
            "type": "sources",
            "sources": sources
        }) + "\n"

        for token in stream_prompt_chunks(prompt):
            yield json.dumps({
                "type": "token",
                "text": token
            }) + "\n"

        yield json.dumps({
            "type": "done"
        }) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")