from vault_reader import read_vault
from chunker import chunk_notes
from vector_store import get_collection, add_chunk, delete_note_vectors
from embedder import embed_chunk
from llm_client import send_prompt
from context_builder import build_prompt
from search_service import hybrid_search
from config import settings
from notes_db import *

def index_vault():
    create_tables()
    notes = read_vault(settings.vault_path)
    collection = get_collection()

    reindexed_count = 0
    skipped_count = 0
    deleted_count = 0
    embedded_chunk_count = 0

    current_vault_paths = {note.path for note in notes}
    database_paths = get_all_note_paths()

    deleted_paths = database_paths - current_vault_paths

    for path in deleted_paths:
        deleted_count += 1
        print(f"Removing deleted note from index: {path}")
        delete_chunks_for_note(path)
        delete_note_vectors(collection, path)
        delete_note_by_path(path)

    for note in notes:
        old_note = get_note_by_path(note.path)

        if old_note and note.content_hash == old_note["content_hash"]:
            skipped_count += 1
            print(f"Skipping unchanged note: {note.title}")
            continue
        else:
            reindexed_count += 1
            delete_chunks_for_note(note.path)
            delete_note_vectors(collection, note.path)
            save_note(note)
            chunked_note = chunk_notes([note])

            for chunk in chunked_note:
                save_chunk(chunk)

            for index, chunk in enumerate(chunked_note):
                embedded_chunk_count += 1
                print(f"Indexing chunk {index + 1}/{len(chunked_note)}: {chunk.note_title}")
                embedded_chunk = embed_chunk(chunk)
                add_chunk(collection, chunk, embedded_chunk)

    print(f"Index complete:")
    print(f"Reindexed: {reindexed_count} note(s)")
    print(f"Skipped: {skipped_count} note(s)")
    print(f"Deleted: {deleted_count} note(s)")
    print(f"Chunk(s) embedded: {embedded_chunk_count}")

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
    hybrid_results = hybrid_search(user_question)
    print_retrieval_trace(hybrid_results)
    final_prompt = build_prompt(user_question, hybrid_results)
    llm_answer = send_prompt(final_prompt)
    print(llm_answer)

def ask_vault():
    user_question = input("What would you like to search for? ")
    results = hybrid_search(user_question)

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
        elif user_input.lower() == "5" or user_input.lower() == "Check":
            # Debug option not for users hidden from main menu
            notes = get_all_notes()
            print(notes)
        else:
            print("Invaild option")