import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LoaderCircle, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
export default function ApiTesterPage() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const send = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const response = await axios({
        method,
        url,
        headers: JSON.parse(headers || '{}'),
        data: ['GET', 'DELETE'].includes(method) ? undefined : JSON.parse(body || '{}'),
        timeout: 30_000,
        validateStatus: () => true,
      });
      setResult({
        status: response.status,
        statusText: response.statusText,
        time: Math.round(performance.now() - start),
        headers: response.headers,
        data: response.data,
      });
    } catch (e) {
      toast.error(e.message);
      setResult({ error: e.message, time: Math.round(performance.now() - start) });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h1 className="text-3xl font-bold">REST API Tester</h1>
      <p className="text-muted mt-2">
        Send HTTP requests and inspect formatted responses. Browser CORS rules still apply.
      </p>
      <div className="panel mt-6 p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-bold"
          >
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
          />
          <Button onClick={send} disabled={loading}>
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}Send
          </Button>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-medium">Headers (JSON)</span>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              className="font-mono min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 outline-none"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium">Body (JSON)</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={['GET', 'DELETE'].includes(method)}
              className="font-mono min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 outline-none disabled:opacity-50"
            />
          </label>
        </div>
      </div>
      <div className="panel mt-5 overflow-hidden">
        <div className="flex items-center gap-4 border-b border-[var(--border)] p-4">
          <span className="font-bold">Response</span>
          {result?.status && (
            <span
              className={`rounded-lg px-2 py-1 text-xs font-bold ${result.status < 400 ? 'bg-emerald-500/12 text-emerald-500' : 'bg-red-500/12 text-red-500'}`}
            >
              {result.status} {result.statusText}
            </span>
          )}
          {result?.time && <span className="text-muted text-xs">{result.time} ms</span>}
        </div>
        <pre className="font-mono scrollbar-thin min-h-72 overflow-auto p-5 text-sm">
          {result ? JSON.stringify(result, null, 2) : 'Send a request to view its response.'}
        </pre>
      </div>
    </div>
  );
}
