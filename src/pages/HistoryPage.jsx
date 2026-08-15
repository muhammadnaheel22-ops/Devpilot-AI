import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Bot, Clock3, History, MessageSquareText, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversations, getUserActivity } from '../services/userDataService';
import { Button } from '../components/ui/Button';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Unknown date';
}

function conversationText(conversation) {
  return (conversation.messages || []).map((message) => message.content).join(' ');
}

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [conversations, setConversations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([getConversations(user?.uid), getUserActivity(user?.uid)])
      .then(([nextConversations, nextActivity]) => {
        if (!active) return;
        setConversations(nextConversations);
        setActivity(nextActivity);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load history.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const filteredConversations = useMemo(() => {
    if (!deferredQuery) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.title} ${conversation.language} ${conversationText(conversation)}`
        .toLowerCase()
        .includes(deferredQuery),
    );
  }, [conversations, deferredQuery]);

  const filteredActivity = useMemo(() => {
    if (!deferredQuery) return activity;
    return activity.filter((item) =>
      `${item.title} ${item.details || ''} ${item.mode} ${item.language}`
        .toLowerCase()
        .includes(deferredQuery),
    );
  }, [activity, deferredQuery]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-500">
            <History size={18} /> YOUR HISTORY
          </div>
          <h1 className="mt-2 text-3xl font-bold">Search and conversation history</h1>
          <p className="text-muted mt-2">
            Review your previous AI chats and requests saved securely to your Neon account.
          </p>
        </div>
        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:w-96">
          <Search className="text-muted shrink-0" size={19} />
          <span className="sr-only">Search history</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your history…"
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
      </div>

      {error ? (
        <div className="panel mt-6 p-6 text-center text-red-500">{error}</div>
      ) : loading ? (
        <div className="panel mt-6 p-8 text-center text-muted">Loading your history…</div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MessageSquareText size={20} className="text-violet-500" /> Conversations
                </h2>
                <p className="text-muted mt-1 text-sm">
                  {filteredConversations.length} saved chats
                </p>
              </div>
            </div>
            <div className="scrollbar-thin max-h-[65vh] space-y-3 overflow-y-auto p-4">
              {filteredConversations.length ? (
                filteredConversations.map((conversation) => {
                  const firstRequest = (conversation.messages || []).find(
                    (message) => message.role === 'user',
                  )?.content;
                  return (
                    <article
                      key={conversation.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">
                            {conversation.title || 'Conversation'}
                          </h3>
                          <div className="text-muted mt-1 flex items-center gap-2 text-xs">
                            <Clock3 size={13} /> {formatDate(conversation.updatedAt)} ·{' '}
                            {conversation.language || 'auto'}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => navigate('/app/chat', { state: { conversation } })}
                        >
                          Open
                        </Button>
                      </div>
                      {firstRequest ? (
                        <p className="text-muted mt-3 line-clamp-3 whitespace-pre-wrap text-sm">
                          {firstRequest}
                        </p>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted">No matching conversations.</div>
              )}
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="border-b border-[var(--border)] p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Bot size={20} className="text-blue-500" /> AI requests
              </h2>
              <p className="text-muted mt-1 text-sm">{filteredActivity.length} saved requests</p>
            </div>
            <div className="scrollbar-thin max-h-[65vh] space-y-3 overflow-y-auto p-4">
              {filteredActivity.length ? (
                filteredActivity.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-500">
                        {item.mode}
                      </span>
                    </div>
                    <div className="text-muted mt-1 flex items-center gap-2 text-xs">
                      <Clock3 size={13} /> {formatDate(item.at)} · {item.language || 'auto'}
                    </div>
                    {item.details ? (
                      <p className="text-muted mt-3 line-clamp-4 whitespace-pre-wrap text-sm">
                        {item.details}
                      </p>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="p-8 text-center text-muted">No matching requests.</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
