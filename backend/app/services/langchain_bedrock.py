import boto3
import logging
from langchain_aws import ChatBedrockConverse
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are OmniChat — a highly capable, concise AI assistant. "
    "Be direct and accurate. When switching from a previous model in the conversation, "
    "acknowledge the handoff naturally. Format code in markdown code blocks."
)

# Cache the bedrock-runtime client at module level — creating a new boto3
# Session and client on every request adds unnecessary overhead.
_bedrock_client = None


def _get_bedrock_client():
    global _bedrock_client
    if _bedrock_client is None:
        session_kwargs: dict = {
            "aws_access_key_id": settings.aws_access_key_id,
            "aws_secret_access_key": settings.aws_secret_access_key,
            "region_name": settings.aws_region,
        }
        if settings.aws_session_token:
            session_kwargs["aws_session_token"] = settings.aws_session_token
        session = boto3.Session(**session_kwargs)
        _bedrock_client = session.client("bedrock-runtime")
    return _bedrock_client


def get_bedrock_chat_model(model_id: str, temperature: float = 0.7) -> ChatBedrockConverse:
    """Initialise a LangChain Bedrock model, reusing the cached boto3 client."""
    return ChatBedrockConverse(
        client=_get_bedrock_client(),
        model=model_id,
        temperature=temperature,
    )


def get_ollama_chat_model(model_id: str) -> ChatOllama:
    """Initialise a LangChain Ollama model pointing at our hosted instance."""
    return ChatOllama(
        base_url=settings.ollama_base_url,
        model=model_id,
    )


async def stream_response(
    model_id: str,
    history: list[dict],
):
    """
    Stream a response from the selected model given full conversation history.

    Args:
        model_id: Bedrock model ID or Ollama model name.
        history: List of {"role": "user"|"assistant", "content": str} dicts.
                 The LAST entry must be the new user message.

    Yields:
        str chunks of the assistant response.
    """
    is_ollama = model_id.startswith("llama") or model_id.startswith("mistral")
    chat_model = get_ollama_chat_model(model_id) if is_ollama else get_bedrock_chat_model(model_id)

    # Build LangChain message sequence
    lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))

    async for chunk in chat_model.astream(lc_messages):
        if chunk.content:
            if isinstance(chunk.content, list):
                for block in chunk.content:
                    if isinstance(block, dict) and "text" in block:
                        yield block["text"]
            elif isinstance(chunk.content, str):
                yield chunk.content


# ---------------------------------------------------------------------------
# Backward-compat alias used by existing callers during transition
# ---------------------------------------------------------------------------
async def stream_bedrock_response(model_id: str, history: list[dict]):
    async for chunk in stream_response(model_id, history):
        yield chunk
