from models import SearchResult

def rrf(lexical_results, semantic_results, k=60):
    ranked_results = {}

    for index, result in enumerate(lexical_results):
        try:
            rank = index + 1
            chunk = result["chunk"]
            chunk_id = chunk.chunk_id
            rrf_score = 1 / (k + rank)
        except KeyError as e:
            print(f"RRF Error: Missing key: {e}")
            continue
        except AttributeError as e:
            print(f"RRF Error: Chunk object missing attribute: {e}")
            continue

        if chunk_id in ranked_results:
            ranked_results[chunk_id]["rrf_score"] += rrf_score
            ranked_results[chunk_id]["lexical_rank"] = rank
            if "lexical_match" not in ranked_results[chunk_id]["signals"]:
                ranked_results[chunk_id]["signals"].append("lexical_match")
        else:
            ranked_results[chunk_id] = {
                "rrf_score": rrf_score,
                "lexical_rank": rank,
                "semantic_rank": None,
                "chunk": chunk,
                "signals": ["lexical_match"]
            }

    
    semantic_meta = semantic_results["metadatas"][0]
    semantic_ids = semantic_results["ids"][0]
    semantic_docs = semantic_results["documents"][0]
    for index, result in enumerate(semantic_ids):
        try:
            text = semantic_docs[index]
            metadata = semantic_meta[index]
            rank = index + 1
            rrf_score = 1 / (k + rank)
        except KeyError as e:
            print(f"RRF Error: Missing key: {e}")
            continue
        except AttributeError as e:
            print(f"RRF Error: Chunk object missing attribute: {e}")
            continue

        if result in ranked_results:
            ranked_results[result]["rrf_score"] += rrf_score
            ranked_results[result]["semantic_rank"] = rank
            if "semantic_match" not in ranked_results[result]["signals"]:
                ranked_results[result]["signals"].append("semantic_match")
        else:
            ranked_results[result] = {
                "rrf_score": rrf_score,
                "lexical_rank": None,
                "semantic_rank": rank,
                "chunk": None,
                "text": text,
                "metadata": metadata,
                "signals": ["semantic_match"]
            }


    result_list = list(ranked_results.values())
    result_list.sort(key=lambda result: result["rrf_score"], reverse=True)

    return result_list

def rrf_to_search_results(rrf_records, max_results):
    search_results = []
    for record in rrf_records:
        if record["chunk"]:
            chunk = record["chunk"]
            chunk_index = chunk.chunk_index
            title = chunk.note_title
            path = chunk.note_path
            section_index = chunk.section_index
            heading = chunk.heading
            text = chunk.text
            lexical_score = record["lexical_rank"] or 0
            semantic_score = record["semantic_rank"] or 0
            score = record["rrf_score"]
            matched_terms = []
            signals = record["signals"]
        else:
            metadata = record["metadata"]
            title = metadata["note_title"]
            path = metadata["note_path"]
            section_index = metadata["section_index"]
            lexical_score = record["lexical_rank"] or 0
            semantic_score = record["semantic_rank"] or 0
            chunk_index = metadata["chunk_index"]
            heading = metadata.get("heading", "No Heading")
            text = record["text"]
            score = record["rrf_score"]
            matched_terms = []
            signals = record["signals"]

        result = SearchResult(title, path, section_index, chunk_index, heading, text, lexical_score, semantic_score, score, matched_terms, signals)

        search_results.append(result)

    return search_results[:max_results]
