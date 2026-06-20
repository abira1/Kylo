import React from 'react';
type TColorProp = string | string[];
interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
/**
 * ShineBorder
 * An animated, configurable glowing border overlay that wraps any content.
 * The wrapper is transparent by default so it can be placed around existing
 * cards/containers without overriding their background or padding.
 */
export function ShineBorder({
  borderRadius = 24,
  borderWidth = 1.5,
  duration = 14,
  color = ['#22C55E', '#38BDF8', '#22D3EE'],
  className,
  children
}: ShineBorderProps) {
  return (
    <div
      style={
      {
        '--border-radius': `${borderRadius}px`
      } as React.CSSProperties
      }
      className={cn('relative w-full rounded-[--border-radius]', className)}>
      
      <div
        style={
        {
          '--border-width': `${borderWidth}px`,
          '--border-radius': `${borderRadius}px`,
          '--duration': `${duration}s`,
          '--mask-linear-gradient': `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          '--background-radial-gradient': `radial-gradient(transparent,transparent, ${color instanceof Array ? color.join(',') : color},transparent,transparent)`
        } as React.CSSProperties
        }
        className={`pointer-events-none before:absolute before:inset-0 before:size-full before:rounded-[--border-radius] before:p-[--border-width] before:will-change-[background-position] before:content-[""] before:![-webkit-mask-composite:xor] before:![mask-composite:exclude] before:[background-image:--background-radial-gradient] before:[background-size:300%_300%] before:[mask:--mask-linear-gradient] motion-safe:before:animate-shine`} />
      
      {children}
    </div>);

}