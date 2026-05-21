import chromadb
from config import settings

def get_collection():
    client = chromadb.PersistentClient(path=settings.chroma_path)

    collection = client.get_or_create_collection(
        name=settings.collection_name
    )

    return collection

def add_chunk(collection, chunk, embedding):
    chunk_id = chunk.chunk_id
    document = chunk.text
    meta_data = {"note_title": chunk.note_title, "note_path": chunk.note_path, "chunk_index": chunk.chunk_index, "heading": chunk.heading, "section_index": chunk.section_index}
    collection.upsert(
        ids=[chunk_id ],
        documents=[document],
        metadatas=[meta_data],
        embeddings=[embedding]
    )

def search_chunks(collection, query_embedding, n_results=5):
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
    )

    return results