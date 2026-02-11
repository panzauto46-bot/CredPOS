import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Mail, Lock, Loader2, Zap, Shield, TrendingUp } from 'lucide-react';

// Google Icon Component
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, demoLogin, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsDemoLoading(true);

    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await googleLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Header Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        {/* Logo */}
        <div className="w-20 h-20 bg-gradient-to-br from-[#2C7DF7] to-[#1E5FC7] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
          <Store className="w-10 h-10 text-white" />
        </div>

        {/* Brand */}
        <h1 className="text-3xl font-bold text-white mb-2">CredPOS</h1>
        <p className="text-gray-400 text-center mb-8">Smart POS for SME Business</p>

        {/* Features Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <div className="flex items-center gap-1.5 bg-[#1E293B] px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5 text-[#2C7DF7]" />
            <span className="text-xs text-gray-300">Fast</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#1E293B] px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-xs text-gray-300">Secure</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#1E293B] px-3 py-1.5 rounded-full">
            <TrendingUp className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs text-gray-300">Credit Score Ready</span>
          </div>
        </div>
      </div>

      {/* Login Form Card */}
      <div className="bg-white rounded-t-[32px] px-6 py-8 shadow-xl">
        <h2 className="text-xl font-bold text-[#0F172A] mb-6 text-center">Sign In to Your Account</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@business.com"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C7DF7] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C7DF7] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2C7DF7] text-white font-semibold py-4 rounded-xl hover:bg-[#1E6CE0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 mb-4"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Demo Button */}
        <button
          onClick={handleDemoLogin}
          disabled={isDemoLoading}
          className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
        >
          {isDemoLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Preparing Demo...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Try Free Demo</span>
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Try instantly without registration using sample data
        </p>

        {/* Register Link */}
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#2C7DF7] font-semibold hover:underline">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
};
