import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getUserActivity, getUserSnippets } from '../services/userDataService';

const weekly = [
  { name: 'Mon', value: 5 },
  { name: 'Tue', value: 8 },
  { name: 'Wed', value: 12 },
  { name: 'Thu', value: 7 },
  { name: 'Fri', value: 16 },
  { name: 'Sat', value: 10 },
  { name: 'Sun', value: 14 },
];
const language = [
  { name: 'JavaScript', value: 34 },
  { name: 'Python', value: 26 },
  { name: 'SQL', value: 22 },
  { name: 'Other', value: 18 },
];
const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#64748b'];

export default function AnalyticsPage() {
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
      <h1 className="text-3xl font-bold">Usage Analytics</h1>
      <p className="text-muted mt-2">
        Cloud-synced request and snippet totals with dashboard-ready visualization components.
      </p>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-bold">Weekly AI requests</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-strong)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-bold">Language distribution</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={language}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={115}
                  paddingAngle={3}
                >
                  {language.map((_, index) => (
                    <Cell key={colors[index]} fill={colors[index]} />
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
          </div>
        </section>
      </div>
      <div className="panel mt-5 p-5">
        <h2 className="font-bold">Current metrics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-violet-500/10 p-4">
            <div className="text-muted text-sm">Requests recorded</div>
            <div className="mt-2 text-3xl font-bold">{activity.length}</div>
          </div>
          <div className="rounded-xl bg-blue-500/10 p-4">
            <div className="text-muted text-sm">Saved snippets</div>
            <div className="mt-2 text-3xl font-bold">{snippets.length}</div>
          </div>
          <div className="rounded-xl bg-cyan-500/10 p-4">
            <div className="text-muted text-sm">Supported languages</div>
            <div className="mt-2 text-3xl font-bold">30+</div>
          </div>
        </div>
      </div>
    </div>
  );
}
