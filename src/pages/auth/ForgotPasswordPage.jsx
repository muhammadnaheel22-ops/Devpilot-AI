import { Link } from 'react-router-dom';
import { AuthShell } from './AuthShell';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Password help"
      subtitle="Self-service email reset is not enabled yet. Contact the application administrator to reset your account password."
      footer={
        <Link className="font-semibold text-violet-500" to="/login">
          Back to sign in
        </Link>
      }
    >
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-muted">
        Your password is stored only as a secure hash in Neon. It cannot be viewed or recovered.
      </div>
    </AuthShell>
  );
}
