import { NextResponse } from 'next/server';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { getLLM } from '@/lib/llm';
import type { ModelId } from '@/lib/constants';

// export const runtime = 'edge'; // Disabled to support Node.js built-ins in @langchain/aws

export async function POST(req: Request) {
    try {
        const { messages, modelId } = (await req.json()) as {
            messages: { role: 'user' | 'assistant'; content: string }[];
            modelId: ModelId;
        };

        const llm = getLLM(modelId);
        const parser = new StringOutputParser();

        // Convert to LangChain message objects
        const lcMessages = [
            new SystemMessage(
                'You are OmniChat, a highly capable AI assistant. ' +
                'Be concise, helpful, and accurate. ' +
                'When switching from a previous model, acknowledge the handoff naturally.'
            ),
            ...messages.map((m) =>
                m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
            ),
        ];

        const stream = await llm.pipe(parser).stream(lcMessages);

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        controller.enqueue(encoder.encode(chunk));
                    }
                } catch (e) {
                    console.error('[stream error]', e);
                    controller.enqueue(encoder.encode('\n\n*Error: stream interrupted.*'));
                } finally {
                    controller.close();
                }
            },
        });

        return new NextResponse(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Transfer-Encoding': 'chunked',
            },
        });
    } catch (error) {
        console.error('[chat route error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
