import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Braces, Code2, Languages, Plus, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { aiTools } from '../constants/tools';
import { StatCard } from '../components/dashboard/StatCard';
import { getUserActivity, getUserSnippets } from '../services/userDataService';

const data = [
  { day: 'Mon', requests: 8 },
  { day: 'Tue', requests: 14 },
  { day: 'Wed', requests: 10 },
  { day: 'Thu', requests: 19 },
  { day: 'Fri', requests: 24 },
  { day: 'Sat', requests: 17 },
  { day: 'Sun', requests: 28 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: activity = [] } = useQuery({
    queryKey: ['activity', user?.uid],
    queryFn: () => getUserActivity(user?.uid),
    enabled: Boolean(user?.uid),
  });
  const { data: snippets = [] } = useQuery({
    queryKey: ['snippets', user?.uid],
    queryFn: () => getUserSnippets(user?.uid),
    enabled: Boolean(user?.uid),
  });

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
      >
        <div>
          <p className="text-sm font-semibold text-violet-500">DEVELOPER DASHBOARD</p>
          <h1 className="mt-2 text-3xl font-bold">
            Welcome, {user?.displayName?.split(' ')[0] || 'Developer'}
          </h1>
          <p className="text-muted mt-2">
            Choose a tool, continue recent work, or start a new AI session.
          </p>
        </div>
        <Link
          to="/app/code-generator"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/20"
        >
          <Plus size={18} /> New generation
        </Link>
      </motion.div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Sparkles}
          label="AI requests"
          value={activity.length}
          trend="Synced when Firebase is configured"
        />
        <StatCard icon={Code2} label="Saved snippets" value={snippets.length} />
        <StatCard icon={Languages} label="Top language" value={activity[0]?.language || 'Auto'} />
        <StatCard icon={Activity} label="Active tools" value="10+" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="panel p-5">
          <div>
            <h2 className="text-lg font-bold">Weekly activity</h2>
            <p className="text-muted mt-1 text-sm">AI requests across the last seven days</p>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="activity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-strong)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#8b5cf6"
                  fill="url(#activity)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-bold">Recent activity</h2>
          <div className="mt-4 space-y-3">
            {activity.length ? (
              activity.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--border)] p-3">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-muted mt-1 text-xs">
                    {new Date(item.at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[var(--border)] p-6 text-center">
                <div>
                  <Braces className="mx-auto text-violet-500" />
                  <p className="mt-3 font-semibold">No activity yet</p>
                  <p className="text-muted mt-1 text-sm">
                    Use an AI tool and your history will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Popular AI tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiTools.slice(0, 6).map((tool) => (
            <Link
              to={`/app/${tool.slug}`}
              key={tool.slug}
              className="panel group p-5 transition hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/12 text-violet-500">
                  <tool.icon size={21} />
                </div>
                <div>
                  <h3 className="font-bold group-hover:text-violet-500">{tool.title}</h3>
                  <p className="text-muted mt-1 text-sm">{tool.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
