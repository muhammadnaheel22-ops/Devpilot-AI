import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { BarChart3, BookOpen, CodeXml, LayoutDashboard, Settings, TestTube2, Wrench, X } from 'lucide-react';
import { Logo } from './Logo';
import { aiTools } from '../../constants/tools';
import { setSidebarOpen } from '../../store/uiSlice';
const base = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition';
export function Sidebar() {
  const open = useSelector((s) => s.ui.sidebarOpen); const dispatch = useDispatch();
  const nav = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ...aiTools.slice(0, 7).map((tool) => ({ to: `/app/${tool.slug}`, label: tool.title, icon: tool.icon })),
    { to: '/app/utilities', label: 'Developer Utilities', icon: Wrench },
    { to: '/app/api-tester', label: 'REST API Tester', icon: TestTube2 },
    { to: '/app/prompts', label: 'Prompt Library', icon: BookOpen },
    { to: '/app/snippets', label: 'Saved Snippets', icon: CodeXml },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  ];
  return <><button aria-label="Close navigation" className={`fixed inset-0 z-40 bg-black/55 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={() => dispatch(setSidebarOpen(false))}/><aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--surface-strong)] transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex items-center justify-between border-b border-[var(--border)] p-4"><Logo/><button className="rounded-lg p-2 lg:hidden" onClick={() => dispatch(setSidebarOpen(false))}><X size={20}/></button></div><div className="scrollbar-thin flex-1 overflow-y-auto p-3"><div className="space-y-1">{nav.map(({ to, label, icon: Icon, end }) => <NavLink end={end} key={to} to={to} onClick={() => dispatch(setSidebarOpen(false))} className={({ isActive }) => `${base} ${isActive ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-muted hover:bg-violet-500/10 hover:text-[var(--foreground)]'}`}><Icon size={18}/>{label}</NavLink>)}</div></div><div className="border-t border-[var(--border)] p-3"><NavLink to="/app/settings" className={({ isActive }) => `${base} ${isActive ? 'bg-violet-500/15 text-violet-500' : 'text-muted hover:bg-violet-500/10'}`}><Settings size={18}/>Settings</NavLink></div></aside></>;
}
