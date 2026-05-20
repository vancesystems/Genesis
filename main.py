from vault_reader import read_vault
from chunker import chunk_notes
from vector_store import get_collection, add_chunk, search_chunks
from embedder import embed_chunk, embed_text
from lexical_searcher import exact_search_chunks

VAULT_PATH = r"D:/vault"

def index_vault():
    notes = read_vault(VAULT_PATH)
    chunked_note = chunk_notes(notes)
    collection = get_collection()
    for index, chunk in enumerate(chunked_note):
        print(f"Indexing {index + 1}/{len(chunked_note)}: {chunk['note_title']}")
        embedded_chunk = embed_chunk(chunk)
        add_chunk(collection, chunk, embedded_chunk)

def combine_results(lexical_results, semantic_results, max_results):
    ranked_results = {}
    for results in lexical_results:
        chunk = results["chunk"]
        chunk_id = chunk["chunk_id"]

        ranked_results[chunk_id] = {
            "title": chunk["note_title"],
            "path": chunk["note_path"],
            "section_index": chunk["section_index"],
            "chunk_index": chunk["chunk_index"],
            "heading": chunk.get("heading", "No Heading"),
            "text": chunk["text"],
            "lexical_score": results["score"],
            "semantic_score": 0,
            "final_score": results["score"],
            "matched_terms": results["matched_terms"],
            "signals": ["lexical_match"],
        }

    semantic_ids = semantic_results["ids"][0]
    semantic_docs = semantic_results["documents"][0]
    semantic_meta = semantic_results["metadatas"][0]
    semantic_distance = semantic_results["distances"][0]

    for index in range(len(semantic_ids)):
        semantic_score = 0

        id_chunk = semantic_ids[index]
        text = semantic_docs[index]
        meta_data = semantic_meta[index]
        distance = semantic_distance[index]

        semantic_score = 10 - index

        if id_chunk in ranked_results:
            ranked_results[id_chunk]["semantic_score"] = semantic_score
            ranked_results[id_chunk]["final_score"] += semantic_score
            ranked_results[id_chunk]["signals"].append("semantic_match")
        else:
            ranked_results[id_chunk] = {
                "title": meta_data["note_title"],
                "path": meta_data["note_path"],
                "section_index": meta_data["section_index"],
                "chunk_index": meta_data["chunk_index"],
                "heading": meta_data.get("heading", "No Heading"),
                "text": text,
                "lexical_score": 0,
                "semantic_score": semantic_score,
                "final_score": semantic_score,
                "matched_terms": [],
                "signals": ["semantic_match"]
            }
    result_list = list(ranked_results.values())
    result_list.sort(key=lambda result: result["final_score"], reverse=True)
    return result_list[:max_results]

def hybrid_search(query, max_results=5):
    notes = read_vault(VAULT_PATH)
    chunked_notes = chunk_notes(notes)
    exact_results = exact_search_chunks(chunked_notes, query, 10)
    embedded_query = embed_text(query)
    collection = get_collection()
    semantic_results = search_chunks(collection, embedded_query, n_results=10)

    combined_results = combine_results(
        exact_results,
        semantic_results,
        max_results=max_results
    )

    return combined_results

def print_hybrid_results(results):
    for result in results:
        print("-----")
        print("Title:", result["title"])
        print("Path:", result["path"])
        print("Section Index", result["section_index"])
        print("Chunk Index:", result["chunk_index"])
        print("Final Score:", result["final_score"])
        print("Lexical Score:", result["lexical_score"])
        print("Semantic Score:", result["semantic_score"])
        print("Matched Terms:", result["matched_terms"])
        print("Signals:", result["signals"])
        print("Header", result["heading"])
        print("Preview:", result["text"][:1000])

def ask_vault():
    user_question = input("What would you like to search for? ")
    results = hybrid_search(user_question)

    print_hybrid_results(results)


if __name__ =="__main__": 
    while True: 
        user_input = input("Would you like to:\n 1. Index vault \n 2. Ask vault \n 3. Exit ")
        if user_input.lower() == "1" or user_input.lower() == "index vault":
            index_vault()
        elif user_input.lower() == "2" or  user_input.lower() == "ask vault":
            ask_vault()
        elif user_input.lower() == "3" or user_input.lower() == "Exit":
            break
        else:
            print("Invaild option")