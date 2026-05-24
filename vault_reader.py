from pathlib import Path
from models import Note
import hashlib

from datetime import datetime


def read_vault(vault_path: str):
    """
    Read all markdown files from an Obsidian vault.

    Returns a list of dictionaries.
    Each dictionary represents one note.
    """

    vault = Path(vault_path)

    if not vault.exists():
        raise FileNotFoundError(f"Vault path does not exist: {vault_path}")

    notes = []

    for file_path in vault.rglob("*.md"):
        text = file_path.read_text(encoding="utf-8", errors="ignore")

        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()

        last_indexed = datetime.now()

        note = Note(file_path.stem, str(file_path), str(file_path.relative_to(vault)), text, content_hash, last_indexed)

        notes.append(note)

    return notes