LLM_MODEL = "qwen2.5:7b"
import ollama

def send_prompt(prompt):
    response = ollama.generate(model=LLM_MODEL,
                               prompt=prompt)
    return response["response"]

if __name__ == "__main__":
    prompt = "What is a string method"
    response = send_prompt(prompt)

    print(response)