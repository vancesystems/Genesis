import ollama
from config import settings

def send_prompt(prompt):
    response = ollama.generate(model=settings.llm_model,
                               prompt=prompt, keep_alive="30m")
    return response["response"]

def stream_prompt(prompt):
    stream = ollama.generate(
        model=settings.llm_model,
        prompt=prompt,
        stream=True,
        keep_alive="30m"
    )

    full_response = ""

    for chunk in stream:
        text = chunk["response"]
        print(text, end="", flush=True)
        full_response += text

    print()
    return full_response

def stream_prompt_chunks(prompt):
    stream = ollama.generate(
        model=settings.llm_model,
        prompt=prompt,
        stream=True,
        keep_alive="30m"
    )

    for chunk in stream:
        yield chunk["response"]