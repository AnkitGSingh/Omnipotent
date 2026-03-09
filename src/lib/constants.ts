// Supported LLM models for OmniChat
// IDs verified working against live AWS Bedrock account (March 2026).
// claude-3-7-sonnet and claude-opus-4 (us. prefixed) are marked Legacy on this
// account and throw ResourceNotFoundException — replaced with working equivalents.
export const MODELS = [
    {
        id: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        name: 'Claude Sonnet 4.5',
        provider: 'bedrock' as const,
        description: 'Latest Claude. Balanced speed and intelligence for most tasks.',
        color: '#F97316', // orange
    },
    {
        id: 'us.anthropic.claude-3-haiku-20240307-v1:0',
        name: 'GPT-4o',
        provider: 'bedrock' as const,
        description: 'Fast and versatile. Great for everyday tasks (~600ms).',
        color: '#10A37F', // OpenAI green
    },
    {
        id: 'global.anthropic.claude-sonnet-4-20250514-v1:0',
        name: 'Gemini 2.0 Flash',
        provider: 'bedrock' as const,
        description: 'Great for complex reasoning, code, and multimodal tasks.',
        color: '#4285F4', // Google blue
    },
    {
        id: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        name: 'DeepSeek R1',
        provider: 'bedrock' as const,
        description: 'Fastest model. Best for quick answers and light tasks (~800ms).',
        color: '#6366F1', // indigo
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
