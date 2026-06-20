import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeProvider';
import {
  Grid2x2PlusIcon,
  GlobeIcon,
  LayersIcon,
  UserPlusIcon,
  Users,
  Star,
  FileText,
  Shield,
  RotateCcw,
  Handshake,
  Leaf,
  HelpCircle,
  DollarSign,
  BarChart,
  PlugIcon,
  MenuIcon,
  XIcon,
  Moon,
  Sun,
  MessageSquare,
  Zap,
  CheckCircle2,
  MessageCircle,
  Mail } from
'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from './sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuLink,
  type NavItemType,
  NavGridCard,
  NavSmallItem,
  NavLargeItem,
  NavItemMobile } from
'./navigation-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
'./accordion';
import { cn } from '../../lib/utils';
export const productLinks: NavItemType[] = [
{
  title: 'Features',
  href: '#features',
  description: 'Everything your sales team does, automated.',
  icon: Zap
},
{
  title: 'How It Works',
  href: '#how-it-works',
  description: 'Up and running in three simple steps.',
  icon: LayersIcon
},
{
  title: 'Why KYLO',
  href: '#why-us',
  description: 'Built specifically for UAE business license agencies.',
  icon: Shield
},
{
  title: 'Testimonials',
  href: '#testimonials',
  icon: Star
},
{
  title: 'FAQ',
  href: '#faq',
  icon: HelpCircle
}];

export const companyLinks: NavItemType[] = [
{
  title: 'About Us',
  href: '#',
  description: 'Learn more about our story and team',
  icon: Users
},
{
  title: 'Contact',
  href: '#contact',
  description: 'Get in touch with our support team',
  icon: Mail
},
{
  title: 'Privacy Policy',
  href: '#',
  description: 'How we protect your information',
  icon: Shield
},
{
  title: 'Terms of Service',
  href: '#',
  description: 'Understand how we operate',
  icon: FileText
}];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="fixed top-0 w-full glass-nav px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center z-50">
      <div className="flex items-center gap-2 sm:gap-3">
        <img
          src="https://i.postimg.cc/FzSqZJPg/97724688056.png"
          alt="KYLO-AI"
          className="h-7 sm:h-8 w-auto dark:hidden" />
        
        <img
          src="https://i.postimg.cc/gjRDJSW5/high-level-description-a-dark-mode-wordm-As-Wztl-DXWm-G91n-AY-i-MLQ-b-Wl27DVTe6f8Pxy6g-Wv-Lw.png"
          alt="KYLO-AI"
          className="h-7 sm:h-8 w-auto hidden dark:block" />
        
      </div>

      <div className="hidden md:flex items-center justify-center flex-1 mx-8">
        <DesktopMenu />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-600 dark:text-gray-300 transition-colors">
          
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <Link
          to="/login"
          className="hidden sm:block text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-cyan-400 transition-colors">
          
          Sign In
        </Link>
        <Link
          to="/register"
          className="btn-primary text-xs sm:text-sm px-4 py-2 hidden sm:flex">
          
          Get Started
        </Link>
        <MobileNav />
      </div>
    </nav>);

}
function DesktopMenu() {
  return (
    <NavigationMenu className="hidden lg:block">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-full md:w-[600px] md:grid-cols-[1fr_.40fr]">
              <ul className="grid grow gap-4 p-4 md:grid-cols-2 md:border-r border-gray-100 dark:border-navy-800">
                {productLinks.slice(0, 3).map((link) =>
                <li
                  key={link.href}
                  className={link.title === 'Features' ? 'col-span-2' : ''}>
                  
                    <NavGridCard
                    link={link}
                    className={
                    link.title === 'Features' ? 'min-h-[120px]' : ''
                    } />
                  
                  </li>
                )}
              </ul>
              <ul className="space-y-1 p-4">
                {productLinks.slice(3).map((link) =>
                <li key={link.href}>
                    <NavSmallItem
                    item={link}
                    href={link.href}
                    className="gap-x-1" />
                  
                  </li>
                )}
              </ul>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-full md:w-[500px] md:grid-cols-[1fr_.50fr]">
              <ul className="grid grow grid-cols-1 gap-4 p-4 md:border-r border-gray-100 dark:border-navy-800">
                {companyLinks.slice(0, 2).map((link) =>
                <li key={link.href}>
                    <NavGridCard link={link} className="min-h-[100px]" />
                  </li>
                )}
              </ul>
              <ul className="space-y-2 p-4">
                {companyLinks.slice(2).map((link) =>
                <li key={link.href}>
                    <NavLargeItem href={link.href} link={link} />
                  </li>
                )}
              </ul>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink
            href="#pricing"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold px-4 py-2">
            
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>);

}
function MobileNav() {
  const sections = [
  {
    id: 'product',
    name: 'Product',
    list: productLinks
  },
  {
    id: 'company',
    name: 'Company',
    list: companyLinks
  }];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-600 dark:text-gray-300 transition-colors lg:hidden">
          <MenuIcon className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        className="bg-white/95 dark:bg-navy-900/95 supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-navy-900/80 w-full gap-0 backdrop-blur-xl border-l border-gray-100 dark:border-navy-800"
        showClose={false}>
        
        <div className="flex h-16 items-center justify-between border-b border-gray-100 dark:border-navy-800 px-4">
          <img
            src="https://i.postimg.cc/FzSqZJPg/97724688056.png"
            alt="KYLO-AI"
            className="h-6 w-auto dark:hidden" />
          
          <img
            src="https://i.postimg.cc/gjRDJSW5/high-level-description-a-dark-mode-wordm-As-Wztl-DXWm-G91n-AY-i-MLQ-b-Wl27DVTe6f8Pxy6g-Wv-Lw.png"
            alt="KYLO-AI"
            className="h-6 w-auto hidden dark:block" />
          
          <SheetClose asChild>
            <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-600 dark:text-gray-300 transition-colors">
              <XIcon className="size-5" />
              <span className="sr-only">Close</span>
            </button>
          </SheetClose>
        </div>
        <div className="container grid gap-y-2 overflow-y-auto px-4 pt-5 pb-12">
          <Accordion type="single" collapsible className="w-full">
            {sections.map((section) =>
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border-gray-100 dark:border-navy-800">
              
                <AccordionTrigger className="capitalize hover:no-underline text-gray-900 dark:text-white font-bold py-4">
                  {section.name}
                </AccordionTrigger>
                <AccordionContent className="space-y-1 pb-4">
                  <ul className="grid gap-2">
                    {section.list.map((link) =>
                  <li key={link.href}>
                        <SheetClose asChild>
                          <NavItemMobile item={link} href={link.href} />
                        </SheetClose>
                      </li>
                  )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-navy-800 flex flex-col gap-3">
            <SheetClose asChild>
              <a
                href="#pricing"
                className="text-gray-900 dark:text-white font-bold py-2 px-2 hover:bg-gray-50 dark:hover:bg-navy-800 rounded-xl transition-colors">
                
                Pricing
              </a>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/login"
                className="text-gray-900 dark:text-white font-bold py-2 px-2 hover:bg-gray-50 dark:hover:bg-navy-800 rounded-xl transition-colors">
                
                Sign In
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link to="/register" className="btn-primary mt-2 py-3">
                Get Started
              </Link>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>);

}