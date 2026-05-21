import ollama
from config import settings

def embed_text(text):
    response = ollama.embeddings(
        model=settings.embed_model,
        prompt=text,
    )

    return response["embedding"]


def embed_chunk(chunk):
    richer_chunk = (f"Title: {chunk.note_title}\n Path: {chunk.note_path}\n Content:\n {chunk.text}")
    return embed_text(richer_chunk)