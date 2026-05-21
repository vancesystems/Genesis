from vault_reader import read_vault
from chunker import chunk_notes
from vector_store import get_collection, add_chunk
from embedder import embed_chunk
from llm_client import send_prompt
from context_builder import build_prompt
from search_service import hybrid_search
from config import settings

def index_vault():
    notes = read_vault(settings.vault_path)
    chunked_note = chunk_notes(notes)
    collection = get_collection()
    for index, chunk in enumerate(chunked_note):
        print(f"Indexing {index + 1}/{len(chunked_note)}: {chunk.note_title}")
        embedded_chunk = embed_chunk(chunk)
        add_chunk(collection, chunk, embedded_chunk)

def print_hybrid_results(results):
    for result in results:
        print("-----")
        print("Title:", result.title)
        print("Path:", result.path)
        print("Section Index", result.section_index)
        print("Chunk Index:", result.chunk_index)
        print("Final Score:", result.final_score)
        print("Lexical Score:", result.lexical_score)
        print("Semantic Score:", result.semantic_score)
        print("Matched Terms:", result.matched_terms)
        print("Signals:", result.signals)
        print("Header", result.heading)
        print("Preview:", result.text[:1000])

def print_retrieval_trace(results):
    for index, result in enumerate(results):
        print("-----")
        print("Source", index + 1)
        print("Title:", result.title)
        print("Header", result.heading)
        print("Path:", result.path)
        print("Final Score:", result.final_score)
        print("Signals:", result.signals)
        print("-----")
        print()

def ask_vault_ai():
    user_question = input("What would you like to ask: ")
    hybrid_results = hybrid_search(user_question, settings.vault_path)
    print_retrieval_trace(hybrid_results)
    final_prompt = build_prompt(user_question, hybrid_results)
    llm_answer = send_prompt(final_prompt)
    print(llm_answer)

def ask_vault():
    user_question = input("What would you like to search for? ")
    results = hybrid_search(user_question, settings.vault_path)

    print_hybrid_results(results)


if __name__ =="__main__": 
    while True: 
        user_input = input("Would you like to:\n 1. Index vault \n 2. Ask vault \n 3. Ask ai \n 4. Exit ")
        if user_input.lower() == "1" or user_input.lower() == "index vault":
            index_vault()
        elif user_input.lower() == "2" or  user_input.lower() == "ask vault":
            ask_vault()
        elif user_input.lower() == "3" or  user_input.lower() == "ask ai":
            ask_vault_ai()
        elif user_input.lower() == "4" or user_input.lower() == "Exit":
            break
        else:
            print("Invaild option")