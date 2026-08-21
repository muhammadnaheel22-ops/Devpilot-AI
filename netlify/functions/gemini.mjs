import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { createGeminiContents } from '../../server/geminiMessages.mjs';
import { verifyOptionalFirebaseAuth } from '../../server/firebaseAuth.mjs';

const requestSchema = z.object({
  messages: z
    .array(
      z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(30_000) }),
    )
    .min(1)
    .max(30),
  mode: z.string().max(40).default('chat'),
  language: z.string().max(40).default('auto'),
});

export default async (request) => {
  if (request.method !== 'POST')
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
  if (!process.env.GEMINI_API_KEY)
    return new Response(JSON.stringify({ message: 'GEMINI_API_KEY is not configured' }), {
      status: 503,
    });
  const authResult = await verifyOptionalFirebaseAuth(request.headers.get('authorization'));
  if (!authResult.ok)
    return new Response(JSON.stringify({ message: authResult.message }), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json' },
    });
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success)
    return new Response(JSON.stringify({ message: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  const { messages, mode, language } = parsed.data;
  const contents = createGeminiContents(messages);
  if (!contents.length)
    return new Response(JSON.stringify({ message: 'Please enter a user message.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const result = await ai.models.generateContentStream({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: `You are DevPilot AI. Mode: ${mode}. Preferred language: ${language}. Return secure production-ready software guidance in Markdown.`,
            temperature: 0.35,
            maxOutputTokens: 8192,
          },
        });
        for await (const chunk of result) {
          if (chunk.text)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (e) {
        console.error(e);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Gemini generation failed.' })}\n\n`),
        );
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
};
