import { Link } from 'react-router-dom';
import { Logo } from '../../components/layout/Logo';
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted mt-2">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="text-muted mt-6 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
