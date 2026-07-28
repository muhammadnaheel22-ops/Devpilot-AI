import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';
export function MarkdownRenderer({ content }) {
  return <div className="prose-dev max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{
    pre({ children }) { const text = children?.props?.children || ''; return <div className="relative"><button aria-label="Copy code" className="absolute right-3 top-3 rounded-lg bg-white/10 p-2 text-zinc-300 hover:bg-white/20" onClick={() => { navigator.clipboard.writeText(String(text).replace(/\n$/, '')); toast.success('Code copied'); }}><Copy size={16}/></button><pre>{children}</pre></div>; },
    a({ children, ...props }) { return <a className="text-violet-500 underline" target="_blank" rel="noreferrer" {...props}>{children}</a>; },
  }}>{content}</ReactMarkdown></div>;
}
