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
from fts_searcher import search_chunks_fts
from performance_eval import PerformanceTimer

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

def hybrid_search(query, debug=False, max_results=5, return_timings=False):
    timer = PerformanceTimer()
    errors = []

    try:
        analyzer = QueryAnalyzer(
            settings.lexical_stop_words,
            settings.intent_terms,
            settings.descriptor_terms
        )

        with timer.stage("query_analysis"):
            analysis = analyzer.analyze(query)

    except Exception as e:
        print(f"Query analysis failed: {e}")
        if return_timings:
            timer.finish()
            return [], timer.get_timings()
        return []

    try:
        with timer.stage("lexical"):
            exact_results = search_chunks_fts(analysis.lexical_text)

    except Exception as e:
        print(f"Lexical search failed: {e}")
        errors.append(f"lexical_failed: {e}")
        exact_results = []

    try:
        with timer.stage("embed_query"):
            embedded_query = embed_text(analysis.semantic_text)

        collection = get_collection()

        with timer.stage("vector_search"):
            semantic_results = search_chunks(collection, embedded_query, n_results=10)

    except Exception as e:
        print(f"Semantic search failed: {e}")
        errors.append(f"semantic_failed: {e}")
        semantic_results = {
            "ids": [[]],
            "documents": [[]],
            "metadatas": [[]]
        }

    if not exact_results and not semantic_results["ids"][0]:
        print("Both lexical and semantic search failed.")
        timer.finish()
        if return_timings:
            return [], timer.get_timings()
        return []

    try:
        with timer.stage("rrf"):
            rrf_record = rrf(exact_results, semantic_results)

        combined_results = rrf_to_search_results(rrf_record, max_results)

    except Exception as e:
        print(f"Fusion failed: {e}")
        timer.finish()
        if return_timings:
            return [], timer.get_timings()
        return []

    timer.finish()

    if debug:
        fetch_diagnostics(analysis, exact_results, semantic_results, combined_results)
        print(timer.get_timings())
        if errors:
            print(errors)

    if return_timings:
        return combined_results, timer.get_timings()

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

        print("FTS5 LEXICAL CANDIDATES")
        print("-------------------")
        for result in lexical_results:
            chunk = result["chunk"]

            print(f"Note Title: {chunk.note_title}")
            print(f"Heading: {chunk.heading}")
            print(f"BM25 Score: {result['score']}")
            print(f"Matched Terms: {result['matched_terms']}")

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

        
