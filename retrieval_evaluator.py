from search_service import hybrid_search

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
        "query": "Deeply explain what Project E.Y.E.S is",
        "expected_titles": ["Project E.Y.E.S Roadmap"],
        "top_k": 5
    }
]

tests_ran = 0
failed_tests = 0
passed_tests = 0
total_rank = 0

for test_case in TEST_CASES:
    query = test_case["query"]
    expected_titles = test_case["expected_titles"]
    top_k = test_case["top_k"]
    found = False
    found_rank = None
    retrieved_titles = []

    results = hybrid_search(query, debug=False, max_results=test_case["top_k"])

    for index, result in enumerate(results):
        title = result.title
        retrieved_titles.append(title)

        if title in expected_titles:
            found = True
            found_rank = index + 1
            total_rank += found_rank
            break

    if found:
        tests_ran += 1
        passed_tests += 1
        print(f"PASS {title}")
        print(f"Query: {query}")
        print(f"Expected: {expected_titles}")
        print(f"Found Rank: {found_rank}")
        for title in retrieved_titles:
            print(f"Retrieved: {title}")
        print(f"Top K: {top_k}")
    else:
        tests_ran += 1
        failed_tests += 1
        print("FAIL")
        print(f"Expected: {expected_titles}")
        for title in retrieved_titles:
            print(f"Retrieved: {title}")
        print(f"Top K: {top_k}")
            
print("-------------------------------------")

print(f"Tests Ran: {tests_ran}")
print(f"Passed: {passed_tests}")
print(f"Failed: {failed_tests}")
recallk = passed_tests / tests_ran * 100
average_rank = total_rank / passed_tests if passed_tests else 0
print(f"Recall@K: {recallk:.2f}%")
print(f"Average Found Rank: {average_rank:.2f}")