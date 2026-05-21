from operator import itemgetter
from config import settings


def exact_search_chunks(chunks, query, max_results=5):
    matched_query = []
    lower_query = query.lower()
    query_words = lower_query.split()
    clean_query = []

    for term in query_words:
        if term not in settings.lexical_stop_words:
            clean_query.append(term)

    for chunk in chunks:
        chunk_score = 0
        matched_term = []
        note_title = chunk.note_title
        text = chunk.text
        heading = chunk.heading

        for term in clean_query:
            if term in note_title.lower():
                chunk_score += 10
                matched_term.append(term)
            if term in heading.lower():
                chunk_score += 8
                if term not in matched_term:
                    matched_term.append(term)
            if term in text.lower():
                chunk_score += 5
                if term not in matched_term:
                    matched_term.append(term)
        if chunk_score > 0:
            result = {
                "chunk": chunk,
                "score": chunk_score,
                "matched_terms": matched_term,
            }
            matched_query.append(result)
    matched_query.sort(key=itemgetter('score'), reverse=True)

    return matched_query[:max_results]

