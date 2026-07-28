export function Button({ variant = 'primary', className = '', ...props }) {
  const variants = { primary: 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20 hover:-translate-y-0.5', secondary: 'border border-[var(--border)] bg-[var(--surface)] hover:bg-violet-500/10', ghost: 'hover:bg-violet-500/10', danger: 'bg-red-600 text-white hover:bg-red-700' };
  return <button className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}/>;
}
