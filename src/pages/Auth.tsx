// src/pages/Auth.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // start with loading to check token
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Auto-login check on mount — validate token before redirecting
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // Validate token by calling a protected endpoint
      axios
        .get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          navigate('/home');
        })
        .catch(() => {
          // Token is invalid or expired — clear it
          localStorage.removeItem('token');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false); // no token → show login form
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Client-side validation
    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Full name is required');
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login' 
        ? { email, password }
        : { name, email, password };

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

      toast.success(mode === 'login' ? 'Logged in successfully!' : 'Account created! Welcome!', {
        duration: 3000,
      });

      // Save token and trigger WebSocket connection
      localStorage.setItem('token', response.data.token);
      window.dispatchEvent(new Event('auth-change'));
      navigate('/home');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'An error occurred. Please try again.';

      toast.error(errorMsg, { duration: 5000 });
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // // Show loading spinner while checking token
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-red-200 flex items-center justify-center">
  //       <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-red-200 flex items-center justify-center px-4 sm:px-6 lg:px-8 font-poppins">
      <div className="w-full max-w-md bg-sidebar rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-6 pb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            {mode === 'login'
              ? 'Access your workspace'
              : 'Join your team in seconds'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center gap-6 pb-6 text-sm">
          <button
            onClick={() => setMode('login')}
            className={`pb-1 font-medium cursor-pointer transition-colors ${
              mode === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`pb-1 font-medium cursor-pointer transition-colors ${
              mode === 'signup'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-5 space-y-5 bg-sidebar">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {mode === 'login' && (
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLoading
              ? mode === 'login' ? 'Signing in...' : 'Creating account...'
              : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;