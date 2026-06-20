import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/ui/hero-section';
import { Pricing } from '../components/ui/pricing';
import { ShapeBackground } from '../components/ui/shape-landing-hero';
import { ShineBorder } from '../components/ui/shine-border';
import { Navbar } from '../components/ui/navbar';
import {
  HowItWorks,
  WhyChooseUs,
  Demo,
  Contact,
  Testimonials,
  FAQ } from
'../components/ui/landing-sections';
const PRICING_PLANS = [
{
  name: 'Starter',
  price: 'AED 999',
  period: 'month',
  tag: 'Perfect for solo consultants',
  features: [
  '1 AI agent deployment',
  'Up to 500 conversations per month',
  'Full client dashboard',
  'Lead inbox and conversation history',
  'WhatsApp integration',
  'Stripe payment links',
  'Passport OCR document collection',
  'Email support'],

  description: '',
  buttonText: 'Get Started',
  href: '/register',
  isPopular: false
},
{
  name: 'Pro',
  price: 'AED 1,999',
  period: 'month',
  tag: 'For growing agencies',
  features: [
  'Everything in Starter',
  'Up to 2,000 conversations per month',
  'Custom agent name, logo, and brand color',
  'Post-purchase AI onboarding agent',
  'Q&A training panel — add unlimited entries',
  'Advanced analytics and heatmaps',
  'Priority support with dedicated onboarding call',
  'Arabic + English language support'],

  description: '',
  buttonText: 'Start Pro Plan',
  href: '/register',
  isPopular: true
},
{
  name: 'Enterprise',
  price: 'Custom',
  period: '',
  tag: 'For established agencies and teams',
  features: [
  'Everything in Pro',
  'Unlimited conversations',
  'Multiple agent deployments',
  'Custom domain per deployment',
  'CRM integration (HubSpot, Zoho)',
  'Dedicated account manager',
  'SLA-backed uptime guarantee',
  'API access for custom integrations'],

  description: '',
  buttonText: 'Contact Us',
  href: '#contact',
  isPopular: false
}];

import {
  Bot,
  Moon,
  Sun,
  ArrowRight,
  MessageSquare,
  Zap,
  BarChart3,
  Globe,
  Shield,
  BrainCircuit,
  UserPlus,
  ScanLine,
  CreditCard,
  Rocket } from
'lucide-react';
export function Landing() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-navy-950 transition-colors duration-300 relative">
      <ShapeBackground />

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Metrics Band */}
      <section className="border-y border-gray-100/50 dark:border-navy-800/50 bg-white/80 dark:bg-navy-900/50 backdrop-blur-sm py-8 sm:py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          {[
          {
            label: 'Active Bots',
            value: '10,000+'
          },
          {
            label: 'Conversations',
            value: '50M+'
          },
          {
            label: 'Leads Captured',
            value: '2.5M+'
          },
          {
            label: 'Uptime',
            value: '99.99%'
          }].
          map((metric, i) =>
          <div key={i}>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                {metric.value}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {metric.label}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Bento Grid */}
      <section
        id="features"
        className="py-10 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        
        <div className="text-center mb-8 sm:mb-16 max-w-3xl mx-auto">
          <p className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-cyan-400 mb-2 sm:mb-3">
            WHAT KYLO DOES
          </p>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Everything Your Sales Team Does. Automated.
          </h2>
          <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
            One intelligent platform that handles your entire sales and
            onboarding process — from the first question to the signed license.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          <ShineBorder className="col-span-2 md:col-span-2">
            <div className="bento-card p-4 sm:p-6 bg-gradient-to-br from-mint-50 to-white dark:from-navy-800 dark:to-navy-900 h-full">
              <BrainCircuit className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-500 dark:text-cyan-400 mb-3 sm:mb-6" />
              <h3 className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                Sells While You Sleep
              </h3>
              <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-2 sm:mb-5 max-w-lg leading-relaxed">
                KYLO answers every Free Zone and Mainland license question
                instantly, handles objections intelligently, and guides every
                visitor toward a buying decision — day and night, with zero
                human involvement.
              </p>
            </div>
          </ShineBorder>

          <ShineBorder className="col-span-1">
            <div className="bento-card p-3 sm:p-6 h-full flex flex-col">
              <MessageSquare className="w-7 h-7 sm:w-12 sm:h-12 text-turquoise-500 dark:text-turquoise-400 mb-3 sm:mb-6" />
              <h3 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                Meet Customers Where They Are
              </h3>
              <p className="text-[11px] sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mt-auto">
                Your KYLO agent runs on your website and your WhatsApp Business
                number simultaneously. Same intelligence, same knowledge base.
              </p>
            </div>
          </ShineBorder>

          <ShineBorder className="col-span-1">
            <div className="bento-card p-3 sm:p-6 h-full flex flex-col">
              <UserPlus className="w-7 h-7 sm:w-12 sm:h-12 text-cyan-500 dark:text-cyan-400 mb-3 sm:mb-6" />
              <h3 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                Never Miss a Lead Again
              </h3>
              <p className="text-[11px] sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mt-auto">
                At exactly the right moment in every conversation, KYLO asks for
                the customer's name and number. Every lead is stored instantly.
              </p>
            </div>
          </ShineBorder>

          <ShineBorder className="col-span-1">
            <div className="bento-card p-3 sm:p-6 h-full flex flex-col">
              <ScanLine className="w-7 h-7 sm:w-12 sm:h-12 text-emerald-500 dark:text-emerald-400 mb-3 sm:mb-6" />
              <h3 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                Collect Documents
              </h3>
              <p className="text-[11px] sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mt-auto">
                Customers upload their passport directly in the chat. KYLO reads
                it instantly using AI vision and extracts all personal data.
              </p>
            </div>
          </ShineBorder>

          <ShineBorder className="col-span-1">
            <div className="bento-card p-3 sm:p-6 h-full flex flex-col">
              <CreditCard className="w-7 h-7 sm:w-12 sm:h-12 text-turquoise-500 dark:text-turquoise-400 mb-3 sm:mb-6" />
              <h3 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                Get Paid Inside Chat
              </h3>
              <p className="text-[11px] sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mt-auto">
                When a customer is ready to buy, KYLO sends a secure Stripe
                payment link directly inside the conversation.
              </p>
            </div>
          </ShineBorder>

          <ShineBorder className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="bento-card p-4 sm:p-6 bg-gradient-to-br from-aqua-50 to-white dark:from-navy-800 dark:to-navy-900 h-full">
              <Rocket className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-500 dark:text-emerald-400 mb-3 sm:mb-6" />
              <h3 className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                Onboarding Starts Automatically
              </h3>
              <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-2 sm:mb-5 max-w-lg leading-relaxed">
                The moment a payment is confirmed, a second AI agent activates
                and guides the customer through the next steps — document
                collection, license application requirements, and timelines.
              </p>
            </div>
          </ShineBorder>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Pricing */}
      <section id="pricing" className="py-10 sm:py-24 relative z-10">
        <Pricing plans={PRICING_PLANS} />
      </section>

      {/* Demo */}
      <Demo />

      {/* Contact */}
      <Contact />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <FAQ />

      {/* Footer */}
      <footer className="border-t border-gray-100/50 dark:border-navy-800/50 bg-white/80 dark:bg-navy-900/50 backdrop-blur-sm py-12 sm:py-16 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          <div className="md:col-span-1">
            <img
              src="https://i.postimg.cc/FzSqZJPg/97724688056.png"
              alt="KYLO"
              className="h-8 w-auto mb-4 dark:hidden" />
            
            <img
              src="https://i.postimg.cc/gjRDJSW5/high-level-description-a-dark-mode-wordm-As-Wztl-DXWm-G91n-AY-i-MLQ-b-Wl27DVTe6f8Pxy6g-Wv-Lw.png"
              alt="KYLO"
              className="h-8 w-auto mb-4 hidden dark:block" />
            
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Intelligent Conversations.
              <br />
              Effortless Growth.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="#features"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  Pricing
                </a>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="mailto:hello@kylo.ae"
                  className="hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
                  
                  hello@kylo.ae
                </a>
              </li>
              <li>+971 XX XXX XXXX</li>
              <li>Dubai, United Arab Emirates</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-100 dark:border-navy-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            © 2026 KYLO. All rights reserved.
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
            Built for UAE business license agencies.
          </div>
        </div>
      </footer>
    </div>);

}