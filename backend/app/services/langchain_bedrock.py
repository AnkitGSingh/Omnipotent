import os
import boto3
from langchain_aws import ChatBedrockConverse
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from app.core.config import settings

def get_bedrock_chat_model(model_id: str, temperature: float = 0.7):
    """
    Initializes a LangChain ChatBedrock model using credentials from the settings.
    """
    # Create the Boto3 client explicitly with the loaded .env credentials
    session = boto3.Session(
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region
    )
    
    bedrock_client = session.client("bedrock-runtime")
    
    # Pass the explicit client to LangChain
    chat = ChatBedrockConverse(
        client=bedrock_client,
        model=model_id,
        temperature=temperature,
        region_name=settings.aws_region,
    )
    
    return chat

async def stream_bedrock_response(model_id: str, prompt: str, history: list = None):
    """
    Streams the response back from Bedrock.
    Returns an async generator yielding string chunks.
    """
    if history is None:
        history = []
        
    chat_model = get_bedrock_chat_model(model_id=model_id)
    
    # Construct LangChain messages array
    messages = []
    messages.append(SystemMessage(content="You are OmniChat, a helpful, minimalist AI assistant."))
    
    # (Optional) append history here in the future
    # for msg in history:
    #     if msg.role == 'user': messages.append(HumanMessage(content=msg.content))
    #     else: messages.append(AIMessage(content=msg.content))
        
    messages.append(HumanMessage(content=prompt))
    
    # Stream the language model output
    async for chunk in chat_model.astream(messages):
        # We only yield the text content
        if chunk.content:
            if isinstance(chunk.content, list):
                for block in chunk.content:
                    if isinstance(block, dict) and "text" in block:
                        yield block["text"]
            elif isinstance(chunk.content, str):
                yield chunk.content
