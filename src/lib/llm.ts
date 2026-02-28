import { ChatBedrockConverse } from '@langchain/aws';
import { ChatOllama } from '@langchain/ollama';
import type { ModelId } from './constants';

/**
 * Returns the appropriate LangChain LLM instance based on the model ID.
 * Bedrock credentials are pulled from env vars; Ollama connects to the hosted URL.
 */
export function getLLM(modelId: ModelId) {
    const isOllama = modelId.startsWith('llama');

    if (isOllama) {
        return new ChatOllama({
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            model: modelId,
        });
    }

    // Bedrock via AWS credentials from environment
    return new ChatBedrockConverse({
        model: modelId,
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            ...(process.env.AWS_SESSION_TOKEN
                ? { sessionToken: process.env.AWS_SESSION_TOKEN }
                : {}),
        },
    });
}
