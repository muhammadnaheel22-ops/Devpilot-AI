import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getAdminOverview } from '../services/adminService';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/dashboard/StatCard';

const demoOverview = {
  generatedAt: new Date().toISOString(),
  metrics: { totalUsers: 4, recentRequests: 18, activeUsers: 3, failedRequests: 1 },
  users: [
    {
      uid: 'demo-admin',
      name: 'DevPilot Admin',
      email: 'demo@devpilot.ai',
      admin: true,
      disabled: false,
      createdAt: new Date().toISOString(),
      lastSignInAt: new Date().toISOString(),
    },
  ],
  requests: [
    {
      id: 'demo-request',
      email: 'demo@devpilot.ai',
      mode: 'generate',
      model: 'openai/gpt-4o-mini',
      status: 'success',
      durationMs: 1280,
      createdAt: new Date().toISOString(),
    },
  ],
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

export default function AdminDashboardPage() {
  const { getToken, user } = useAuth();
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-overview', user?.uid],
    queryFn: async () => {
      if (user?.isDemo) return demoOverview;
      return getAdminOverview(await getToken());
    },
  });

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data?.users || [];
    return (data?.users || []).filter((item) =>
      `${item.name} ${item.email} ${item.uid}`.toLowerCase().includes(needle),
    );
  }, [data?.users, query]);
  const requestBreakdown = useMemo(() => {
    const counts = (data?.requests || []).reduce((result, request) => {
      result[request.mode] = (result[request.mode] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data?.requests]);
  const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#f59e0b', '#ec4899'];

  if (error) {
    return (
      <div className="panel mx-auto max-w-2xl p-8 text-center">
        <AlertTriangle className="mx-auto text-amber-500" size={36} />
        <h1 className="mt-4 text-2xl font-bold">Admin data is unavailable</h1>
        <p className="text-muted mt-2">{error.message}</p>
        <Button className="mt-5" onClick={() => refetch()}>
          <RefreshCw size={17} /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-500">
            <ShieldCheck size={17} /> ADMINISTRATION
          </div>
          <h1 className="mt-2 text-3xl font-bold">Platform overview</h1>
          <p className="text-muted mt-2">
            Monitor users, OpenRouter traffic, failures, and recent platform activity.
          </p>
        </div>
        <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? 'animate-spin' : ''} size={17} /> Refresh
        </Button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Registered users" value={data?.metrics.totalUsers ?? '—'} />
        <StatCard
          icon={Activity}
          label="Recent requests"
          value={data?.metrics.recentRequests ?? '—'}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active users"
          value={data?.metrics.activeUsers ?? '—'}
        />
        <StatCard
          icon={AlertTriangle}
          label="Failed requests"
          value={data?.metrics.failedRequests ?? '—'}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        <section className="panel p-5">
          <h2 className="text-lg font-bold">Requests by tool</h2>
          <p className="text-muted mt-1 text-sm">Last 100 database records</p>
          <div className="mt-4 h-72">
            {requestBreakdown.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={requestBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {requestBreakdown.map((item, index) => (
                      <Cell key={item.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-strong)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-muted">No request data yet.</div>
            )}
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-[var(--border)] p-5">
            <h2 className="text-lg font-bold">Recent AI requests</h2>
            <p className="text-muted mt-1 text-sm">Provider latency and response status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-muted bg-[var(--surface)] text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Tool</th>
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3">Latency</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {(data?.requests || []).slice(0, 10).map((request) => (
                  <tr key={request.id}>
                    <td className="px-5 py-4">
                      <div className="max-w-44 truncate font-medium">{request.email}</div>
                      <div className="text-muted mt-1 text-xs">{formatDate(request.createdAt)}</div>
                    </td>
                    <td className="px-5 py-4 capitalize">{request.mode}</td>
                    <td className="px-5 py-4 font-mono text-xs">{request.model}</td>
                    <td className="px-5 py-4">{request.durationMs} ms</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          request.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel mt-5 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">User directory</h2>
            <p className="text-muted mt-1 text-sm">Firebase Authentication accounts and roles</p>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2">
            <Search className="text-muted" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users"
              className="bg-transparent text-sm outline-none"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-muted bg-[var(--surface)] text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Last sign in</th>
                <th className="px-5 py-3">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredUsers.map((account) => (
                <tr key={account.uid}>
                  <td className="px-5 py-4">
                    <div className="font-medium">{account.name}</div>
                    <div className="text-muted mt-1 text-xs">{account.email}</div>
                  </td>
                  <td className="px-5 py-4">{account.admin ? 'Administrator' : 'User'}</td>
                  <td className="px-5 py-4">{formatDate(account.createdAt)}</td>
                  <td className="px-5 py-4">{formatDate(account.lastSignInAt)}</td>
                  <td className="px-5 py-4">{account.disabled ? 'Disabled' : 'Active'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {isLoading && <p className="text-muted mt-4 text-sm">Loading administrator data…</p>}
      <p className="text-muted mt-4 text-xs">Updated {formatDate(data?.generatedAt)}</p>
    </div>
  );
}
