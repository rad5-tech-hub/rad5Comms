// src/pages/ForgotPassword.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
// import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ForgotPassword = () => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
        toast.success('Reset code sent to your email!', {
          duration: 4000,
        });
      setSuccess('Reset code sent to your email');
      setStep('reset');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to send reset code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!resetCode.trim()) {
      setError('Reset code is required');
      setIsLoading(false);
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email,
        code: resetCode,
        newPassword,
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      toast.success('Password reset successfully!', {
        duration: 4000,
      });
      // Redirect to login after short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to reset password. Please check the code and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-200 flex items-center justify-center px-4 sm:px-6 lg:px-8 font-poppins">
      <div className="w-full max-w-md bg-sidebar rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-6 pb-6 text-center relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-6 top-6 p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {step === 'request' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            {step === 'request'
              ? 'Enter your email to receive a reset code'
              : 'Enter the code sent to your email and choose a new password'}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={step === 'request' ? handleRequestReset : handleResetPassword}
          className="px-8 pb-8 space-y-5 bg-sidebar"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Email (always shown) */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              disabled={step === 'reset'} // disable after sending code
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-60"
              required
            />
          </div>

          {/* Reset code & new password (only in reset step) */}
          {step === 'reset' && (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Reset code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.trim())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLoading
              ? step === 'request'
                ? 'Sending reset code...'
                : 'Resetting password...'
              : step === 'request'
              ? 'Send Reset Code'
              : 'Reset Password'}
          </button>

          <p className="text-center text-sm text-gray-300 mt-4">
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-blue-400 font-medium hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;