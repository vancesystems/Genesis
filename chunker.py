def split_heading(text):
    sections = []
    current_heading = ""
    current_lines = []

    lines = text.splitlines()

    for line in lines:
        if line.startswith("# "):
            if current_heading != "":
                sections.append({
                    "heading": current_heading,
                    "lines": current_lines
                })

            current_heading = line
            current_lines = [line]
        else:
            current_lines.append(line)

    if len(current_lines) > 0:
        sections.append({
                    "heading": current_heading,
                    "lines": current_lines
                })
    return sections

def chunk_text(text, chunk_size = 1200, overlap=200):
    block_text = []
    start_pos = 0
    while start_pos < len(text):
        end_pos = start_pos + chunk_size
        sliced_text = text[start_pos:end_pos]
        block_text.append(sliced_text)
        start_pos = end_pos - overlap
    return block_text

def chunk_notes(notes):
    all_chunks = []

    for note in notes:
        sections = split_heading(note["text"])
        for section_index, section in enumerate(sections):
            section_text = "\n".join(section["lines"])
            chunked_text = chunk_text(section_text)
            for index, chunk in enumerate(chunked_text):
                chunk_dict = {"chunk_id": f"{note['path']}::section_{section_index}::chunk_{index}",
                                "note_title": note["title"],
                                "note_path": note["path"],
                                "section_index": section_index,
                                "chunk_index": index,
                                "heading": section["heading"],
                                "text": chunk}
                all_chunks.append(chunk_dict)

    return all_chunks
