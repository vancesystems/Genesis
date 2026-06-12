from search_service import hybrid_search
import json
from datetime import datetime
from pathlib import Path

TEST_CASES = [
    {
        "query": "What is Project Genesis?",
        "expected_titles": ["Project Genesis"],
        "top_k": 5
    },
    {
        "query": "Explain hybrid retrieval",
        "expected_titles": ["Hybrid Retrieval"],
        "top_k": 5
    },
    {
        "query": "What is semantic retrieval?",
        "expected_titles": ["Semantic Retrieval", "Semantic Search"],
        "top_k": 5
    },
    {
        "query": "What is lexical retrieval?",
        "expected_titles": ["Lexical Retrieval"],
        "top_k": 5
    },
    {
        "query": "What is reciprocal rank fusion?",
        "expected_titles": ["Reciprocal Rank Fusion"],
        "top_k": 5
    },
    {
        "query": "Explain chunking in retrieval systems",
        "expected_titles": ["Chunking", "Genesis Paragraph-Aware Chunking – Day 10"],
        "top_k": 5
    },
    {
        "query": "What are embeddings?",
        "expected_titles": ["Embeddings", "Embedding Models", "Nomic Embeddings"],
        "top_k": 5
    },
    {
        "query": "What is context assembly?",
        "expected_titles": ["Context Assembly"],
        "top_k": 5
    },
    {
        "query": "What is context compression?",
        "expected_titles": ["Context Compression"],
        "top_k": 5
    },
    {
        "query": "What is a vector database?",
        "expected_titles": ["Vector Database", "Vector Search", "Vector Retrieval"],
        "top_k": 5
    },
    {
        "query": "What is ChromaDB?",
        "expected_titles": ["ChromaDB"],
        "top_k": 5
    },
    {
        "query": "What is information retrieval?",
        "expected_titles": ["Information Retrieval"],
        "top_k": 5
    },
    {
        "query": "What is query analysis in Genesis?",
        "expected_titles": ["Genesis Query Analyzer V1 Day 9"],
        "top_k": 5
    },
    {
        "query": "Explain retrieval diagnostics",
        "expected_titles": ["Genesis Query Analyzer V1 Day 9", "Debugging", "Tracing"],
        "top_k": 5
    },
    {
        "query": "What is graph intelligence?",
        "expected_titles": ["Graph Intelligence", "Graph Systems"],
        "top_k": 5
    },
    {
        "query": "What is adaptive retrieval?",
        "expected_titles": ["Adaptive Retrieval"],
        "top_k": 5
    },
    {
        "query": "What is fallback retrieval?",
        "expected_titles": ["Fallback Retrieval"],
        "top_k": 5
    },
    {
        "query": "What is knowledge retrieval?",
        "expected_titles": ["Knowledge Retrieval"],
        "top_k": 5
    },
    {
        "query": "What is knowledge routing?",
        "expected_titles": ["Knowledge Routing"],
        "top_k": 5
    },
    {
        "query": "What is semantic filtering?",
        "expected_titles": ["Semantic Filtering"],
        "top_k": 5
    },
    {
        "query": "What is vector space?",
        "expected_titles": ["Vector Space"],
        "top_k": 5
    },
    {
        "query": "What is persistent vector storage?",
        "expected_titles": ["Persistent Vector Storage"],
        "top_k": 5
    },
    {
        "query": "What is structured memory?",
        "expected_titles": ["Structured Memory"],
        "top_k": 5
    },
    {
        "query": "What is vault index?",
        "expected_titles": ["Vault Index"],
        "top_k": 5
    },
    {
        "query": "What is local LLM integration?",
        "expected_titles": ["Genesis Local LLM Integration Development Day 5", "Stage 3.2 — Local LLM Integration"],
        "top_k": 5
    },
    {
        "query": "What is performance engineering?",
        "expected_titles": ["Performance Engineering", "Stage 10 - Performance Engineering"],
        "top_k": 5
    },
    {
        "query": "What is runtime instrumentation?",
        "expected_titles": ["Runtime Instrumentation"],
        "top_k": 5
    },
    {
        "query": "What is tracing?",
        "expected_titles": ["Tracing"],
        "top_k": 5
    },
    {
        "query": "What are regression tests?",
        "expected_titles": ["Regression Tests"],
        "top_k": 5
    },
    {
        "query": "What are integration tests?",
        "expected_titles": ["Integration Tests"],
        "top_k": 5
    },
    {
        "query": "What is the Genesis intelligence system vision?",
        "expected_titles": [
            "Decision Record 004 — Reposition Genesis From a Retrieval System to an Intelligence System",
            "Genesis Obsidian Intelligence Layer — Long-Term Roadmap"
        ],
        "top_k": 5
    },
    {
        "query": "Compare lexical retrieval and semantic retrieval",
        "expected_titles": ["Lexical Retrieval", "Semantic Retrieval", "Hybrid Retrieval"],
        "top_k": 5
    },
    {
        "query": "Why is hybrid retrieval more effective than using only vector search?",
        "expected_titles": ["Hybrid Retrieval", "Semantic Retrieval", "Lexical Retrieval"],
        "top_k": 5
    },
    {
        "query": "How does Reciprocal Rank Fusion improve retrieval quality?",
        "expected_titles": ["Reciprocal Rank Fusion", "Genesis Retrieval System Progress Day 8 — RRF Integration Session"],
        "top_k": 5
    },
    {
        "query": "What improvements were introduced in the Genesis Query Analyzer?",
        "expected_titles": ["Genesis Query Analyzer V1 Day 9"],
        "top_k": 5
    },
    {
        "query": "What retrieval problems were discovered during the multi-hop retrieval investigation?",
        "expected_titles": ["Genesis Development — Multi-Hop Retrieval Investigation Day 14"],
        "top_k": 5
    },
    {
        "query": "How does paragraph-aware chunking differ from naive chunking approaches?",
        "expected_titles": ["Genesis Paragraph-Aware Chunking – Day 10", "Chunking"],
        "top_k": 5
    },
    {
        "query": "How are embeddings used for semantic retrieval?",
        "expected_titles": [
            "Embeddings",
            "Semantic Retrieval",
            "Embedding Models"
        ],
        "top_k": 5
    },
    {
        "query": "How does Genesis use SQLite structured memory?",
        "expected_titles": [
            "Genesis Day 7 — SQLite Structured Memory Layer Integration",
            "Structured Memory",
            "SQLite"
        ],
        "top_k": 5
    },
    {
        "query": "Describe how context is assembled before sending information to the LLM",
        "expected_titles": ["Context Assembly"],
        "top_k": 5
    },
    {
        "query": "Explain the relationship between vector search and embeddings",
        "expected_titles": ["Embeddings", "Vector Search", "Vector Space"],
        "top_k": 5
    },
    {
        "query": "What architectural changes were introduced in the typed retrieval refactor?",
        "expected_titles": ["Genesis Architecture Evolution Day 6 — Typed Retrieval Foundation and Hybrid Intelligence Refactor"],
        "top_k": 5
    },
    {
        "query": "How does Genesis measure retrieval quality?",
        "expected_titles": ["Genesis Retrieval Evaluation Harness — Day 11"],
        "top_k": 5
    },
    {
        "query": "How does incremental engineering influence Genesis development?",
        "expected_titles": ["Incremental Engineering"],
        "top_k": 5
    },
    {
        "query": "Explain the difference between information retrieval and knowledge retrieval",
        "expected_titles": ["Information Retrieval", "Knowledge Retrieval"],
        "top_k": 5
    },
    {
        "query": "How do retrieval diagnostics help identify ranking issues?",
        "expected_titles": ["Debugging", "Tracing", "Genesis Query Analyzer V1 Day 9"],
        "top_k": 5
    },
    {
        "query": "What is the long-term vision for the Genesis Obsidian intelligence layer?",
        "expected_titles": ["Genesis Obsidian Intelligence Layer — Long-Term Roadmap"],
        "top_k": 5
    },
    {
        "query": "How does Genesis combine lexical and semantic signals during retrieval?",
        "expected_titles": ["Hybrid Retrieval", "Reciprocal Rank Fusion"],
        "top_k": 5
    },
    {
        "query": "Why does Genesis use both lexical and semantic retrieval?",
        "expected_titles": ["Hybrid Retrieval", "Lexical Retrieval", "Semantic Retrieval"],
        "top_k": 5
    },
    {
        "query": "What problem does Reciprocal Rank Fusion solve?",
        "expected_titles": ["Reciprocal Rank Fusion"],
        "top_k": 5
    },
    {
        "query": "Why are embeddings necessary for semantic search?",
        "expected_titles": ["Embeddings", "Semantic Retrieval"],
        "top_k": 5
    },
    {
        "query": "How does vector search differ from keyword search?",
        "expected_titles": ["Vector Search", "Lexical Retrieval", "Semantic Retrieval"],
        "top_k": 5
    },
    {
        "query": "What role does chunking play in retrieval quality?",
        "expected_titles": ["Chunking", "Genesis Paragraph-Aware Chunking – Day 10"],
        "top_k": 5
    },
    {
        "query": "What challenges were discovered during Genesis retrieval development?",
        "expected_titles": ["Genesis Development — Multi-Hop Retrieval Investigation Day 14"],
        "top_k": 5
    },
    {
        "query": "Why is performance engineering important in retrieval systems?",
        "expected_titles": ["Performance Engineering"],
        "top_k": 5
    },
    {
        "query": "How does runtime instrumentation improve debugging?",
        "expected_titles": ["Runtime Instrumentation", "Tracing"],
        "top_k": 5
    },
    {
        "query": "What is the purpose of retrieval diagnostics?",
        "expected_titles": ["Tracing", "Debugging", "Genesis Query Analyzer V1 Day 9"],
        "top_k": 5
    },
    {
        "query": "How do regression tests protect retrieval quality?",
        "expected_titles": ["Regression Tests"],
        "top_k": 5
    },
    {
        "query": "Why are integration tests important for Genesis?",
        "expected_titles": ["Integration Tests"],
        "top_k": 5
    },
    {
        "query": "What is the relationship between knowledge retrieval and information retrieval?",
        "expected_titles": ["Knowledge Retrieval", "Information Retrieval"],
        "top_k": 5
    },
    {
        "query": "What problem does knowledge routing solve?",
        "expected_titles": ["Knowledge Routing"],
        "top_k": 5
    },
    {
        "query": "How does contextual intelligence improve decision making?",
        "expected_titles": ["Contextual Intelligence"],
        "top_k": 5
    },
    {
        "query": "How does Genesis use ChromaDB?",
        "expected_titles": ["ChromaDB", "Genesis RAG Development — Day 4"],
        "top_k": 5
    },
    {
        "query": "Why are vector databases useful for retrieval?",
        "expected_titles": ["Vector Database", "Vector Search"],
        "top_k": 5
    },
    {
        "query": "How does semantic filtering improve retrieval quality?",
        "expected_titles": ["Semantic Filtering"],
        "top_k": 5
    },
    {
        "query": "What is the purpose of fallback retrieval?",
        "expected_titles": ["Fallback Retrieval"],
        "top_k": 5
    },
    {
        "query": "How does adaptive retrieval work?",
        "expected_titles": ["Adaptive Retrieval"],
        "top_k": 5
    },
    {
        "query": "Why is vector space important for embeddings?",
        "expected_titles": ["Vector Space", "Embeddings"],
        "top_k": 5
    },
    {
        "query": "How does Genesis track retrieval performance?",
        "expected_titles": ["Performance Engineering", "Runtime Instrumentation"],
        "top_k": 5
    },
    {
        "query": "Why is tracing useful during retrieval debugging?",
        "expected_titles": ["Tracing", "Debugging", "Runtime Instrumentation"],
        "top_k": 5
    },
    {
        "query": "How does Genesis evaluate retrieval quality?",
        "expected_titles": ["Genesis Retrieval Evaluation Harness — Day 11"],
        "top_k": 5
    },
    {
        "query": "Why is context compression necessary?",
        "expected_titles": ["Context Compression"],
        "top_k": 5
    },
    {
        "query": "How does structured memory differ from retrieval?",
        "expected_titles": ["Structured Memory", "Knowledge Retrieval"],
        "top_k": 5
    },
    {
        "query": "How does Genesis use local language models?",
        "expected_titles": ["Genesis Local LLM Integration Development Day 5", "Local AI"],
        "top_k": 5
    },
    {
        "query": "What improvements came from paragraph-aware chunking?",
        "expected_titles": ["Genesis Paragraph-Aware Chunking – Day 10"],
        "top_k": 5
    },
    {
        "query": "Why does Genesis combine multiple retrieval methods?",
        "expected_titles": ["Hybrid Retrieval", "Reciprocal Rank Fusion"],
        "top_k": 5
    },
    {
        "query": "What capabilities are required for a digital self?",
        "expected_titles": ["Project Genesis — The Construction of a Digital Self"],
        "top_k": 5
    },
    {
        "query": "How does Genesis determine which retrieval strategy to use for a query?",
        "expected_titles": [
            "Adaptive Retrieval",
            "Genesis Query Analyzer V1 Day 9"
        ],
        "top_k": 5
    },
    {
        "query": "What mechanisms help Genesis remain grounded in source material?",
        "expected_titles": [
            "Context Assembly",
            "Context Compression",
            "Genesis Local LLM Integration Development Day 5"
        ],
        "top_k": 5
    },
    {
        "query": "How does Genesis balance retrieval quality against retrieval speed?",
        "expected_titles": [
            "Performance Engineering",
            "Runtime Instrumentation",
            "Genesis Retrieval Evaluation Harness — Day 11"
        ],
        "top_k": 5
    },
]

tests_ran = 0
failed_tests = 0
passed_tests = 0
total_rank = 0
total_reciprocal_rank = 0
total_latency_ms = 0
fastest_query = ""
fastest_latency_ms = None
slowest_query = ""
slowest_latency_ms = 0

query_records = []

for test_case in TEST_CASES:
    query = test_case["query"]
    expected_titles = test_case["expected_titles"]
    top_k = test_case["top_k"]
    found = False
    found_rank = None
    retrieved_titles = []

    results, timings = hybrid_search(query, debug=False, max_results=test_case["top_k"], return_timings=True)

    latency = timings["total_time_ms"]

    total_latency_ms += latency

    if not fastest_query or latency < fastest_latency_ms:
        fastest_latency_ms = latency

    if not slowest_query or latency > slowest_latency_ms:
        slowest_latency_ms = latency

    for index, result in enumerate(results):
        title = result.title
        retrieved_titles.append(title)

        if title in expected_titles:
            found = True
            found_rank = index + 1
            total_reciprocal_rank += 1/found_rank
            total_rank += found_rank
            break

    if found:
        tests_ran += 1
        passed_tests += 1
        reciprocal_rank = 1 / found_rank
        print(f"PASS {title}")
        print(f"Query: {query}")
        print(f"Expected: {expected_titles}")
        print(f"Found Rank: {found_rank}")
        for title in retrieved_titles:
            print(f"Retrieved: {title}")
        print(f"Top K: {top_k}")
        single_result = {
            "query": query,
            "expected_titles": expected_titles,
            "retrieved_titles": retrieved_titles,
            "found": found,
            "found_rank": found_rank,
            "reciprocal_rank": reciprocal_rank,
            "latency_ms": latency,
            "top_k": top_k,
            }
        query_records.append(single_result)
    else:
        tests_ran += 1
        failed_tests += 1
        print("FAIL")
        print(f"Expected: {expected_titles}")
        for title in retrieved_titles:
            print(f"Retrieved: {title}")
        print(f"Top K: {top_k}")


recallk = passed_tests / tests_ran * 100
average_rank = total_rank / passed_tests
average_rank = total_rank / passed_tests if passed_tests else 0
average_latency = total_latency_ms / tests_ran
mrr = total_reciprocal_rank / tests_ran
            
print("-------------------------------------")

print(f"Tests Ran: {tests_ran}")
print(f"Passed: {passed_tests}")
print(f"Failed: {failed_tests}")
print(f"Average Retreival Latency: {average_latency}")
print(f"Recall@K: {recallk:.2f}%")
print(f"Average Found Rank: {average_rank:.2f}")
print(f"MRR is: {mrr:.2f}")

summary = {
    "tests_ran": tests_ran,
    "passed": passed_tests,
    "failed": failed_tests,
    "hit_rate_at_k": recallk,
    "mrr": mrr,
    "average_found_rank": average_rank,
    "average_latency_ms": average_latency,
}

current_time = datetime.now()

timestamp = current_time.strftime("%Y%m%d_%H%M%S")

evaluation_run = {
    "summary": summary,
    "results": query_records,
    "timestamp": timestamp
}

target_dir = Path("eval_results")
file_path = target_dir / f"evaluation_results_{timestamp}.json"

target_dir.mkdir(parents=True, exist_ok=True)

with open(file_path, "w", encoding="utf-8") as file:
    json.dump(evaluation_run, file, indent=4)