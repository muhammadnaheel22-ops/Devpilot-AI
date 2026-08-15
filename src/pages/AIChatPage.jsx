import { useEffect, useRef, useState } from 'react';
import { Bot, Plus, RefreshCw, Send, Square, StepForward, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { ModelSelect } from '../components/ui/ModelSelect';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { getOpenRouterModels, streamOpenRouter } from '../services/openRouterService';
import { useAuth } from '../context/AuthContext';
import { getConversations, recordActivity, saveConversation } from '../services/userDataService';

const initialMessage = {
  role: 'assistant',
  content:
    'Hello! I’m DevPilot AI. Ask me to build, explain, debug, optimize, or document software.',
};
const fallbackModel = 'openai/gpt-4o-mini';

export default function AIChatPage() {
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('auto');
  const [model, setModel] = useState(fallbackModel);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const controller = useRef(null);
  const { getToken, user } = useAuth();

  useEffect(() => {
    getConversations(user?.uid)
      .then(setHistory)
      .catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    const abortController = new AbortController();
    let active = true;
    getOpenRouterModels({ signal: abortController.signal })
      .then(({ models: availableModels, defaultModel }) => {
        if (!active) return;
        setModels(availableModels);
        setModel((current) =>
          availableModels.some((item) => item.id === current) ? current : defaultModel,
        );
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') toast.error('Could not refresh the model list.');
      })
      .finally(() => {
        if (active) setModelsLoading(false);
      });
    return () => {
      active = false;
      abortController.abort();
    };
  }, []);

  const newConversation = () => setMessages([initialMessage]);

  const runGeneration = async (requestMessages, titleText) => {
    setMessages([...requestMessages, { role: 'assistant', content: '' }]);
    setRunning(true);
    controller.current = new AbortController();
    let answer = '';

    try {
      const token = await getToken();
      await streamOpenRouter({
        messages: requestMessages,
        mode: 'chat',
        language,
        model,
        token,
        signal: controller.current.signal,
        onChunk: (chunk) => {
          answer += chunk;
          setMessages((current) =>
            current.map((message, index) =>
              index === current.length - 1
                ? { ...message, content: message.content + chunk }
                : message,
            ),
          );
        },
      });

      const completedMessages = [...requestMessages, { role: 'assistant', content: answer }];
      await Promise.all([
        recordActivity(user?.uid, {
          title: `AI Chat: ${titleText.slice(0, 60)}`,
          mode: 'chat',
          language,
        }),
        saveConversation(user?.uid, {
          title: titleText.slice(0, 70),
          language,
          messages: completedMessages,
        }),
      ]);
      setHistory(await getConversations(user?.uid));
    } catch (error) {
      if (error.name !== 'AbortError') toast.error(error.message);
    } finally {
      setRunning(false);
    }
  };

  const send = async () => {
    if (!input.trim() || running) return;
    const text = input.trim();
    setInput('');
    await runGeneration([...messages, { role: 'user', content: text }], text);
  };

  const regenerate = async () => {
    if (running) return;
    const requestMessages =
      messages.at(-1)?.role === 'assistant' ? messages.slice(0, -1) : messages;
    const lastUserMessage = [...requestMessages]
      .reverse()
      .find((message) => message.role === 'user');
    if (!lastUserMessage) return toast.error('Send a message first');
    await runGeneration(requestMessages, lastUserMessage.content);
  };

  const continueGeneration = async () => {
    if (running) return;
    const hasAnswer = messages.some(
      (message) => message.role === 'assistant' && message !== initialMessage,
    );
    if (!hasAnswer) return toast.error('Generate a response first');
    const instruction =
      'Continue the previous answer exactly where it stopped. Do not repeat completed sections. Preserve the same format and technical assumptions.';
    await runGeneration(
      [...messages, { role: 'user', content: instruction }],
      'Continue generation',
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-violet-500">AI ASSISTANT</p>
          <h1 className="mt-2 text-3xl font-bold">Developer Chat</h1>
          <p className="text-muted mt-2">
            Context-aware coding help with streaming, regeneration, continuation, and history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ModelSelect
            value={model}
            models={models}
            onChange={setModel}
            loading={modelsLoading}
            disabled={running}
          />
          <LanguageSelect value={language} onChange={setLanguage} />
          <Button variant="secondary" onClick={regenerate} disabled={running}>
            <RefreshCw size={17} /> Regenerate
          </Button>
          <Button variant="secondary" onClick={continueGeneration} disabled={running}>
            <StepForward size={17} /> Continue
          </Button>
          <Button variant="secondary" onClick={newConversation} disabled={running}>
            <Plus size={17} /> New
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[230px_1fr]">
        <aside className="panel hidden p-3 xl:block">
          <div className="px-2 py-2 text-sm font-bold">Recent conversations</div>
          <div className="mt-2 space-y-1">
            {history.length ? (
              history.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setMessages(conversation.messages || [initialMessage]);
                    setLanguage(conversation.language || 'auto');
                  }}
                  className="w-full rounded-xl p-3 text-left hover:bg-violet-500/10"
                >
                  <div className="truncate text-sm font-medium">
                    {conversation.title || 'Conversation'}
                  </div>
                  <div className="text-muted mt-1 text-xs">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-muted p-3 text-sm">No saved conversations yet.</div>
            )}
          </div>
        </aside>

        <section className="panel overflow-hidden">
          <div className="scrollbar-thin h-[62vh] min-h-[480px] overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-white">
                      <Bot size={19} />
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-violet-600 text-white'
                        : 'border border-[var(--border)] bg-[var(--surface)]'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <MarkdownRenderer
                        content={
                          message.content || (running && index === messages.length - 1 ? '▍' : '')
                        }
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
                      <User size={19} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-[var(--border)] p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Ask DevPilot AI… (Enter to send, Shift+Enter for new line)"
                className="max-h-40 min-h-12 flex-1 resize-none bg-transparent p-2 outline-none"
              />
              {running ? (
                <Button variant="danger" onClick={() => controller.current?.abort()}>
                  <Square size={17} />
                </Button>
              ) : (
                <Button onClick={send}>
                  <Send size={17} />
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
