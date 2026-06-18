from notes_db import get_outgoing_links, get_backlinks

def row_to_link(row):
    return {
        "source_path": row["source_path"],
        "target_name": row["target_name"],
        "target_path": row["target_path"],
        "link_text": row["link_text"],
        "link_type": row["link_type"]
    }

def get_note_graph(note_path):
    outgoing = get_outgoing_links(note_path)

    backlinks = get_backlinks(note_path)

    return {
        "note_path": note_path,
        "outgoing": [row_to_link(row) for row in outgoing],
        "backlinks": [row_to_link(row) for row in backlinks]
    }