from notes_db import *
import re

def query_fts_table(query):
    safe_query = re.sub(r"[^a-zA-Z0-9\s]", " ", query)
    safe_query = " ".join(safe_query.split())

    if not safe_query:
        return []

    conn = get_connection()
    c = conn.cursor()

    c.execute(
        """
        SELECT chunk_id, bm25(chunks_fts) AS score
        FROM chunks_fts
        WHERE chunks_fts MATCH ?
        ORDER BY score
        LIMIT 5
        """,
        (safe_query,)
    )

    results = c.fetchall()

    conn.close()

    return results

def search_chunks_fts(query):
    results = query_fts_table(query)
    lexical_results = []
    for result in results:
        chunk_id = result["chunk_id"]
        score = result["score"]

        chunk = get_chunk_by_id(chunk_id)

        chunk_object = Chunk(chunk["chunk_id"], chunk["note_title"], chunk["note_path"], chunk["section_index"], 
                            chunk["chunk_index"], chunk["heading"], chunk["text"])
        
        lexical_results.append({
            "chunk": chunk_object,
            "score": score,
            "matched_terms": []
        })

    return lexical_results
