import { GoogleGenAI } from '@google/genai';
export default async (request) => {
  if (request.method !== 'POST')
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
  if (!process.env.GEMINI_API_KEY)
    return new Response(JSON.stringify({ message: 'GEMINI_API_KEY is not configured' }), {
      status: 503,
    });
  const body = await request.json();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const result = await ai.models.generateContentStream({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents: (body.messages || []).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(m.content || '').slice(0, 30000) }],
          })),
          config: {
            systemInstruction: `You are DevPilot AI. Mode: ${body.mode || 'chat'}. Preferred language: ${body.language || 'auto'}. Return secure production-ready software guidance in Markdown.`,
            temperature: 0.35,
            maxOutputTokens: 8192,
          },
        });
        for await (const chunk of result) {
          if (chunk.text)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
        }
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
    },
  });
};
