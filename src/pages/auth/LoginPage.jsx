import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthShell } from './AuthShell';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } });
  const go = () => navigate(location.state?.from || '/app', { replace: true });
  const submit = async (data) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back');
      go();
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue building with DevPilot AI."
      footer={
        <>
          New to DevPilot?{' '}
          <Link className="font-semibold text-violet-500" to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-violet-500">
            Forgot password?
          </Link>
        </div>
        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="text-muted mt-5 text-center text-xs">
        Your account is protected by a secure server session stored in Neon.
      </p>
    </AuthShell>
  );
}
