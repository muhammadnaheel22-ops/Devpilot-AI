import { AIWorkspace } from '../components/ai/AIWorkspace'; import { aiTools } from '../constants/tools';
export default function AIToolPage({mode}){ const tool=aiTools.find(t=>t.mode===mode); return <AIWorkspace mode={mode} title={tool?.title||'AI Tool'} description={tool?.description||''}/> }
