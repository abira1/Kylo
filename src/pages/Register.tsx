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
  });
  
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
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
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

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-navy-950">
      <div className="w-full max-w-2xl mx-auto flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
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

              <div>
                <label className="label-text">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    required
                    className="input-field pl-12"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3 sm:py-4 mt-6 sm:mt-8 text-base sm:text-lg">
                Continue to Packages <ArrowRight size={20} />
              </button>

              <p className="mt-6 sm:mt-8 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
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
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  Choose your package
                </h1>
                <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
                  Select the plan that best fits your needs.
                </p>
              </div>

              <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-10">
                {PACKAGES.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPackage(p.id)}
                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all relative ${
                      selectedPackage === p.id
                        ? 'border-emerald-500 dark:border-cyan-500 bg-mint-50/50 dark:bg-cyan-900/10 shadow-md'
                        : 'border-gray-100 dark:border-navy-700 hover:border-emerald-300 dark:hover:border-cyan-700 bg-gray-50/50 dark:bg-navy-900/50'
                    }`}>
                    {p.id === 'professional' && (
                      <div className="absolute -top-3 right-6 bg-emerald-500 dark:bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Popular
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-xl dark:text-white">{p.name}</div>
                        <p className="text-base text-gray-600 dark:text-gray-400 mb-4 font-medium">
                          {p.description}
                        </p>
                      </div>
                      <div className="font-extrabold text-2xl dark:text-white text-right">
                        ${p.price}
                        <span className="text-base font-medium text-gray-500">/mo</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {p.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                          <CheckCircle2 size={16} className="text-emerald-500 dark:text-cyan-400 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 sm:gap-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary w-1/3 py-3 sm:py-4 text-base sm:text-lg">
                  Back
                </button>
                <button type="submit" className="btn-primary w-2/3 py-3 sm:py-4 text-base sm:text-lg">
                  Continue to Payment <ArrowRight size={20} />
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
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  Complete Payment
                </h1>
                <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
                  Enter your payment details to activate {pkg?.name} plan
                </p>
              </div>

              {/* Order Summary */}
              <div className="mb-8 p-6 bg-gray-50 dark:bg-navy-900/50 rounded-2xl border border-gray-100 dark:border-navy-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{pkg?.name} Plan</span>
                  <span className="text-gray-900 dark:text-white font-bold">${pkg?.price}.00</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Billed monthly
                </div>
                <div className="border-t border-gray-200 dark:border-navy-700 pt-4 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-cyan-400">${pkg?.price}.00</span>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4 sm:space-y-5">
                <CreditCardForm
                  showSubmit={false}
                  maskMiddle
                  defaultHolder={formData.fullName.toUpperCase()}
                  onChange={handleCardChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Use 4242 4242 4242 4242 for testing
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !cardValid}
                className="btn-primary w-full py-3 sm:py-4 mt-8 text-base sm:text-lg disabled:opacity-50">
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Complete Registration & Activate Account <ArrowRight size={20} />
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