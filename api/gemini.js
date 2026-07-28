import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
const schema=z.object({messages:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().min(1).max(30000)})).min(1).max(30),mode:z.string().max(40).default('chat'),language:z.string().max(40).default('auto')});
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:'Invalid request'});
  if(!process.env.GEMINI_API_KEY)return res.status(503).json({message:'GEMINI_API_KEY is not configured'});
  res.setHeader('Content-Type','text/event-stream; charset=utf-8');res.setHeader('Cache-Control','no-cache, no-transform');
  try{const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});const {messages,mode,language}=parsed.data;const stream=await ai.models.generateContentStream({model:process.env.GEMINI_MODEL||'gemini-2.5-flash',contents:messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),config:{systemInstruction:`You are DevPilot AI. Mode: ${mode}. Preferred language: ${language}. Return secure production-ready software guidance in Markdown.`,temperature:.35,maxOutputTokens:8192}});for await(const chunk of stream){if(chunk.text)res.write(`data: ${JSON.stringify({text:chunk.text})}\n\n`)}res.end();}catch(e){console.error(e);res.write(`data: ${JSON.stringify({error:'Gemini generation failed.'})}\n\n`);res.end();}}
