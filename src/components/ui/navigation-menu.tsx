import React, { Component } from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { ArrowRightIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GridCard } from './grid-card';
type NavItemType = {
  title: string;
  href: string;
  description?: string;
  icon?: ComponentType<React.SVGProps<SVGSVGElement>>;
};
function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props


}: ComponentProps<typeof NavigationMenuPrimitive.Root> & {viewport?: boolean;}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        'group/navigation-menu flex max-w-max flex-1 items-center justify-center',
        className
      )}
      {...props}>
      
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>);

}
function NavigationMenuList({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        'group flex flex-1 list-none items-center justify-center gap-1',
        className
      )}
      {...props} />);


}
function NavigationMenuItem({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn('relative', className)}
      {...props} />);


}
function NavigationMenuTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        'group hover:bg-gray-100 dark:hover:bg-navy-800 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-navy-800 focus:text-gray-900 dark:focus:text-white data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-navy-800 data-[state=open]:text-gray-900 dark:data-[state=open]:text-white inline-flex w-max items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 text-gray-600 dark:text-gray-300',
        className
      )}
      {...props}>
      
      {children}{' '}
      <ChevronDownIcon
        className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true" />
      
    </NavigationMenuPrimitive.Trigger>);

}
function NavigationMenuContent({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        'data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 top-0 left-0 w-full md:absolute md:w-auto',
        'group-data-[viewport=false]/navigation-menu:bg-white dark:group-data-[viewport=false]/navigation-menu:bg-navy-900 group-data-[viewport=false]/navigation-menu:text-gray-900 dark:group-data-[viewport=false]/navigation-menu:text-white group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-2xl group-data-[viewport=false]/navigation-menu:border border-gray-100 dark:border-navy-800 group-data-[viewport=false]/navigation-menu:shadow-soft dark:group-data-[viewport=false]/navigation-menu:shadow-soft-dark group-data-[viewport=false]/navigation-menu:duration-300',
        className
      )}
      {...props} />);


}
function NavigationMenuViewport({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 isolate z-50 flex justify-center">
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          'origin-top-center bg-white/95 dark:bg-navy-900/95 supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-navy-900/80 text-gray-900 dark:text-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-3 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-2xl border border-gray-100 dark:border-navy-800 shadow-soft dark:shadow-soft-dark backdrop-blur-xl md:w-[var(--radix-navigation-menu-viewport-width)]',
          className
        )}
        {...props} />
      
    </div>);

}
function NavigationMenuLink({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        'data-[active=true]:bg-gray-100 dark:data-[active=true]:bg-navy-800 data-[active=true]:text-gray-900 dark:data-[active=true]:text-white hover:bg-gray-50 dark:hover:bg-navy-800/50 hover:text-gray-900 dark:hover:text-white focus:bg-gray-50 dark:focus:bg-navy-800/50 focus:text-gray-900 dark:focus:text-white flex flex-col justify-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors outline-none',
        className
      )}
      {...props} />);


}
function NavigationMenuIndicator({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        'data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-[1] flex h-3 items-end justify-center overflow-hidden',
        className
      )}
      {...props}>
      
      <div className="bg-gray-100 dark:bg-navy-800 relative top-[60%] h-2.5 w-2.5 rotate-45 rounded-tl-sm shadow-md" />
    </NavigationMenuPrimitive.Indicator>);

}
function NavGridCard({
  link,
  ...props


}: ComponentProps<'div'> & {link: NavItemType;}) {
  return (
    <NavigationMenuPrimitive.Link asChild>
      <GridCard {...props} className={cn('cursor-pointer', props.className)}>
        {link.icon &&
        <link.icon className="text-emerald-600 dark:text-cyan-400 relative size-6 mb-3" />
        }
        <div className="relative">
          <span className="text-gray-900 dark:text-white text-sm font-bold">
            {link.title}
          </span>
          {link.description &&
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs font-medium leading-relaxed">
              {link.description}
            </p>
          }
        </div>
      </GridCard>
    </NavigationMenuPrimitive.Link>);

}
function NavSmallItem({
  item,
  className,
  ...props


}: ComponentProps<typeof NavigationMenuLink> & {item: Omit<NavItemType, 'description'>;}) {
  return (
    <NavigationMenuLink
      className={cn(
        'group relative h-max flex-row items-center gap-x-3 px-3 py-2.5',
        className
      )}
      {...props}>
      
      {item.icon &&
      <item.icon className="size-4 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-cyan-400 transition-colors" />
      }
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
        {item.title}
      </p>
      <div className="relative ml-auto flex h-full w-4 items-center">
        <ArrowRightIcon className="size-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 text-emerald-500 dark:text-cyan-400" />
      </div>
    </NavigationMenuLink>);

}
function NavLargeItem({
  link,
  className,
  ...props


}: ComponentProps<typeof NavigationMenuLink> & {link: NavItemType;}) {
  return (
    <NavigationMenuLink
      className={cn(
        'bg-white dark:bg-navy-800 group relative flex flex-col justify-center border border-gray-100 dark:border-navy-700 p-0 hover:border-emerald-500/30 dark:hover:border-cyan-500/30 overflow-hidden',
        className
      )}
      {...props}>
      
      <div className="flex items-center justify-between px-5 py-4">
        <div className="space-y-1 pr-4">
          <span className="text-sm leading-none font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-cyan-400 transition-colors">
            {link.title}
          </span>
          {link.description &&
          <p className="text-gray-500 dark:text-gray-400 line-clamp-1 text-xs font-medium mt-1">
              {link.description}
            </p>
          }
        </div>
        {link.icon &&
        <link.icon className="text-gray-400 dark:text-gray-500 size-5 group-hover:text-emerald-500 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0" />
        }
      </div>
    </NavigationMenuLink>);

}
function NavItemMobile({
  item,
  className,
  ...props


}: ComponentProps<'a'> & {item: NavItemType;}) {
  return (
    <a
      className={cn(
        'group relative flex gap-1 gap-x-3 rounded-xl p-2 text-sm transition-all outline-none hover:bg-gray-50 dark:hover:bg-navy-800',
        className
      )}
      {...props}>
      
      <div
        className={cn(
          'bg-mint-50 dark:bg-navy-800 flex size-10 items-center justify-center rounded-lg border border-emerald-100 dark:border-navy-700 flex-shrink-0'
        )}>
        
        {item.icon &&
        <item.icon className="size-5 text-emerald-600 dark:text-cyan-400" />
        }
      </div>
      <div className={cn('flex h-10 flex-col justify-center')}>
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {item.title}
        </p>
        {item.description &&
        <span className="text-gray-500 dark:text-gray-400 line-clamp-1 text-xs font-medium leading-snug mt-0.5">
            {item.description}
          </span>
        }
      </div>
    </a>);

}
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  NavGridCard,
  NavSmallItem,
  NavLargeItem,
  NavItemMobile,
  type NavItemType };