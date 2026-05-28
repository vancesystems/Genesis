from models import SearchResult
from vault_reader import read_vault
from chunker import chunk_notes
from vector_store import get_collection, search_chunks
from embedder import embed_text
from lexical_searcher import exact_search_chunks
from notes_db import *
from reciprocal_rank_fusion import *
from query_analyzer import QueryAnalyzer
from config import settings

def combine_results(lexical_results, semantic_results, max_results):
    ranked_results = {}

    for results in lexical_results:
        chunk = results["chunk"]
        chunk_score = results["score"]
        matched_terms = results["matched_terms"]

        ranked_results[chunk.chunk_id] = SearchResult(
            chunk.note_title,
            chunk.note_path,
            chunk.section_index,
            chunk.chunk_index,
            chunk.heading,
            chunk.text,
            chunk_score,
            0,
            chunk_score,
            matched_terms,
            signals=["lexical_match"]
        )

    semantic_ids = semantic_results["ids"][0]
    semantic_docs = semantic_results["documents"][0]
    semantic_meta = semantic_results["metadatas"][0]

    for index in range(len(semantic_ids)):
        id_chunk = semantic_ids[index]
        text = semantic_docs[index]
        meta_data = semantic_meta[index]
        semantic_score = 10 - index

        if id_chunk in ranked_results:
            ranked_results[id_chunk].semantic_score = semantic_score
            ranked_results[id_chunk].final_score += semantic_score
            ranked_results[id_chunk].signals.append("semantic_match")
        else:
            ranked_results[id_chunk] = SearchResult(
                meta_data["note_title"],
                meta_data["note_path"],
                meta_data["section_index"],
                meta_data["chunk_index"],
                meta_data.get("heading", "No Heading"),
                text,
                0,
                semantic_score,
                semantic_score,
                [],
                signals=["semantic_match"]
            )

    result_list = list(ranked_results.values())
    result_list.sort(key=lambda result: result.final_score, reverse=True)

    return result_list[:max_results]

def hybrid_search(query, max_results=5):
    chunked_notes = get_all_chunk_objects()
    analyzer = QueryAnalyzer(settings.lexical_stop_words, settings.intent_terms, settings.descriptor_terms)
    analysis = analyzer.analyze(query)
    exact_results = exact_search_chunks(chunked_notes, analysis.lexical_text, 10)
    embedded_query = embed_text(analysis.semantic_text)
    collection = get_collection()
    semantic_results = search_chunks(collection, embedded_query, n_results=10)

    rrf_record = rrf(exact_results, semantic_results)

    combined_results = rrf_to_search_results(rrf_record, max_results)

    fetch_diagnostics(analysis, exact_results, semantic_results, combined_results)

    return combined_results

def fetch_diagnostics(analysis, lexical_results, semantic_results, combined_results, debug=True):
    if debug:
        
        print("QUERY ANALYSIS")
        print("-------------------")
        raw_query = analysis.original_query
        lexical_query = analysis.lexical_text
        semantic_query = analysis.semantic_text
        tokens = analysis.tokens
        ignored = analysis.ignored_terms
        intent = analysis.intent_terms
        descriptors = analysis.descriptor_terms
        anchors = analysis.anchor_terms

        print(f"Raw Query: {raw_query}")
        print(f"Lexical Query: {lexical_query}")
        print(f"Semantic Query: {semantic_query}")
        print(f"Tokens: {tokens}")
        print(f"Ignored Terms: {ignored}")
        print(f"Intent Terms: {intent}")
        print(f"Descriptor Terms: {descriptors}")
        print(f"Anchor Terms: {anchors}")

        print("LEXICAL CANDIDATES:")
        print("-------------------")
        for result in lexical_results:
            chunk = result["chunk"]
            note_title = chunk.note_title
            score = result["score"]
            heading = chunk.heading
            matched_terms = result["matched_terms"]
            print(f"Note Title: {note_title}")
            print(f"Heading: {heading}")
            print(f"Score: {score}")
            print(f"Matched Terms: {matched_terms}")

        print("SEMANTIC CANDIDATES:")
        print("-------------------")
        for index, result in enumerate(semantic_results["metadatas"][0]):
            s_note_title = result["note_title"]
            s_heading = result.get("heading", "No Heading")
            rank = index + 1
            print(f"Note Title: {s_note_title}")
            print(f"Heading: {s_heading}")
            print(f"Rank: {rank}")

        print("COMBINED RESULTS")
        print("-------------------")
        for index, result in enumerate(combined_results):
            c_title = result.title
            final_score = result.final_score
            result_heading = result.heading
            signals = result.signals
            final_ranking = index + 1

            print(f"{final_ranking}.")
            print(f"Title: {c_title}")
            print(f"Final Score: {final_score}")
            print(f"Heading: {result_heading}")
            print(f"Signals: {signals}")
