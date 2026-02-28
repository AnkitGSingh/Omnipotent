import httpx
import asyncio

async def test_stream():
    url = "http://127.0.0.1:8000/api/chat/stream?message=Say%20hello%20world%20in%203%20words"
    print(f"Connecting to {url}...")
    
    async with httpx.AsyncClient() as client:
        try:
            async with client.stream("POST", url, timeout=15) as response:
                print(f"Connected! Status code: {response.status_code}")
                async for chunk in response.aiter_lines():
                    if chunk.strip():
                        print(f"Received chunk: {chunk}")
        except Exception as e:
            print(f"Error during stream: {e}")

if __name__ == "__main__":
    asyncio.run(test_stream())
