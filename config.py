from dataclasses import dataclass

@dataclass
class AppConfig:
    vault_path: str
    embed_model: str
    llm_model: str
    chroma_path: str
    collection_name: str
    default_max_results: int
    lexical_stop_words: set
    chunk_size: int
    chunk_overlap: int

vault_path = r"D:/vault"
embed_model = "nomic-embed-text"
llm_model = "qwen2.5:7b"
chroma_path = "./chroma_db"
collection_name = "vault_chunks"
default_max_results = 5
chunk_size = 1200
chunk_overlap = 200
lexical_stop_words = STOP_WORDS = {
    "a", "an", "the",
    "is", "are", "was", "were",
    "what", "how", "why", "when", "where",
    "do", "does", "did",
    "and", "or", "but",
    "to", "of", "in", "on", "for", "with",
    "this", "that", "these", "those",
    "it", "its",
    "be", "been", "being",
    "as", "by", "from",
    "at", "into", "about",
    "systems"
}

settings = AppConfig(vault_path, embed_model, llm_model, chroma_path, collection_name, default_max_results, lexical_stop_words, chunk_size, chunk_overlap)
