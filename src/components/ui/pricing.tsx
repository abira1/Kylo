import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ShineBorder } from './shine-border';
export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  tag?: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}
interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}
export function Pricing({
  plans,
  title = 'One Platform. Three Plans. No Surprises.',
  description = 'All plans include your personal dashboard, the AI agent, WhatsApp integration, lead capture, and Stripe payments. Choose the plan that matches your agency size.'
}: PricingProps) {
  const isDesktop = useIsDesktop();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto">
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-cyan-400 mb-3">
          SIMPLE PRICING
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
          {title}
        </h2>
        <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto items-center">
        {plans.map((plan, index) => {
          return (
            <motion.div
              key={index}
              initial={{
                y: 50,
                opacity: 0
              }}
              whileInView={
              isDesktop ?
              {
                y: plan.isPopular ? -16 : 0,
                opacity: 1,
                x: index === 2 ? -20 : index === 0 ? 20 : 0,
                scale: index === 0 || index === 2 ? 0.96 : 1.0
              } :
              {
                y: 0,
                opacity: 1
              }
              }
              viewport={{
                once: true
              }}
              transition={{
                duration: 1.2,
                type: 'spring',
                stiffness: 100,
                damping: 30,
                delay: 0.2,
                opacity: {
                  duration: 0.4
                }
              }}
              className={`relative ${plan.isPopular ? 'z-10' : 'z-0'}`}>
              
              <ShineBorder
                className={`bento-card p-4 sm:p-6 relative flex flex-col text-center h-full ${plan.isPopular ? 'border-2 border-emerald-500 dark:border-cyan-500 shadow-xl' : 'border border-gray-100 dark:border-navy-800'}`}>
                
                {plan.isPopular &&
                <div className="absolute top-0 right-0 bg-emerald-500 dark:bg-cyan-500 py-1 px-2.5 rounded-bl-xl rounded-tr-[20px] flex items-center gap-1">
                    <Star className="text-white h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                    <span className="text-white text-[10px] sm:text-xs font-bold">
                      Popular
                    </span>
                  </div>
                }

                <div className="flex-1 flex flex-col">
                  <p className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {plan.name}
                  </p>

                  <div className="mt-2 sm:mt-5 flex items-center justify-center gap-x-1 sm:gap-x-2">
                    <span className="text-2xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    {plan.period &&
                    <span className="text-xs sm:text-sm font-semibold leading-6 tracking-wide text-gray-500 dark:text-gray-400">
                        / {plan.period}
                      </span>
                    }
                  </div>

                  {plan.tag &&
                  <p className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-cyan-400 mt-1.5 sm:mt-2 bg-mint-50 dark:bg-navy-800/50 py-1 px-2 sm:px-3 rounded-full mx-auto w-fit">
                      {plan.tag}
                    </p>
                  }

                  <ul className="mt-4 sm:mt-6 gap-1.5 sm:gap-2.5 flex flex-col text-left">
                    {plan.features.map((feature, idx) =>
                    <li
                      key={idx}
                      className="flex items-start gap-1.5 sm:gap-2.5">
                      
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                          {feature}
                        </span>
                      </li>
                    )}
                  </ul>

                  <hr className="w-full my-4 sm:my-5 border-gray-100 dark:border-navy-800" />

                  <div className="mt-auto">
                    {plan.href.startsWith('#') ?
                    <a
                      href={plan.href}
                      className={`w-full text-center py-2 sm:py-3 text-[13px] sm:text-base ${plan.isPopular ? 'btn-primary' : 'btn-secondary'}`}>
                      
                        {plan.buttonText}
                      </a> :

                    <Link
                      to={plan.href}
                      className={`w-full text-center py-2 sm:py-3 text-[13px] sm:text-base ${plan.isPopular ? 'btn-primary' : 'btn-secondary'}`}>
                      
                        {plan.buttonText}
                      </Link>
                    }
                  </div>
                </div>
              </ShineBorder>
            </motion.div>);

        })}
      </div>

      <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        All plans come with a 7-day free trial. No credit card required to
        start. Cancel anytime.
        <br className="hidden sm:block" />
        Need a custom quote for your agency? Contact us at{' '}
        <a
          href="mailto:hello@kylo.ae"
          className="text-emerald-600 dark:text-cyan-400 font-medium hover:underline">
          
          hello@kylo.ae
        </a>
      </div>
    </div>);

}