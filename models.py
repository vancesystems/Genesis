from dataclasses import dataclass


@dataclass
class Note:
    title: str
    path: str
    relative_path: str
    text: str

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