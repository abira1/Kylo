import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Mail, Lock, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { loginUser } from '../firebase/auth';

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      await loginUser(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-navy-950">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          className="max-w-md w-full mx-auto">
          
          <Link to="/" className="flex items-center gap-3 mb-16">
            <img
              src="https://i.postimg.cc/FzSqZJPg/97724688056.png"
              alt="KYLO-AI"
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="https://i.postimg.cc/gjRDJSW5/high-level-description-a-dark-mode-wordm-As-Wztl-DXWm-G91n-AY-i-MLQ-b-Wl27DVTe6f8Pxy6g-Wv-Lw.png"
              alt="KYLO-AI"
              className="h-8 w-auto hidden dark:block"
            />
          </Link>

          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Welcome back
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 font-medium">
            Enter your details to access your dashboard.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label-text">Email address</label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-3.5 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="input-field pl-12 disabled:opacity-50"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label-text !mb-0">Password</label>
                <a
                  href="#"
                  className="text-sm font-bold text-emerald-600 dark:text-cyan-400 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-3.5 text-gray-400"
                  size={20}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="input-field pl-12 disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 mt-6 text-lg disabled:opacity-50">
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-gray-600 dark:text-gray-400 font-medium">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-emerald-600 dark:text-cyan-400 hover:underline">
              Sign up
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-navy-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Admin?{' '}
              <Link
                to="/admin/login"
                className="font-bold text-emerald-600 dark:text-cyan-400 hover:underline">
                Access admin portal
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex w-1/2 bg-mint-50 dark:bg-navy-900 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-cyan-500/10" />
        <div className="relative z-10 max-w-lg text-center">
          <div className="bento-card bg-white/80 dark:bg-navy-950/80 backdrop-blur-xl mb-10 p-10 border-none shadow-soft-dark">
            <BarChartMockup />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Manage your AI fleet
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Monitor conversations, track leads, and optimize your AI assistants
            from a single, powerful dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

function BarChartMockup() {
  return (
    <div className="flex items-end justify-center gap-4 h-56">
      {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
        <motion.div
          key={i}
          initial={{
            height: 0
          }}
          animate={{
            height: `${height}%`
          }}
          transition={{
            duration: 1,
            delay: i * 0.1
          }}
          className="w-10 bg-emerald-500 dark:bg-cyan-500 rounded-t-xl opacity-90"
        />
      ))}
    </div>
  );
}