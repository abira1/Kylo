import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  Zap,
  Sparkles,
  Brain,
  Lightbulb,
  SendHorizontal,
  Paperclip,
  Image as ImageIcon,
  FileCode } from
'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
interface Model {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}
const MODELS: Model[] = [
{
  id: 'kylo-pro',
  name: 'KYLO Pro',
  description: 'Fast & intelligent',
  icon: <Zap className="w-4 h-4 text-emerald-500 dark:text-cyan-400" />,
  badge: 'Default'
},
{
  id: 'kylo-max',
  name: 'KYLO Max',
  description: 'Most capable',
  icon: <Sparkles className="w-4 h-4 text-turquoise-500" />,
  badge: 'Pro'
},
{
  id: 'kylo-lite',
  name: 'KYLO Lite',
  description: 'Lightning fast',
  icon: <Brain className="w-4 h-4 text-emerald-500 dark:text-cyan-400" />
}];

function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(MODELS[0]);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95">
        
        {selected.icon}
        <span>{selected.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        
      </button>
      {isOpen &&
      <>
          <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)} />
        
          <div className="absolute bottom-full left-0 mb-2 z-50 min-w-[220px] bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700 rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden p-1.5">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Select Model
            </div>
            {MODELS.map((model) =>
          <button
            key={model.id}
            type="button"
            onClick={() => {
              setSelected(model);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all ${selected.id === model.id ? 'bg-mint-100 dark:bg-navy-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            
                <div className="flex-shrink-0">{model.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{model.name}</span>
                    {model.badge &&
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${model.badge === 'Pro' ? 'bg-turquoise-100 text-turquoise-700 dark:bg-turquoise-900/30 dark:text-turquoise-300' : 'bg-mint-100 text-emerald-700 dark:bg-cyan-900/30 dark:text-cyan-300'}`}>
                  
                        {model.badge}
                      </span>
                }
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {model.description}
                  </span>
                </div>
                {selected.id === model.id &&
            <Check className="w-4 h-4 text-emerald-500 dark:text-cyan-400 flex-shrink-0" />
            }
              </button>
          )}
          </div>
        </>
      }
    </div>);

}
function PromptBox({ onSubmit }: {onSubmit: (msg: string) => void;}) {
  const [message, setMessage] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
    }
  }, [message]);
  const submit = () => {
    onSubmit(message);
  };
  return (
    <div className="relative w-full max-w-[680px] mx-auto text-left">
      <div className="absolute -inset-[1.5px] rounded-3xl bg-gradient-to-r from-emerald-500/40 via-turquoise-400/40 to-cyan-500/40 dark:from-cyan-500/40 dark:via-emerald-400/40 dark:to-turquoise-500/40 opacity-70 blur-[2px]" />
      <div className="relative rounded-3xl bg-white dark:bg-navy-800 ring-1 ring-gray-100 dark:ring-navy-700 shadow-soft dark:shadow-soft-dark">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Free Zone? Mainland? Visa? Ask me anything..."
          className="w-full resize-none bg-transparent text-[15px] text-gray-900 dark:text-white placeholder-gray-400 px-5 pt-5 pb-2 focus:outline-none min-h-[72px] max-h-[180px]"
          style={{
            height: '72px'
          }} />
        
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttach(!showAttach)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95">
                
                <Plus
                  className={`w-4 h-4 transition-transform ${showAttach ? 'rotate-45' : ''}`} />
                
              </button>
              {showAttach &&
              <>
                  <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowAttach(false)} />
                
                  <div className="absolute bottom-full left-0 mb-2 z-50 bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700 rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden p-1.5 min-w-[180px]">
                    {[
                  {
                    icon: <Paperclip className="w-4 h-4" />,
                    label: 'Upload file'
                  },
                  {
                    icon: <ImageIcon className="w-4 h-4" />,
                    label: 'Add image'
                  },
                  {
                    icon: <FileCode className="w-4 h-4" />,
                    label: 'Import docs'
                  }].
                  map((item, i) =>
                  <button
                    key={i}
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all">
                    
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </button>
                  )}
                  </div>
                </>
              }
            </div>
            <ModelSelector />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
              
              <Lightbulb className="w-4 h-4" />
              <span>Plan</span>
            </button>
            <button
              type="button"
              onClick={submit}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500 dark:bg-cyan-500 text-white dark:text-navy-900 transition-all active:scale-95 shadow-soft hover:opacity-90">
              
              <span className="hidden sm:inline">Build now</span>
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>);

}
function ScrollRevealImage({ light, dark }: {light: string;dark: string;}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center']
  });
  const rotate = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0.92, 1] : [1.04, 1]
  );
  const translateY = useTransform(scrollYProgress, [0, 1], [40, 0]);
  return (
    <div
      ref={ref}
      className="mt-12 sm:mt-20 relative z-10 max-w-5xl mx-auto"
      style={{
        perspective: '1000px'
      }}>
      
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent dark:from-cyan-500/20 blur-3xl -z-10 rounded-full" />
      <motion.div
        style={{
          rotateX: rotate,
          scale,
          translateY
        }}
        className="rounded-xl sm:rounded-2xl md:rounded-[28px] border-2 sm:border-4 md:border-[6px] border-gray-200/80 dark:border-navy-700 bg-white/60 dark:bg-navy-800/60 backdrop-blur-xl p-1.5 sm:p-2 md:p-3 shadow-2xl">
        
        <img
          src={light}
          className="w-full h-auto object-contain rounded-lg sm:rounded-xl md:rounded-2xl dark:hidden"
          alt="Dashboard preview"
          draggable={false} />
        
        <img
          src={dark}
          className="w-full h-auto object-contain rounded-lg sm:rounded-xl md:rounded-2xl hidden dark:block"
          alt="Dashboard preview"
          draggable={false} />
        
      </motion.div>
    </div>);

}
interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: string;
  subtitle?: {
    regular: string;
    gradient: string;
  };
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  bottomImage?: {
    light: string;
    dark: string;
  };
  gridOptions?: {
    angle?: number;
    cellSize?: number;
    opacity?: number;
    lightLineColor?: string;
    darkLineColor?: string;
  };
}
const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = '#cbd5e1',
  darkLineColor = '#1e293b'
}) => {
  const gridStyles = {
    '--grid-angle': `${angle}deg`,
    '--cell-size': `${cellSize}px`,
    '--opacity': opacity,
    '--light-line': lightLineColor,
    '--dark-line': darkLineColor
  } as React.CSSProperties;
  return (
    <div
      className="pointer-events-none absolute size-full overflow-hidden [perspective:200px] opacity-[var(--opacity)]"
      style={gridStyles}>
      
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] to-transparent to-90% dark:from-navy-950" />
    </div>);

};
export const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(
  (
  {
    className = '',
    badge = 'KYLO-AI 2.0 is now live',
    subtitle = {
      regular: 'Automate your business with ',
      gradient: 'Intelligent AI'
    },
    description = 'Deploy custom-trained AI chatbots to your website and WhatsApp in minutes. Capture leads, automate support, and drive sales 24/7.',
    ctaText = 'Start Free Trial',
    ctaHref = '/register',
    secondaryCtaText = 'Book a Demo',
    secondaryCtaHref = '#demo',
    bottomImage = {
      light:
      'https://i.postimg.cc/J40r9fRc/Macbook-Air-project-ai-chatbot-saas-platform-344-magicpatterns-app-(1).png',
      dark: 'https://i.postimg.cc/zvjy0KSB/Macbook-Air-project-ai-chatbot-saas-platform-344-magicpatterns-app.png'
    },
    gridOptions,
    ...props
  },
  ref) =>
  {
    const navigate = useNavigate();
    return (
      <div className={`relative ${className}`} ref={ref} {...props}>
        <section className="relative max-w-full mx-auto z-[1]">
          <div className="max-w-screen-xl z-10 mx-auto px-4 pt-24 pb-12 sm:py-28 gap-12 md:px-8">
            <div className="space-y-5 max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-emerald-700 dark:text-cyan-400 group font-bold mx-auto px-4 py-1.5 bg-mint-100 dark:bg-navy-800 border border-emerald-500/10 dark:border-cyan-500/10 rounded-3xl w-fit shadow-sm">
                {badge}
                <ChevronRight className="inline w-4 h-4 group-hover:translate-x-1 duration-300" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tighter font-extrabold mx-auto text-gray-900 dark:text-white">
                {subtitle.regular}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-turquoise-500 dark:from-cyan-400 dark:to-emerald-400">
                  {subtitle.gradient}
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                {description}
              </p>
              <div className="pt-4">
                <PromptBox onSubmit={() => navigate(ctaHref)} />
                <div className="flex items-center justify-center gap-3 mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => navigate(ctaHref)}
                    className="font-bold text-emerald-600 dark:text-cyan-400 hover:underline">
                    
                    {ctaText}
                  </button>
                  <span className="text-gray-300 dark:text-navy-600">·</span>
                  <a
                    href={secondaryCtaHref}
                    className="font-medium hover:text-gray-900 dark:hover:text-white transition-colors">
                    
                    {secondaryCtaText}
                  </a>
                </div>
              </div>
            </div>
            {bottomImage &&
            <ScrollRevealImage
              light={bottomImage.light}
              dark={bottomImage.dark} />

            }
          </div>
        </section>
      </div>);

  }
);
HeroSection.displayName = 'HeroSection';