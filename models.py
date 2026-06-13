from dataclasses import dataclass
from datetime import datetime


@dataclass
class Note:
    title: str
    path: str
    relative_path: str
    text: str
    content_hash: str
    last_indexed: datetime

@dataclass
class Chunk:
    chunk_id: str
    note_title: str
    note_path: str
    section_index: int
    chunk_index: int
    heading: str
    text: str


@dataclass
class NoteLink:
    source_path: str
    target_name: str
    target_path: str | None = None
    link_text: str | None = None
    link_type: str = "wikilink"

@dataclass
class SearchResult:
    title: str
    path: str
    section_index: int
    chunk_index: int
    heading: str
    text: str
    lexical_score: int
    semantic_score: int
    final_score: int
    matched_terms: list[str]
    signals: list[str]