import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  Activity,
  Server,
  Users,
  Loader,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loginWithGoogle, loginUser } from '../firebase/auth';

export function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      if (user.isAdmin) {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      const user = await loginUser(email, password);

      if (!user.isAdmin || user.email !== 'abirsabirhossain@gmail.com') {
        throw new Error('Only administrators can access this portal');
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-cyan-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck size={24} />
            </div>
            <span className="font-bold text-2xl dark:text-white">
              KYLO Admin
            </span>
          </Link>

          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Admin Portal
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 font-medium">
            Secure access for administrators and system operators.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl border-2 border-gray-200 dark:border-navy-700 hover:border-emerald-300 dark:hover:border-cyan-600 bg-white dark:bg-navy-900/50 font-bold text-gray-900 dark:text-white transition-all disabled:opacity-50 mb-6 flex items-center justify-center gap-3">
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 10.7v3.4h5.1c-.2 1.1-1.3 3.2-5.1 3.2-3.1 0-5.6-2.5-5.6-5.6S8.9 5.5 12 5.5c1.8 0 2.9.7 3.6 1.3l2.7-2.6C15.9 2.4 14.2 1 12 1 6.5 1 2 5.5 2 11s4.5 10 10 10c5.8 0 9.7-4.1 9.7-9.8 0-.7 0-1.2-.1-1.7H12z" fill="currentColor" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-navy-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#f8fafc] dark:bg-navy-950 text-gray-500 dark:text-gray-400 font-medium">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Login */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label-text">Admin Email</label>
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
                  placeholder="abirsabirhossain@gmail.com"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Use abirsabirhossain@gmail.com
              </p>
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
                  <Loader size={20} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Authenticate <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-gray-600 dark:text-gray-400 font-medium">
            Not an administrator?{' '}
            <Link
              to="/login"
              className="font-bold text-emerald-600 dark:text-cyan-400 hover:underline">
              Return to client login
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex w-1/2 bg-mint-50 dark:bg-navy-900 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-cyan-500/10" />
        <div className="relative z-10 max-w-lg text-center w-full">
          <div className="bento-card bg-white/80 dark:bg-navy-950/80 backdrop-blur-xl mb-10 p-8 border-none shadow-soft-dark">
            <SystemMonitorMockup />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            System Operations
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Monitor infrastructure, manage user accounts, and configure global
            system settings securely.
          </p>
        </div>
      </div>
    </div>
  );
}
function SystemMonitorMockup() {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{
          opacity: 0,
          y: 10
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          delay: 0.2
        }}
        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-900 rounded-2xl">
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-cyan-900/30 text-emerald-600 dark:text-cyan-400 rounded-lg">
            <Server size={20} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Main Cluster
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              99.99% Uptime
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Online
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.3
          }}
          className="p-4 bg-gray-50 dark:bg-navy-900 rounded-2xl text-left">
          
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Activity size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">
              System Load
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            24%
          </p>
          <div className="w-full bg-gray-200 dark:bg-navy-800 rounded-full h-1.5 mt-2">
            <motion.div
              initial={{
                width: 0
              }}
              animate={{
                width: '24%'
              }}
              transition={{
                duration: 1,
                delay: 0.5
              }}
              className="bg-emerald-500 dark:bg-cyan-500 h-1.5 rounded-full" />
            
          </div>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.4
          }}
          className="p-4 bg-gray-50 dark:bg-navy-900 rounded-2xl text-left">
          
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Users size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Active Users
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            1,284
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span>↑ 12%</span>
          </div>
        </motion.div>
      </div>
    </div>);

}