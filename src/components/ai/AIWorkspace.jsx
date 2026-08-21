import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import {
  Download,
  FileJson,
  FileText,
  LoaderCircle,
  Save,
  Send,
  Square,
  WandSparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { LanguageSelect } from '../ui/LanguageSelect';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { modePrompts } from '../../constants/tools';
import { streamGemini } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';
import { addUserSnippet, recordActivity } from '../../services/userDataService';
import { exportJson, exportPdf, exportText } from '../../utils/export';
import { useTheme } from '../../context/ThemeContext';
const Editor = lazy(() => import('@monaco-editor/react'));
const samples = {
  generate:
    'Build a secure Express.js CRUD API for project tasks with validation, pagination, tests, and Docker.',
  debug:
    'Paste your code and error message here. Explain the expected behavior and what actually happened.',
  explain:
    'Paste code to explain. Mention whether you want beginner, intermediate, or advanced mode.',
  optimize: 'Paste code to optimize and describe performance or security concerns.',
  document: 'Paste a project summary, API, component, class, or function to document.',
  convert: 'Convert this code from JavaScript to TypeScript with strict types and tests.',
  sql: 'Create a parameterized PostgreSQL query for monthly revenue by customer, including indexes and explanation.',
  regex:
    'Create a safe regex for validating usernames: 3–20 characters, letters, numbers, underscore, no leading number.',
  ui: 'Create a responsive React + Tailwind pricing section with monthly/yearly toggle, dark mode, and accessible cards.',
};
export function AIWorkspace({ mode, title, description }) {
  const [language, setLanguage] = useState('auto');
  const [prompt, setPrompt] = useState(samples[mode] || '');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const controller = useRef(null);
  const { getToken, user } = useAuth();
  const { resolvedTheme } = useTheme();
  const promptText = useMemo(
    () => `${modePrompts[mode]}\n\nPreferred language: ${language}.\n\nUser request:\n${prompt}`,
    [mode, language, prompt],
  );
  const run = async () => {
    if (!prompt.trim()) return toast.error('Enter a request or code first');
    setRunning(true);
    setOutput('');
    controller.current = new AbortController();
    try {
      const token = await getToken();
      await streamGemini({
        messages: [{ role: 'user', content: promptText }],
        mode,
        language,
        token,
        signal: controller.current.signal,
        onChunk: (chunk) => setOutput((v) => v + chunk),
      });
      await recordActivity(user?.uid, {
        title: `${title}: ${prompt.slice(0, 60)}`,
        mode,
        language,
      });
    } catch (e) {
      if (e.name !== 'AbortError') toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };
  const stop = () => controller.current?.abort();
  const save = async () => {
    if (!output) return toast.error('Nothing to save');
    try {
      await addUserSnippet(user?.uid, {
        title: prompt.slice(0, 70) || title,
        language,
        content: output,
        tags: [mode],
      });
      toast.success('Saved to snippets');
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-500">
            AI MODULE
          </p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          <p className="text-muted mt-2 max-w-3xl">{description}</p>
        </div>
        <LanguageSelect value={language} onChange={setLanguage} />
      </div>
      <div className="mt-6 grid min-h-[650px] gap-5 xl:grid-cols-2">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <WandSparkles size={18} className="text-violet-500" />
              Request
            </div>
            <span className="text-muted text-xs">Monaco Editor</span>
          </div>
          <div className="h-[520px]">
            <Suspense fallback={<div className="h-full shimmer" />}>
              <Editor
                height="100%"
                language={language === 'auto' ? 'markdown' : language}
                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                value={prompt}
                onChange={(value) => setPrompt(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                  padding: { top: 18 },
                  scrollBeyondLastLine: false,
                }}
              />
            </Suspense>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] p-3">
            <span className="text-muted text-xs">
              Never paste secrets, passwords, or private keys.
            </span>
            {running ? (
              <Button variant="danger" onClick={stop}>
                <Square size={16} />
                Stop
              </Button>
            ) : (
              <Button onClick={run}>
                <Send size={17} />
                Generate
              </Button>
            )}
          </div>
        </section>
        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
            <div className="font-semibold">AI result</div>
            <div className="flex gap-1">
              <button
                title="Save snippet"
                className="rounded-lg p-2 hover:bg-violet-500/10"
                onClick={save}
              >
                <Save size={17} />
              </button>
              <button
                title="Export Markdown"
                className="rounded-lg p-2 hover:bg-violet-500/10"
                onClick={() => exportText(output, 'devpilot-output.md', 'text/markdown')}
              >
                <FileText size={17} />
              </button>
              <button
                title="Export JSON"
                className="rounded-lg p-2 hover:bg-violet-500/10"
                onClick={() => exportJson({ mode, language, prompt, output })}
              >
                <FileJson size={17} />
              </button>
              <button
                title="Export PDF"
                className="rounded-lg p-2 hover:bg-violet-500/10"
                onClick={() => exportPdf(output)}
              >
                <Download size={17} />
              </button>
            </div>
          </div>
          <div className="scrollbar-thin h-[585px] overflow-y-auto p-5">
            {output ? (
              <MarkdownRenderer content={output} />
            ) : running ? (
              <div className="flex items-center gap-3 text-muted">
                <LoaderCircle className="animate-spin" />
                DevPilot is analyzing your request…
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <WandSparkles className="mx-auto text-violet-500" size={34} />
                  <p className="mt-4 font-semibold">Your result will appear here</p>
                  <p className="text-muted mt-2 max-w-sm text-sm">
                    Choose a language, describe the task, and generate a streamed response.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
