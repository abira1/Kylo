import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  ArrowRight,
  Mail,
  Lock,
  User,
  Building,
  CheckCircle2,
  CreditCard,
  Loader,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { registerUser } from '../firebase/auth';
import { processPayment, PACKAGES, Package } from '../services/paymentService';
import { CreditCardForm, type CardState, type CardValidity } from '../components/ui/credit-card-form';

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [selectedPackage, setSelectedPackage] = useState('professional');
  
  // Payment form data
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardName: '',
  });
  const [cardValid, setCardValid] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCardChange = (state: CardState, validity: CardValidity) => {
    setPaymentData({
      cardNumber: state.number,
      expiryDate: state.month && state.year ? `${state.month}/${state.year.slice(-2)}` : '',
      cvc: state.cvv,
      cardName: state.holder,
    });
    setCardValid(validity.allValid);
    setError('');
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.company || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (passwordStrength < 3) {
      setError('Please choose a stronger password (mix upper, lower, number, symbol)');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setStep(2);
  };

  const handlePackageSelect = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate payment data
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvc) {
        throw new Error('Please fill in all payment details');
      }

      // Register user
      const user = await registerUser(
        formData.email,
        formData.password,
        formData.fullName
      );

      // Process payment
      const payment = await processPayment(
        formData.email,
        selectedPackage,
        user.uid,
        formData.fullName
      );

      // Show success and redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const pkg: Package | undefined = PACKAGES.find((p) => p.id === selectedPackage);

  // Password strength checks
  const pw = formData.password;
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const passwordStrength = Object.values(checks).filter(Boolean).length;
  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][passwordStrength];
  const strengthColor = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981'][passwordStrength];
  const passwordsMatch = formData.confirmPassword.length > 0 && pw === formData.confirmPassword;

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-navy-950">
      <div className="w-full max-w-3xl mx-auto flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 transition-all">
        <Link
          to="/"
          className="flex items-center justify-center gap-3 mb-6 sm:mb-10">
          <img
            src="https://i.postimg.cc/FzSqZJPg/97724688056.png"
            alt="KYLO-AI"
            className="h-7 sm:h-8 w-auto dark:hidden"
          />
          <img
            src="https://i.postimg.cc/gjRDJSW5/high-level-description-a-dark-mode-wordm-As-Wztl-DXWm-G91n-AY-i-MLQ-b-Wl27DVTe6f8Pxy6g-Wv-Lw.png"
            alt="KYLO-AI"
            className="h-7 sm:h-8 w-auto hidden dark:block"
          />
        </Link>

        <div className="bento-card p-5 sm:p-8 md:p-12">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-7 sm:mb-10">
            {[
              { num: 1, label: 'Account' },
              { num: 2, label: 'Package' },
              { num: 3, label: 'Payment' },
            ].map((s, idx) => (
              <div key={s.num}>
                <div
                  className={`flex items-center ${
                    step >= s.num ? 'text-emerald-600 dark:text-cyan-400' : 'text-gray-400'
                  }`}>
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base rounded-full flex items-center justify-center border-2 font-bold ${
                      step >= s.num
                        ? 'border-emerald-500 dark:border-cyan-400 bg-mint-100 dark:bg-cyan-900/30'
                        : 'border-gray-200 dark:border-navy-700'
                    }`}>
                    {s.num}
                  </div>
                  <span className="ml-2 sm:ml-3 text-sm sm:text-base font-bold">{s.label}</span>
                </div>
                {idx < 2 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-3 sm:mx-4 ${
                      step > s.num
                        ? 'bg-emerald-500 dark:bg-cyan-400'
                        : 'bg-gray-200 dark:bg-navy-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleNext}
              className="space-y-4 sm:space-y-6">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  Create your account
                </h1>
                <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
                  Start your AI chatbot journey today.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="label-text">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="input-field pl-12"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-text">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="input-field pl-12"
                      placeholder="Acme Inc"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label-text">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                    required
                    className="input-field pl-12"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="label-text">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      required
                      className="input-field pl-12 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label-text">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      required
                      className="input-field pl-12 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {formData.confirmPassword.length > 0 && (
                    <p className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {passwordsMatch ? <Check size={13} /> : <X size={13} />}
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>

              {formData.password.length > 0 && (
                <div className="-mt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Password strength</span>
                    <span className="text-xs font-bold" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(passwordStrength / 5) * 100}%`, backgroundColor: strengthColor }} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 mt-2.5">
                    {[
                      { ok: checks.length, label: '8+ characters' },
                      { ok: checks.upper, label: 'Uppercase' },
                      { ok: checks.lower, label: 'Lowercase' },
                      { ok: checks.number, label: 'Number' },
                      { ok: checks.symbol, label: 'Symbol' },
                    ].map((c) => (
                      <span key={c.label} className={`text-[11px] font-medium flex items-center gap-1 ${c.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                        {c.ok ? <Check size={12} /> : <X size={12} />}{c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3 sm:py-4 mt-6 sm:mt-8 text-base sm:text-lg">
                Continue to Packages <ArrowRight size={20} />
              </button>

              <p className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <ShieldCheck size={14} className="text-emerald-500 dark:text-cyan-400" />
                Your data is encrypted and securely stored.
              </p>

              <p className="mt-4 sm:mt-5 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-emerald-600 dark:text-cyan-400 hover:underline">
                  Sign in
                </Link>
              </p>
            </motion.form>
          )}

          {/* Step 2: Package Selection */}
          {step === 2 && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handlePackageSelect}>
              <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                  Choose your package
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Select the plan that best fits your needs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
                {PACKAGES.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPackage(p.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col ${
                      selectedPackage === p.id
                        ? 'border-emerald-500 dark:border-cyan-500 bg-mint-50/50 dark:bg-cyan-900/10 shadow-md'
                        : 'border-gray-100 dark:border-navy-700 hover:border-emerald-300 dark:hover:border-cyan-700 bg-gray-50/50 dark:bg-navy-900/50'
                    }`}>
                    {p.id === 'professional' && (
                      <div className="absolute -top-2.5 right-4 bg-emerald-500 dark:bg-cyan-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                        Popular
                      </div>
                    )}
                    <div className="font-bold text-base dark:text-white">{p.name}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2 line-clamp-2 min-h-[2rem]">
                      {p.description}
                    </p>
                    <div className="font-extrabold text-2xl dark:text-white mb-3">
                      ${p.price}
                      <span className="text-sm font-medium text-gray-500">/mo</span>
                    </div>
                    <div className="space-y-1.5">
                      {p.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                          <CheckCircle2 size={14} className="text-emerald-500 dark:text-cyan-400 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary w-1/3 py-3 text-sm sm:text-base">
                  Back
                </button>
                <button type="submit" className="btn-primary w-2/3 py-3 text-sm sm:text-base">
                  Continue to Payment <ArrowRight size={18} />
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handlePayment}>
              <div className="text-center mb-5 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                  Complete Payment
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                  Activate your {pkg?.name} plan
                </p>
              </div>

              <div className="space-y-5">
                {/* Order Summary */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-mint-50 to-white dark:from-navy-900/60 dark:to-navy-900/30 rounded-2xl border border-gray-100 dark:border-navy-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-base text-gray-900 dark:text-white">{pkg?.name} Plan</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Billed monthly · cancel anytime</div>
                    </div>
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-cyan-400">${pkg?.price}.00</span>
                  </div>
                </div>

                {/* Payment Form */}
                <CreditCardForm
                  showSubmit={false}
                  maskMiddle
                  defaultHolder={formData.fullName.toUpperCase()}
                  onChange={handleCardChange}
                />
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Lock size={13} /> 256-bit SSL encrypted · test with 4242 4242 4242 4242
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !cardValid}
                className="btn-primary w-full py-3 sm:py-4 mt-6 text-base sm:text-lg disabled:opacity-50">
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Pay ${pkg?.price}.00 & Activate Account <ArrowRight size={20} />
                  </>
                )}
              </button>

              <div className="flex gap-3 sm:gap-5 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="btn-secondary w-full py-3 sm:py-4 text-base sm:text-lg disabled:opacity-50">
                  Back
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}