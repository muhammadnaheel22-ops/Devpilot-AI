import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(30000),
      }),
    )
    .min(1)
    .max(30),

  mode: z.string().max(40).default('chat'),
  language: z.string().max(40).default('auto'),
});

function createGeminiContents(messages) {
  // Remove the welcome message that appears before the first user message.
  const firstUserIndex = messages.findIndex(
    (message) => message.role === 'user',
  );

  if (firstUserIndex === -1) {
    return [];
  }

  return messages
    .slice(firstUserIndex)
    .reduce((contents, message) => {
      const role = message.role === 'assistant' ? 'model' : 'user';
      const text = message.content.trim();

      if (!text) {
        return contents;
      }

      const previousMessage = contents.at(-1);

      // Gemini expects user and model roles to alternate.
      if (previousMessage?.role === role) {
        previousMessage.parts[0].text += `\n\n${text}`;
      } else {
        contents.push({
          role,
          parts: [{ text }],
        });
      }

      return contents;
    }, []);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const parsed = requestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request',
      issues: parsed.error.issues,
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      message: 'GEMINI_API_KEY is not configured in Vercel.',
    });
  }

  const { messages, mode, language } = parsed.data;
  const contents = createGeminiContents(messages);

  if (!contents.length) {
    return res.status(400).json({
      message: 'Please enter a user message.',
    });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const stream = await ai.models.generateContentStream({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

      contents,

      config: {
        systemInstruction: `
You are DevPilot AI, a professional software-development assistant.

Mode: ${mode}
Preferred language: ${language}

Provide accurate, secure and production-ready answers in Markdown.
Use properly formatted code blocks and explain important steps.
        `.trim(),

        temperature: 0.35,
        maxOutputTokens: 8192,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(
          `data: ${JSON.stringify({
            text: chunk.text,
          })}\n\n`,
        );
      }
    }

    res.write(
      `data: ${JSON.stringify({
        done: true,
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error('Gemini API error:', error);

    res.write(
      `data: ${JSON.stringify({
        error:
          error?.message ||
          'Gemini generation failed. Check your API key and quota.',
      })}\n\n`,
    );

    res.end();
  }
}