import chromadb


CHROMA_PATH = "./chroma_db"
COLLECTION_NAME = "vault_chunks"


def get_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME
    )

    return collection

def add_chunk(collection, chunk, embedding):
    chunk_id = chunk["chunk_id"]
    document = chunk["text"]
    meta_data = {"note_title": chunk["note_title"], "note_path": chunk["note_path"], "chunk_index": chunk["chunk_index"], "heading": chunk["heading"], "section_index": chunk["section_index"]}
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

if __name__ == "__main__":
    collection = get_collection()
    print("Collection ready:", collection.name)