import React, { useState, useRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShineBorder } from './shine-border';
import {
  Plug,
  GraduationCap,
  Rocket,
  ShieldCheck,
  Zap,
  Clock,
  HeartHandshake,
  Mail,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  Check,
  X,
  Star,
  ChevronDown } from
'lucide-react';
const fadeUp = {
  hidden: {
    opacity: 0,
    y: 24
  },
  show: {
    opacity: 1,
    y: 0
  }
};
const STEPS = [
{
  icon: Plug,
  title: 'Choose Your Plan',
  desc: 'Pick the KYLO package that fits your agency size. All plans include the full AI agent, lead capture, WhatsApp integration, and your personal client dashboard. You are live within 48 hours of signing up.'
},
{
  icon: GraduationCap,
  title: 'Customize Your Agent',
  desc: "Log into your KYLO dashboard, set your agent's name, upload your logo, and pick your brand color. Paste one line of code on your website. Your fully branded AI agent is live. Your customers never see KYLO — they only see your brand."
},
{
  icon: Rocket,
  title: 'Watch It Work',
  desc: 'Your agent answers questions, captures leads, collects passports, sends payment links, and onboards customers automatically. You log in to your dashboard every morning and see exactly what happened overnight — every conversation, every lead, every payment.'
}];

const REASONS = [
{
  icon: Zap,
  title: 'Lightning fast setup',
  desc: 'From zero to a live, trained assistant in minutes — not weeks.'
},
{
  icon: ShieldCheck,
  title: 'Enterprise security',
  desc: 'SOC2 compliance, encryption at rest, and granular access controls.'
},
{
  icon: Clock,
  title: 'Always on',
  desc: '99.99% uptime so your customers are never left waiting.'
},
{
  icon: HeartHandshake,
  title: 'Human handoff',
  desc: 'Seamlessly escalate to your team when a real touch is needed.'
}];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-10 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
      
      <SectionHeading
        eyebrow="THE PROCESS"
        title="Up and Running in Three Steps"
        subtitle="No developers, no technical setup, no long implementation projects. KYLO is built for business owners, not engineers." />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 relative">
        {STEPS.map((step, i) =>
        <motion.div
          key={step.title}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{
            once: true,
            amount: 0.4
          }}
          transition={{
            duration: 0.5,
            delay: i * 0.12
          }}
          className="bento-card p-4 sm:p-6 relative flex flex-col">
          
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-mint-100 dark:bg-navy-700 text-emerald-600 dark:text-cyan-400 flex items-center justify-center shadow-sm">
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-2xl sm:text-4xl font-extrabold text-gray-200 dark:text-navy-700 leading-none">
                0{i + 1}
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
              {step.title}
            </h3>
            <p className="text-[13px] sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {step.desc}
            </p>
          </motion.div>
        )}
      </div>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{
          once: true
        }}
        className="mt-12 text-center">
        
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-navy-800 text-sm font-medium text-emerald-700 dark:text-cyan-400 border border-emerald-100 dark:border-navy-700 shadow-sm">
          <Zap size={16} className="text-amber-500" />
          Most KYLO clients see their first AI-captured lead within 24 hours of
          going live.
        </span>
      </motion.div>
    </section>);

}
const COMPARISON_FEATURES = [
{
  name: 'UAE Free Zone & Mainland Knowledge',
  kylo: true,
  generic: false
},
{
  name: 'Arabic + English conversations',
  kylo: true,
  generic: false
},
{
  name: 'Passport OCR document collection',
  kylo: true,
  generic: false
},
{
  name: 'WhatsApp Business integration',
  kylo: true,
  generic: 'Limited'
},
{
  name: 'Stripe payment links inside chat',
  kylo: true,
  generic: false
},
{
  name: 'Post-purchase onboarding agent',
  kylo: true,
  generic: false
},
{
  name: 'White-label — your brand, not ours',
  kylo: true,
  generic: false
},
{
  name: 'Live in 48 hours',
  kylo: true,
  generic: 'Weeks'
}];

export function WhyChooseUs() {
  return (
    <section
      id="why-us"
      className="py-10 sm:py-24 px-4 sm:px-6 bg-white/80 dark:bg-navy-900/50 backdrop-blur-sm relative z-10">
      
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          eyebrow="WHY KYLO"
          title="Built Specifically for UAE Business License Agencies"
          subtitle="Other chatbots are generic. KYLO is trained on the UAE business formation market — Free Zone structures, Mainland requirements, visa rules, banking guidance, and more." />
        

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{
            once: true,
            amount: 0.2
          }}
          className="relative">
          
          <ShineBorder className="w-full">
            <div className="bento-card w-full overflow-hidden p-0 sm:p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2.5 sm:p-6 text-[11px] sm:text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-navy-700 w-1/2">
                        Feature
                      </th>
                      <th className="p-2.5 sm:p-6 text-[11px] sm:text-base font-extrabold text-emerald-600 dark:text-cyan-400 border-b border-gray-100 dark:border-navy-700 bg-mint-50/50 dark:bg-navy-800/50 text-center w-1/4">
                        KYLO
                      </th>
                      <th className="p-2.5 sm:p-6 text-[11px] sm:text-base font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-navy-700 text-center w-1/4">
                        Generic Chatbot
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FEATURES.map((feat, i) =>
                    <tr
                      key={i}
                      className="group hover:bg-gray-50 dark:hover:bg-navy-800/30 transition-colors">
                      
                        <td className="p-2.5 sm:p-6 text-[11px] sm:text-base font-medium text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-navy-800/50">
                          {feat.name}
                        </td>
                        <td className="p-2.5 sm:p-6 border-b border-gray-50 dark:border-navy-800/50 bg-mint-50/30 dark:bg-navy-800/30 text-center">
                          {feat.kylo === true ?
                        <Check className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-500 dark:text-cyan-400 mx-auto" /> :

                        <span className="text-[10px] sm:text-sm font-medium text-gray-500">
                              {feat.kylo}
                            </span>
                        }
                        </td>
                        <td className="p-2.5 sm:p-6 border-b border-gray-50 dark:border-navy-800/50 text-center">
                          {feat.generic === false ?
                        <X className="w-4 h-4 sm:w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" /> :

                        <span className="text-[10px] sm:text-sm font-medium text-gray-400 dark:text-gray-500">
                              {feat.generic}
                            </span>
                        }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ShineBorder>
        </motion.div>
      </div>
    </section>);

}
export function Demo() {
  return (
    <section
      id="demo"
      className="py-10 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
      
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{
          once: true,
          amount: 0.3
        }}
        transition={{
          duration: 0.5
        }}
        className="bento-card overflow-hidden relative bg-gradient-to-br from-emerald-500 to-turquoise-500 dark:from-navy-800 dark:to-navy-900 text-white border-none shadow-soft-dark">
        
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center p-2 sm:p-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold mb-4">
              <PlayCircle size={14} /> Live demo
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
              See KYLO-AI in action
            </h2>
            <p className="text-sm sm:text-base text-white/85 mb-6 max-w-md leading-relaxed">
              Watch a 3-minute walkthrough of how a trained assistant captures a
              lead from first message to qualified handoff.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="bg-white text-emerald-700 dark:text-navy-900 px-6 py-2.5 rounded-2xl font-bold text-sm hover:opacity-90 transition active:scale-95 flex items-center justify-center gap-2">
                <PlayCircle size={18} /> Watch demo
              </button>
              <Link
                to="/register"
                className="bg-white/15 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-white/25 transition active:scale-95 flex items-center justify-center gap-2">
                
                Try it free <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95
            }}
            whileInView={{
              opacity: 1,
              scale: 1
            }}
            viewport={{
              once: true
            }}
            transition={{
              duration: 0.6,
              delay: 0.2
            }}
            className="relative rounded-2xl overflow-hidden aspect-video bg-black/20 group cursor-pointer">
            
            <img
              src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80"
              alt="Product demo preview"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <PlayCircle className="text-emerald-600" size={36} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>);

}
const TESTIMONIALS = [
{
  quote:
  'We deployed KYLO and saw qualified leads coming in overnight. Our agent answered questions better than our junior sales staff. The ROI was obvious within the first two weeks.',
  name: 'Khalid Al Mansoori',
  role: 'CEO',
  company: 'Emirates Biz Hub',
  location: 'Dubai',
  initials: 'KA'
},
{
  quote:
  'The passport collection feature alone saved us hours every week. Customers send their documents in the chat and everything appears in our dashboard instantly. It is a completely different experience.',
  name: 'Sarah Mitchell',
  role: 'Founder',
  company: 'ZoneSetup Pro',
  location: 'Abu Dhabi',
  initials: 'SM'
},
{
  quote:
  'I was skeptical that an AI could sell Free Zone licenses convincingly. Within a month KYLO had closed three deals while I was on holiday. I have not looked back.',
  name: 'Rajan Mehta',
  role: 'Director',
  company: 'Falcon Corporate',
  location: 'Dubai',
  initials: 'RM'
},
{
  quote:
  'Our WhatsApp inquiries used to sit unanswered overnight. Now KYLO replies in seconds, in both English and Arabic, and books consultations straight into our calendar.',
  name: 'Fatima Al Zaabi',
  role: 'Managing Partner',
  company: 'Gulf Gateway Consultants',
  location: 'Sharjah',
  initials: 'FZ'
},
{
  quote:
  'The agent knows the difference between a Mainland and a Free Zone license better than half the consultants I have interviewed. Clients get accurate answers instantly.',
  name: 'David Okafor',
  role: 'Operations Head',
  company: 'Meridian Business Setup',
  location: 'Dubai',
  initials: 'DO'
},
{
  quote:
  'KYLO paid for itself in the first week. It qualifies tyre-kickers and hands my team only the serious buyers — our closing rate has nearly doubled.',
  name: 'Aisha Rahman',
  role: 'Sales Director',
  company: 'Horizon Corporate Services',
  location: 'Abu Dhabi',
  initials: 'AR'
},
{
  quote:
  'Setup took an afternoon. We pasted one line of code, trained the agent on our packages, and it was selling licenses by the evening. Genuinely effortless.',
  name: 'Tariq Hassan',
  role: 'Founder',
  company: 'Nexus Formations',
  location: 'Dubai',
  initials: 'TH'
},
{
  quote:
  'Post-payment onboarding used to be our biggest headache. KYLO now walks every new client through document submission automatically. My team finally focuses on growth.',
  name: 'Priya Nair',
  role: 'Client Success Lead',
  company: 'Skyline Business Hub',
  location: 'Ras Al Khaimah',
  initials: 'PN'
},
{
  quote:
  'It carries our brand perfectly — our logo, our colours, our advisor name. Customers think they are chatting with a senior consultant. The experience feels premium.',
  name: 'Mohammed Al Suwaidi',
  role: 'Director',
  company: 'Capital Edge Advisory',
  location: 'Abu Dhabi',
  initials: 'MS'
}];

const TestimonialsColumn = ({
  className,
  items,
  duration = 16




}: {className?: string;items: typeof TESTIMONIALS;duration?: number;}) => {
  return (
    <div className={className}>
      <motion.ul
        animate={{
          translateY: '-50%'
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop'
        }}
        className="flex flex-col gap-4 sm:gap-6 pb-4 sm:pb-6 list-none m-0 p-0">
        
        {[0, 1].map((dup) =>
        <Fragment key={dup}>
            {items.map((t, i) =>
          <li
            key={`${dup}-${i}`}
            aria-hidden={dup === 1}
            className="group rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-soft dark:shadow-soft-dark p-5 sm:p-7 md:p-8 max-w-[260px] sm:max-w-xs w-full select-none">
            
                <div className="flex items-center gap-1 mb-3 sm:mb-4">
                  {[1, 2, 3, 4, 5].map((star) =>
              <Star
                key={star}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />

              )}
                </div>
                <p className="text-[13px] sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 mt-5 sm:mt-6">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-mint-100 dark:bg-navy-700 text-emerald-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs sm:text-sm ring-2 ring-mint-100 dark:ring-navy-700 group-hover:ring-emerald-200 dark:group-hover:ring-cyan-500/30 transition-all flex-shrink-0">
                    {t.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-[13px] sm:text-sm leading-tight">
                      {t.name}
                    </span>
                    <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.role}, {t.company}
                    </span>
                  </div>
                </div>
              </li>
          )}
          </Fragment>
        )}
      </motion.ul>
    </div>);

};
const TestimonialsRow = ({
  className,
  items,
  duration = 20,
  reverse = false





}: {className?: string;items: typeof TESTIMONIALS;duration?: number;reverse?: boolean;}) => {
  return (
    <div className={className}>
      <motion.ul
        animate={{
          translateX: reverse ? '50%' : '-50%'
        }}
        initial={{
          translateX: reverse ? '0%' : '0%'
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop'
        }}
        className="flex gap-4 pr-4 list-none m-0 p-0 w-max">
        
        {[0, 1].map((dup) =>
        <Fragment key={dup}>
            {items.map((t, i) =>
          <li
            key={`${dup}-${i}`}
            aria-hidden={dup === 1}
            className="group rounded-2xl border border-gray-100 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-soft dark:shadow-soft-dark p-5 w-[280px] flex-shrink-0 select-none">
            
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) =>
              <Star
                key={star}
                className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />

              )}
                </div>
                <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 mt-5">
                  <div className="w-9 h-9 rounded-full bg-mint-100 dark:bg-navy-700 text-emerald-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs ring-2 ring-mint-100 dark:ring-navy-700 transition-all flex-shrink-0">
                    {t.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-[13px] leading-tight">
                      {t.name}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.role}, {t.company}
                    </span>
                  </div>
                </div>
              </li>
          )}
          </Fragment>
        )}
      </motion.ul>
    </div>);

};
export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-10 sm:py-24 px-0 sm:px-6 max-w-7xl mx-auto relative z-10 overflow-hidden">
      
      <div className="px-4 sm:px-0">
        <SectionHeading
          eyebrow="SOCIAL PROOF"
          title="What UAE Agencies Say About KYLO"
          subtitle="Join the growing number of business setup consultants automating their sales and onboarding." />
        
      </div>

      {/* Desktop Vertical Marquee */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{
          once: true,
          amount: 0.15
        }}
        transition={{
          duration: 0.6
        }}
        className="hidden md:flex justify-center gap-6 mt-4 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] max-h-[680px] overflow-hidden"
        role="region"
        aria-label="Customer testimonials">
        
        <TestimonialsColumn items={TESTIMONIALS.slice(0, 3)} duration={20} />
        <TestimonialsColumn items={TESTIMONIALS.slice(3, 6)} duration={26} />
        <TestimonialsColumn
          items={TESTIMONIALS.slice(6, 9)}
          duration={23}
          className="hidden lg:block" />
        
      </motion.div>

      {/* Mobile Horizontal Marquee */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{
          once: true,
          amount: 0.15
        }}
        transition={{
          duration: 0.6
        }}
        className="flex md:hidden flex-col gap-4 mt-6 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] overflow-hidden w-full"
        role="region"
        aria-label="Customer testimonials">
        
        <TestimonialsRow items={TESTIMONIALS.slice(0, 5)} duration={35} />
        <TestimonialsRow
          items={TESTIMONIALS.slice(4, 9)}
          duration={40}
          reverse />
        
      </motion.div>
    </section>);

}
const FAQS = [
{
  q: 'Do I need a developer to set up KYLO?',
  a: 'No. You copy one line of code and paste it on your website. That is the only technical step. Everything else — your agent name, logo, color, and knowledge base — is managed from your dashboard with no coding.'
},
{
  q: 'Will my customers know the chat is AI?',
  a: "Only if you tell them. KYLO carries your agency's name, logo, and brand color. Your customers chat with your named advisor — KYLO is invisible behind the scenes."
},
{
  q: 'How does the agent learn about my services?',
  a: 'You add questions and answers directly to your Q&A Training panel in the dashboard. The more entries you add, the smarter and more accurate your agent becomes. We also include a global UAE business license knowledge base that all agents are trained on from day one.'
},
{
  q: 'Can KYLO work on WhatsApp too?',
  a: 'Yes. KYLO connects to your WhatsApp Business number through the Meta Cloud API. The same agent that runs on your website responds to WhatsApp messages automatically with the same intelligence and lead capture capability.'
},
{
  q: 'How quickly can I go live?',
  a: 'Most clients are fully live within 48 hours of signing up. Choose your plan, access your dashboard, customize your agent, copy the embed code, and you are done.'
},
{
  q: 'What happens after a customer pays through the chat?',
  a: 'The moment payment is confirmed, KYLO automatically activates a post-purchase onboarding agent that guides the customer through document submission, license application steps, and process timelines — no manual follow-up required from your team.'
}];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section
      id="faq"
      className="py-10 sm:py-24 px-4 sm:px-6 bg-white/80 dark:bg-navy-900/50 backdrop-blur-sm relative z-10">
      
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about deploying your AI sales agent." />
        
        <div className="space-y-3">
          {FAQS.map((faq, i) =>
          <motion.div
            key={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{
              once: true
            }}
            transition={{
              delay: i * 0.1
            }}
            className="bento-card p-1 sm:p-2 cursor-pointer"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            
              <div className="flex items-center justify-between p-3 sm:p-4">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base pr-4">
                  {faq.q}
                </h4>
                <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${openIndex === i ? 'rotate-180' : ''}`} />
              
              </div>
              <AnimatePresence>
                {openIndex === i &&
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0
                }}
                animate={{
                  height: 'auto',
                  opacity: 1
                }}
                exit={{
                  height: 0,
                  opacity: 0
                }}
                transition={{
                  duration: 0.3
                }}
                className="overflow-hidden">
                
                    <div className="p-3 sm:p-4 pt-0 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
              }
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}
export function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section
      id="contact"
      className="py-10 sm:py-24 px-4 sm:px-6 bg-white/80 dark:bg-navy-900/50 backdrop-blur-sm relative z-10">
      
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          eyebrow="Contact"
          title="Let's talk"
          subtitle="Questions, demos, or enterprise needs — our team replies within a day." />
        
        <motion.form
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{
            once: true,
            amount: 0.3
          }}
          transition={{
            duration: 0.5
          }}
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="bento-card grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div>
            <label className="label-text">Name</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Jane Doe" />
            
          </div>
          <div>
            <label className="label-text">Work email</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="jane@company.com" />
            
          </div>
          <div className="sm:col-span-2">
            <label className="label-text">How can we help?</label>
            <textarea
              required
              rows={4}
              className="input-field resize-none"
              placeholder="Tell us about your use case..." />
            
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-4 flex-wrap">
            {sent ?
            <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-cyan-400">
                <CheckCircle2 size={18} /> Thanks — we'll be in touch shortly!
              </span> :

            <span className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-2">
                <Mail size={14} /> hello@nexusai.com
              </span>
            }
            <button type="submit" className="btn-primary text-sm px-6">
              Send message <ArrowRight size={16} />
            </button>
          </div>
        </motion.form>
      </div>
    </section>);

}
function SectionHeading({
  eyebrow,
  title,
  subtitle




}: {eyebrow: string;title: string;subtitle: string;}) {
  const ref = useRef(null);
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{
        once: true,
        amount: 0.5
      }}
      transition={{
        duration: 0.5
      }}
      className="text-center mb-6 sm:mb-12 max-w-2xl mx-auto">
      
      <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-cyan-400 mb-3">
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
        {title}
      </h2>
      <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
        {subtitle}
      </p>
    </motion.div>);

}