import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import { z } from 'zod';
initializeApp();
const geminiKey = defineSecret('GEMINI_API_KEY');
const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(30000) }))
    .min(1)
    .max(30),
  mode: z.string().max(40).default('chat'),
  language: z.string().max(40).default('auto'),
});
const createGeminiContents = (messages) => {
  const firstUserIndex = messages.findIndex((message) => message.role === 'user');
  if (firstUserIndex === -1) return [];
  return messages.slice(firstUserIndex).reduce((contents, message) => {
    const role = message.role === 'assistant' ? 'model' : 'user';
    const text = message.content.trim();
    if (!text) return contents;
    const previous = contents.at(-1);
    if (previous?.role === role) previous.parts[0].text += `\n\n${text}`;
    else contents.push({ role, parts: [{ text }] });
    return contents;
  }, []);
};
export const api = onRequest(
  { secrets: [geminiKey], cors: true, timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    if (!req.path.endsWith('/gemini/stream') || req.method !== 'POST')
      return res.status(404).json({ message: 'Not found' });
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    try {
      await getAuth().verifyIdToken(token);
    } catch {
      return res.status(401).json({ message: 'Invalid session' });
    }
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid request' });
    const { messages, mode, language } = parsed.data;
    const contents = createGeminiContents(messages);
    if (!contents.length) return res.status(400).json({ message: 'Please enter a user message.' });
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    const ai = new GoogleGenAI({ apiKey: geminiKey.value() });
    try {
      const stream = await ai.models.generateContentStream({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: `You are DevPilot AI. Mode: ${mode}. Preferred language: ${language}. Return secure production-ready software guidance in Markdown.`,
          temperature: 0.35,
          maxOutputTokens: 8192,
        },
      });
      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          res.flush?.();
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.flush?.();
      res.end();
    } catch (e) {
      console.error(e);
      res.write(`data: ${JSON.stringify({ error: 'Gemini generation failed.' })}\n\n`);
      res.flush?.();
      res.end();
    }
  },
);
