from models import Chunk
from config import settings

def get_heading_level(line):
    position = 0
    while position < len(line) and line[position] == "#":
        position += 1
    if position > 0 and position < len(line) and line[position] == " ":
        return position
    else:
        return 0

def split_heading(text):
    sections = []
    current_heading = ""
    current_lines = []
    current_level = 0

    lines = text.splitlines()

    for line in lines:
        level = get_heading_level(line)
        if level > 0:
            if current_lines:
                sections.append({
                    "heading": current_heading,
                    "current_level": current_level,
                    "lines": current_lines
                })

            current_heading = line
            current_lines = [line]
            current_level = level
        else:
            current_lines.append(line)

    if len(current_lines) > 0:
        sections.append({
                    "heading": current_heading,
                    "current_level": current_level,
                    "lines": current_lines
                })
    return sections

def split_oversized_paragraph(text):
    block_text = []
    start_pos = 0
    while start_pos < len(text):
        end_pos = start_pos + settings.chunk_size
        sliced_text = text[start_pos:end_pos]
        block_text.append(sliced_text)
        start_pos = end_pos - settings.chunk_overlap
    return block_text

def chunk_text(text):
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_len = 0

    for paragraph in paragraphs:
        paragraph = paragraph.strip()

        if paragraph == "":
            continue

        paragraph_len = len(paragraph)

        if paragraph_len > settings.chunk_size:
            if current_chunk:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = []
                current_len = 0
            oversized_chunks = split_oversized_paragraph(paragraph)
            chunks.extend(oversized_chunks)
            continue

        if not current_chunk:
            current_chunk.append(paragraph)
            current_len = paragraph_len
        elif current_len + len("\n\n") + paragraph_len <= settings.chunk_size:
            current_chunk.append(paragraph)
            current_len += len("\n\n") + paragraph_len
        else:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [paragraph]
            current_len = paragraph_len
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks

def chunk_notes(notes):
    all_chunks = []

    for note in notes:
        sections = split_heading(note.text)
        for section_index, section in enumerate(sections):
            section_text = "\n".join(section["lines"])
            chunked_text = chunk_text(section_text)
            for index, chunk in enumerate(chunked_text):
                chunk_id = f"{note.path}::section_{section_index}::chunk_{index}"

                chunk_object = Chunk(chunk_id, note.title, note.path, section_index, index, section["heading"], chunk)
                all_chunks.append(chunk_object)

    return all_chunks
