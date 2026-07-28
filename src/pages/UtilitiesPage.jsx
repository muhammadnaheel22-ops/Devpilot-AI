import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import {
  Braces,
  Clock3,
  CodeXml,
  Copy,
  Diff,
  FileCode2,
  FileText,
  KeyRound,
  Palette,
  RefreshCw,
  Variable,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import {
  beautifyCss,
  decodeBase64,
  decodeJwt,
  diffLines,
  encodeBase64,
  formatJson,
  generateLorem,
  generatePassword,
  hexToRgb,
  minifyCss,
  minifyJavaScript,
  minifyJson,
  parseEnv,
  timestampInfo,
  uuid,
} from '../utils/devUtils';

const tools = [
  { id: 'json', name: 'JSON Tools', icon: Braces },
  { id: 'base64', name: 'Base64 Encoder / Decoder', icon: RefreshCw },
  { id: 'uuid', name: 'UUID Generator', icon: KeyRound },
  { id: 'password', name: 'Password Generator', icon: KeyRound },
  { id: 'jwt', name: 'JWT Decoder', icon: KeyRound },
  { id: 'timestamp', name: 'Timestamp Converter', icon: Clock3 },
  { id: 'color', name: 'Color Picker', icon: Palette },
  { id: 'lorem', name: 'Lorem Ipsum Generator', icon: FileText },
  { id: 'markdown', name: 'Markdown Preview', icon: FileText },
  { id: 'html', name: 'HTML Preview', icon: CodeXml },
  { id: 'css', name: 'CSS Minifier / Beautifier', icon: FileCode2 },
  { id: 'javascript', name: 'JavaScript Minifier', icon: FileCode2 },
  { id: 'diff', name: 'Diff Viewer', icon: Diff },
  { id: 'env', name: 'Environment Variable Manager', icon: Variable },
];

const initialValues = {
  json: '{"name":"DevPilot AI","productionReady":true}',
  base64: 'DevPilot AI',
  uuid: '',
  password: '24',
  jwt: 'Paste a JWT here',
  timestamp: String(Math.floor(Date.now() / 1000)),
  color: '#7C3AED',
  lorem: '3',
  markdown:
    '# DevPilot AI\n\n- Markdown preview\n- **Syntax support**\n\n```js\nconsole.log("Hello");\n```',
  html: '<main style="font-family:sans-serif;padding:2rem"><h1>DevPilot AI</h1><p>Safe HTML preview.</p></main>',
  css: '.card { color: white; background: linear-gradient(90deg, #7c3aed, #2563eb); padding: 16px; }',
  javascript: 'function greet(name) {\n  console.log(`Hello ${name}`);\n}\n\ngreet("Developer");',
  diff: 'const mode = "development";\n---AFTER---\nconst mode = "production";',
  env: 'API_URL=https://example.com\nGEMINI_API_KEY=secret-value\nNODE_ENV=production',
};

export default function UtilitiesPage() {
  const [active, setActive] = useState('json');
  const [values, setValues] = useState(initialValues);
  const [output, setOutput] = useState('');
  const input = values[active] || '';
  const setInput = (value) => setValues((current) => ({ ...current, [active]: value }));

  const run = (action) => {
    try {
      let result = '';
      if (action === 'format') result = formatJson(input);
      if (action === 'minify-json') result = minifyJson(input);
      if (action === 'encode') result = encodeBase64(input);
      if (action === 'decode') result = decodeBase64(input);
      if (action === 'uuid') result = uuid();
      if (action === 'password') result = generatePassword(Number(input) || 24);
      if (action === 'jwt') result = JSON.stringify(decodeJwt(input), null, 2);
      if (action === 'timestamp') result = JSON.stringify(timestampInfo(input), null, 2);
      if (action === 'color') result = JSON.stringify(hexToRgb(input), null, 2);
      if (action === 'lorem') result = generateLorem(input);
      if (action === 'css-minify') result = minifyCss(input);
      if (action === 'css-beautify') result = beautifyCss(input);
      if (action === 'js-minify') result = minifyJavaScript(input);
      if (action === 'diff') {
        const [before = '', after = ''] = input.split('\n---AFTER---\n');
        result = diffLines(before, after);
      }
      if (action === 'env') result = JSON.stringify(parseEnv(input), null, 2);
      setOutput(result);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const actions = useMemo(
    () =>
      ({
        json: [
          ['Format', 'format'],
          ['Minify', 'minify-json'],
        ],
        base64: [
          ['Encode', 'encode'],
          ['Decode', 'decode'],
        ],
        uuid: [['Generate UUID', 'uuid']],
        password: [['Generate password', 'password']],
        jwt: [['Decode JWT', 'jwt']],
        timestamp: [['Convert', 'timestamp']],
        color: [['Convert color', 'color']],
        lorem: [['Generate text', 'lorem']],
        css: [
          ['Minify CSS', 'css-minify'],
          ['Beautify CSS', 'css-beautify'],
        ],
        javascript: [['Minify JavaScript', 'js-minify']],
        diff: [['Compare', 'diff']],
        env: [['Parse and mask', 'env']],
      })[active] || [],
    [active],
  );

  const preview = active === 'markdown' || active === 'html';
  const currentTool = tools.find((tool) => tool.id === active);

  return (
    <div>
      <h1 className="text-3xl font-bold">Developer Utilities</h1>
      <p className="text-muted mt-2">Fast, local-first helpers for common engineering tasks.</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="panel scrollbar-thin max-h-[760px] overflow-y-auto p-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setActive(tool.id);
                setOutput('');
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium ${
                active === tool.id
                  ? 'bg-violet-600 text-white'
                  : 'text-muted hover:bg-violet-500/10'
              }`}
            >
              <tool.icon size={18} /> {tool.name}
            </button>
          ))}
        </aside>

        <section className="panel p-5">
          <h2 className="text-xl font-bold">{currentTool?.name}</h2>
          {active === 'color' && (
            <input
              type="color"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="mt-4 h-14 w-24 cursor-pointer rounded-xl border border-[var(--border)] bg-transparent p-1"
              aria-label="Choose color"
            />
          )}
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium">
                {active === 'diff' ? 'Input (separate versions with ---AFTER---)' : 'Input'}
              </span>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="font-mono min-h-96 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 outline-none"
              />
            </label>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-medium">
                {preview ? 'Preview' : 'Output'}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(preview ? input : output);
                    toast.success('Copied');
                  }}
                  className="text-muted hover:text-violet-500"
                  aria-label="Copy output"
                >
                  <Copy size={16} />
                </button>
              </div>
              {active === 'markdown' ? (
                <div className="min-h-96 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <MarkdownRenderer content={input} />
                </div>
              ) : active === 'html' ? (
                <iframe
                  title="Sanitized HTML preview"
                  sandbox=""
                  srcDoc={DOMPurify.sanitize(input, {
                    USE_PROFILES: { html: true },
                    ADD_TAGS: ['style'],
                  })}
                  className="min-h-96 w-full rounded-xl border border-[var(--border)] bg-white"
                />
              ) : (
                <textarea
                  readOnly
                  value={output}
                  className="font-mono min-h-96 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 outline-none"
                />
              )}
            </div>
          </div>
          {actions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map(([label, action]) => (
                <Button key={action} onClick={() => run(action)}>
                  {label}
                </Button>
              ))}
            </div>
          )}
          {active === 'javascript' && (
            <p className="text-muted mt-4 text-xs">
              This local tool performs conservative whitespace minification. Use a compiler-aware
              tool such as Terser in a build pipeline for production bundles.
            </p>
          )}
          {active === 'env' && (
            <p className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-300">
              Values are processed in your browser. Secret-looking variables are masked in the
              output.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
