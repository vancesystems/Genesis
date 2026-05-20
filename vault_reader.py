from pathlib import Path


def read_vault(vault_path: str) -> list[dict]:
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

        note = {
            "title": file_path.stem,
            "path": str(file_path),
            "relative_path": str(file_path.relative_to(vault)),
            "text": text,
        }

        notes.append(note)

    return notes


if __name__ == "__main__":
    VAULT_PATH = r"d:\vault"

    notes = read_vault(VAULT_PATH)

    print(f"Found {len(notes)} notes.")

    for note in notes[:5]:
        print("-----")
        print("Title:", note["title"])
        print("Path:", note["relative_path"])
        print("Preview:", note["text"][:200])