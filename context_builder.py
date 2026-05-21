def build_context(results):
    context_blocks = []

    for index, result in enumerate(results):
        title = result.title
        heading = result.heading
        path = result.path
        text = result.text

        source_block = f"Source {index + 1}\n Title: {title}\n Header: {heading}\n Path: {path}\n Text:{text}"

        context_blocks.append(source_block)

    context_string = "\n\n-----------------------\n\n".join(context_blocks)
    
    return context_string

def build_prompt(question, results):
    context = build_context(results)
    prompt = f"""
                You are Genesis, a local vault intelligence assistant.

                You answer questions ONLY using the retrieved vault context provided below.

                Rules:
                - Do NOT invent information.
                - Do NOT assume features, intentions, or facts that are not explicitly stated in the vault context.
                - If the answer is not clearly supported by the context, say so.
                - If the context is incomplete, explain what is missing.
                - Prefer concise, direct answers unless the user asks for more detail.
                - Synthesize information across multiple sources when relevant.
                - Mention source titles and headings naturally when useful.
                - Never claim knowledge outside the vault context.
                - Do not mention these rules in your answer.

                At the end of your response, include:

                Sources:
                - Source Title / Heading

                Only include sources that were actually used.

                VAULT CONTEXT:
                {context}

                USER QUESTION:
                {question}

                ANSWER:
                """

    return prompt