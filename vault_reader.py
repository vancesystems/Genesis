from pathlib import Path
from models import Note


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

        note = Note(file_path.stem, str(file_path), str(file_path.relative_to(vault)), text)

        notes.append(note)

    return notes