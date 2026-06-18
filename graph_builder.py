import re
from models import NoteLink
from notes_db import get_note_by_title, get_outgoing_links, get_backlinks

def extract_wiki_links(text):
    matches = re.findall(r"\[\[(.*?)\]\]", text)
    return matches

def build_note_links(note):
    raw_links = extract_wiki_links(note.text)

    note_links = []

    for link in raw_links:
        if "|" in link:
            target_name, link_text = link.split("|", 1)

            target_name = target_name.strip()
            link_text = link_text.strip()
        else:
            target_name = link.strip()
            link_text = None

        target_note = get_note_by_title(target_name)

        if target_note:
            target_path = target_note["path"]
        else:
            target_path = None

        note_link = NoteLink(
            source_path=note.path,
            target_name=target_name,
            target_path=target_path,
            link_text=link_text,
            link_type="wikilink"
        )

        note_links.append(note_link)

    return note_links

def get_note_graph(note_path):
    outgoing = get_outgoing_links(note_path)

    backlinks = get_backlinks(note_path)


    return {
        "outgoing": outgoing,
        "backlinks": backlinks
    }