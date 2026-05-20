def build_context(results):
    context_blocks = []

    for index, result in enumerate(results):
        title = result["title"]
        heading = result["heading"]
        path = result["path"]
        text = result["text"]

        source_block = f"Source {index + 1}\n Title: {title}\n Header: {heading}\n Path: {path}\n Text:{text}"

        context_blocks.append(source_block)

    context_string = "\n\n-----------------------\n\n".join(context_blocks)
    
    return context_string

def build_prompt(question, results):
    context = build_context(results)
    prompt = f"""
            You are Genesis, a local vault assistant.

            Use ONLY the vault context below.
            If the answer is not in the context, say you do not know from the vault context.
            Mention source titles/headings when useful.

            VAULT CONTEXT:
            {context}

            USER QUESTION:
            {question}

            ANSWER:"""

    return prompt