import ollama
from config import settings

def send_prompt(prompt):
    response = ollama.generate(model=settings.llm_model,
                               prompt=prompt)
    return response["response"]