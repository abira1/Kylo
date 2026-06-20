import React, { Component } from 'react';
import { cn } from '../../lib/utils';
import { GridPattern } from './grid-pattern';
export function GridCard({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'group bg-white dark:bg-navy-800 relative isolate z-0 flex h-full flex-col justify-between overflow-hidden rounded-xl border border-gray-100 dark:border-navy-700 px-5 py-4 transition-colors duration-300 hover:border-emerald-500/30 dark:hover:border-cyan-500/30',
        className
      )}
      {...props}>
      
      <div className="absolute inset-0 z-[-1]">
        <div className="absolute -inset-[25%] -skew-y-12 [mask-image:linear-gradient(225deg,black,transparent)]">
          <GridPattern
            width={30}
            height={30}
            x={0}
            y={0}
            squares={getRandomPattern(5)}
            className="fill-emerald-500/5 stroke-emerald-500/10 dark:fill-cyan-500/5 dark:stroke-cyan-500/10 absolute inset-0 size-full translate-y-2 transition-transform duration-300 ease-out group-hover:translate-y-0" />
          
        </div>
        <div
          className={cn(
            'absolute -inset-[10%] opacity-0 blur-[50px] transition-opacity duration-300 group-hover:opacity-20 dark:group-hover:opacity-10',
            'bg-[conic-gradient(from_90deg_at_50%_50%,#10b981_0%,#06b6d4_50%,#10b981_100%)]'
          )} />
        
      </div>
      {children}
    </div>);

}
function getRandomPattern(length?: number): [x: number, y: number][] {
  length = length ?? 5;
  return Array.from(
    {
      length
    },
    () => [
    Math.floor(Math.random() * 4) + 7,
    Math.floor(Math.random() * 6) + 1 // random y between 1 and 6
    ]
  );
}