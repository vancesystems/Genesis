import sqlite3
from models import Chunk

def get_connection():
    conn = sqlite3.connect("obsidian_notes.db")

    conn.row_factory = sqlite3.Row

    return conn

def create_tables():
    conn = get_connection()

    c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS notes_table (
              title TEXT NOT NULL,
              path TEXT PRIMARY KEY,
              relative_path TEXT,
              text TEXT,
              content_hash TEXT,
              last_indexed TEXT
               
            )""")

    c.execute("""CREATE TABLE IF NOT EXISTS chunk_table (
              chunk_id TEXT PRIMARY KEY,
              note_title TEXT NOT NULL,
              note_path TEXT NOT NULL,
              section_index INTEGER,
              chunk_index INTEGER,
              heading TEXT,
              text TEXT 
               
            )""")
    
    c.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts
        USING fts5(
            chunk_id,
            note_title,
            note_path,
            heading,
            text
        )
        """)
    
    conn.commit()

    conn.close()


def save_note(note):
    conn = get_connection()

    c = conn.cursor()

    last_indexed = note.last_indexed.isoformat()

    c.execute(
        "REPLACE INTO notes_table VALUES (?,?,?,?,?,?)",
        (note.title, note.path, note.relative_path, note.text, note.content_hash, last_indexed)
    )

    conn.commit()
    conn.close()

def save_chunk(chunk):
    conn = get_connection()

    c = conn.cursor()
    
    c.execute(
        "REPLACE INTO chunk_table VALUES (?,?,?,?,?,?,?)",
        (chunk.chunk_id, chunk.note_title, chunk.note_path, chunk.section_index, chunk.chunk_index, chunk.heading, chunk.text)
    )

    conn.commit()

    conn.close()

def save_chunk_fts(chunk):
    conn = get_connection()

    c = conn.cursor()

    c.execute(
        "REPLACE INTO chunks_fts VALUES (?,?,?,?,?)",
        (chunk.chunk_id, chunk.note_title, chunk.note_path, chunk.heading, chunk.text)
    )

    conn.commit()

    conn.close()

def get_all_notes():
  conn = get_connection()

  c = conn.cursor()

  c.execute("SELECT * FROM notes_table")

  items = c.fetchall()

  conn.close()

  return items

def get_note_by_path(path):
    conn = get_connection()

    c = conn.cursor()

    c.execute("SELECT * FROM notes_table WHERE path = ?",
              (path, )
            )
    
    result = c.fetchone()

    conn.close()

    return result

def get_chunks_for_note(note_path):
    conn = get_connection()

    c = conn.cursor()

    c.execute("SELECT * FROM chunk_table WHERE note_path = ?",
              (note_path,)
              )
    
    results = c.fetchall()

    conn.close()

    return results

def delete_chunks_for_note(note_path):
    conn = get_connection()

    c = conn.cursor()

    c.execute("DELETE FROM chunk_table WHERE note_path = ?",
              (note_path,)
              )
    conn.commit()

    conn.close()

def delete_fts_for_note(note_path):
    conn = get_connection()

    c = conn.cursor()

    c.execute("DELETE FROM chunks_fts WHERE note_path = ?",
              (note_path,)
              )
    
    conn.commit()

    conn.close()

def delete_note_by_path(path):
    conn = get_connection()

    c = conn.cursor()

    c.execute("DELETE FROM notes_table WHERE path = ?",
              (path,))
    
    conn.commit()

    conn.close()

def get_all_note_paths():
    conn = get_connection()

    c = conn.cursor()

    c.execute("SELECT path FROM notes_table")

    result = c.fetchall()

    vault_paths = set()

    for row in result:
        vault_paths.add(row["path"])

    conn.close()

    return vault_paths

def get_all_chunks():
    conn = get_connection()

    c = conn.cursor()

    c.execute("SELECT * FROM chunk_table")
    
    results = c.fetchall()

    conn.close()

    return results

def get_chunk_by_id(chunk_id):
    conn = get_connection()

    c = conn.cursor()

    c.execute("SELECT * FROM chunk_table WHERE chunk_id = ?",
              (chunk_id, )
              )
    
    results = c.fetchone()

    conn.close()

    return results

def get_all_chunk_objects():
    chunks = get_all_chunks()
    chunk_list = []

    for chunk in chunks:
        chunk_object = Chunk(chunk["chunk_id"], chunk["note_title"], chunk["note_path"], chunk["section_index"], 
                             chunk["chunk_index"], chunk["heading"], chunk["text"])
        chunk_list.append(chunk_object)

    return chunk_list