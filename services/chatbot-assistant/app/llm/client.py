"""
Owner: Gauri
Thin wrapper around the LLM call + function-calling loop. Swap the model
string or provider here if your team ends up using a different one — the
rest of the service doesn't need to know or care which LLM is behind this.
"""
import os
import json
import anthropic
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.llm.functions import TOOLS, FUNCTION_MAP

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"  # swap freely; anthropic/openai/gemini all support function-calling similarly


def ask_assistant(message: str, language: str = "en") -> str:
    messages = [{"role": "user", "content": message}]

    response = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        tools=TOOLS,
        messages=messages,
    )

    # Run any tool calls the model requested, then send results back once.
    tool_uses = [b for b in response.content if b.type == "tool_use"]
    if not tool_uses:
        text_blocks = [b.text for b in response.content if b.type == "text"]
        return "\n".join(text_blocks) or "I don't have an answer for that yet."

    tool_results = []
    for tool_use in tool_uses:
        func = FUNCTION_MAP.get(tool_use.name)
        result = func(**tool_use.input) if func else {"error": "unknown tool"}
        tool_results.append({
            "type": "tool_result",
            "tool_use_id": tool_use.id,
            "content": json.dumps(result),
        })

    messages.append({"role": "assistant", "content": response.content})
    messages.append({"role": "user", "content": tool_results})

    final = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        tools=TOOLS,
        messages=messages,
    )
    text_blocks = [b.text for b in final.content if b.type == "text"]
    return "\n".join(text_blocks) or "I don't have an answer for that yet."
