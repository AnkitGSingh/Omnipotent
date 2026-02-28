// Supported LLM models for OmniChat
export const MODELS = [
    {
        id: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
        name: 'Claude 3.5 Sonnet',
        provider: 'bedrock' as const,
        description: 'Best for complex reasoning and nuanced writing.',
        color: '#f97316', // orange
    },
    {
        id: 'anthropic.claude-3-haiku-20240307-v1:0',
        name: 'Claude 3 Haiku',
        provider: 'bedrock' as const,
        description: 'Fast and affordable. Great for quick tasks.',
        color: '#06b6d4', // cyan
    },
    {
        id: 'llama3.1:latest',
        name: 'Llama 3.1 (Ollama)',
        provider: 'ollama' as const,
        description: 'Open-source. Hosted on our servers.',
        color: '#22c55e', // green
    },
] as const;

export type ModelId = typeof MODELS[number]['id'];
export type ModelProvider = typeof MODELS[number]['provider'];

// Billing limits in tokens (approximate)
export const PLAN_LIMITS = {
    FREE: 800_000,   // ~£30 worth of Bedrock credits
    BASIC: 1_600_000, // ~£40 limit on £20/mo plan
    MAX: 3_200_000, // ~£80 limit on £50/mo plan
} as const;

// The "thinking" phrases shown while the model is responding
export const THINKING_PHRASES = [
    'Slingshotting to the moon & back...',
    'Thinking about this one carefully...',
    'Consulting the archives...',
    'Connecting the dots...',
    'Crunching through the context...',
    'Firing up the reasoning engines...',
];

export function getRandomThinkingPhrase(): string {
    return THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
}
